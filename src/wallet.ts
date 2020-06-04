import { ethers } from "ethers";
import { State } from "./state";
import { IDeployedContracts, IWalletOptions, IEthereum } from "./types";
import { Memory, Local } from "./backend";

const NETWORKS = ["homestead", "rinkeby", "ropsten", "kovan", "goerli"];

declare global {
  interface Window {
    ethereum: IEthereum;
  }
}

export async function wallet(options: IWalletOptions = {}) {
  let { endpoint, mnemonic, privateKey, index, backend } = options;
  index = index === undefined ? 0 : index;

  let provider;
  let ethersWallet;
  let signer;
  let address;
  let networkId;

  if (backend === undefined) {
    if (typeof process !== "undefined" && process?.versions?.node) {
      backend = new Memory();
    } else {
      backend = new Local("etherea-v0.0.1:");
    }
  }

  const state = new State(backend);

  function getDefaultWallet() {
    let result;
    if (mnemonic) {
      result = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + index);
    } else if (privateKey) {
      result = new ethers.Wallet(privateKey);
    } else if (state.hasMnemonic()) {
      result = ethers.Wallet.fromMnemonic(
        state.getMnemonic(),
        "m/44'/60'/0'/0/" + index
      );
    } else {
      result = ethers.Wallet.createRandom();
      state.setMnemonic(result.mnemonic.phrase);
    }
    return result;
  }

  if (endpoint === undefined) {
    if (typeof window !== "undefined" && window?.ethereum) {
      endpoint = window.ethereum;
    } else {
      endpoint = "homestead";
    }
  } else if (endpoint === "localhost") {
    endpoint = "http://localhost:8545";
  }

  if (typeof endpoint === "string") {
    if (NETWORKS.includes(endpoint)) {
      provider = ethers.getDefaultProvider(endpoint);
      ethersWallet = getDefaultWallet();
      ethersWallet = ethersWallet.connect(provider);
      address = ethersWallet.address;
      signer = ethersWallet;
    } else if (endpoint.startsWith("http")) {
      provider = new ethers.providers.JsonRpcProvider(endpoint);
      if (mnemonic || privateKey) {
        ethersWallet = getDefaultWallet();
        ethersWallet = ethersWallet.connect(provider);
        address = ethersWallet.address;
        signer = ethersWallet;
      } else {
        const accounts = await provider.listAccounts();
        if (accounts.length === 0) {
          ethersWallet = getDefaultWallet();
          ethersWallet = ethersWallet.connect(provider);
          address = ethersWallet.address;
          signer = ethersWallet;
        } else if (accounts[index] !== undefined) {
          address = accounts[index];
          signer = provider.getSigner(index);
        } else {
          throw new Error("Cannot load account number" + index);
        }
      }
    } else {
      throw new Error("Unknown endpoint " + endpoint);
    }
  } else {
    try {
      await endpoint.enable();
    } catch (e) {
      if (e.code === 4001 || e.error?.code === -32500) {
        throw new Error("Permission denied");
      } else {
        throw e;
      }
    }
    provider = new ethers.providers.Web3Provider(endpoint);
    signer = provider.getSigner();
    address = (await provider.listAccounts())[0];
  }
  networkId = (await provider.getNetwork()).chainId;

  return new Wallet(state, address, provider, signer, networkId, ethersWallet);
}

export class Wallet {
  state: State;
  address: string;
  signer: ethers.Signer;
  provider: ethers.providers.Provider;
  networkId: number;
  wallet?: ethers.Wallet;

  contracts?: { [name: string]: ethers.Contract };

  constructor(
    state: State,
    address: string,
    provider: ethers.providers.Provider,
    signer: ethers.Signer,
    networkId: number,
    wallet?: ethers.Wallet
  ) {
    this.state = state;
    this.address = address;
    this.provider = provider;
    this.signer = signer;
    this.networkId = networkId;
    this.wallet = wallet;
  }

  async deploy(abi: string, bytecode: string, ...args: any[]) {
    const factory = new ethers.ContractFactory(abi, bytecode, this.signer);
    const contract = await factory.deploy(...args);
    await contract.deployed();
    return contract;
  }

  contract(address: string, abi: string) {
    const contract = new ethers.Contract(address, abi, this.signer);
    return contract;
  }

  loadContracts(deployedContracts: IDeployedContracts) {
    this.contracts = {};
    for (let name of Object.keys(deployedContracts)) {
      const network = deployedContracts[name].networks[this.networkId];
      if (!network) {
        throw new Error(
          `Cannot load contract ${name} for network ${this.networkId}`
        );
      }
      const { abi } = deployedContracts[name];
      const { address } = network;
      this.contracts[name] = this.contract(address, abi);
    }
    return this.contracts;
  }

  async signMessage(message: string | Uint8Array) {
    return await this.signer.signMessage(message);
  }
}
