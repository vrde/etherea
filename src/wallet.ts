import { ethers } from "ethers";
import { State } from "./state";
import { IDeployedContracts, IWalletOptions, IEthereum } from "./types";
import { Memory, Local } from "./backend";
//import { RelayProvider, configureGSN, HttpProvider } from "opengsn-bundle";
import HttpProvider from "web3-providers-http";
import { RelayProvider } from "@opengsn/gsn/dist/src/relayclient";
import { configureGSN } from "@opengsn/gsn/dist/src/relayclient/GSNConfigurator";

const NETWORKS = ["homestead", "rinkeby", "ropsten", "kovan", "goerli"];

declare global {
  interface Window {
    ethereum: IEthereum;
  }
}

export async function wallet(options: IWalletOptions = {}) {
  let { endpoint, mnemonic, privateKey, index, backend } = options;
  index = index === undefined ? 0 : index;

  let nativeAgent;

  if (
    !options.disableNativeAgent &&
    typeof window !== "undefined" &&
    window?.ethereum
  ) {
    nativeAgent = window.ethereum;
  }

  let provider: ethers.providers.BaseProvider;
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

  console.log("backend state", backend, state);

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
    if (nativeAgent !== undefined) {
      endpoint = nativeAgent;
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
      const rpcProvider = new ethers.providers.JsonRpcProvider(endpoint);
      provider = rpcProvider;
      if (mnemonic || privateKey) {
        ethersWallet = getDefaultWallet();
        ethersWallet = ethersWallet.connect(provider);
        address = ethersWallet.address;
        signer = ethersWallet;
      } else {
        const accounts = await rpcProvider.listAccounts();
        if (accounts.length === 0) {
          ethersWallet = getDefaultWallet();
          ethersWallet = ethersWallet.connect(provider);
          address = ethersWallet.address;
          signer = ethersWallet;
        } else if (accounts[index] !== undefined) {
          address = accounts[index];
          signer = rpcProvider.getSigner(index);
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
    const web3Provider = new ethers.providers.Web3Provider(endpoint);
    provider = web3Provider;
    signer = web3Provider.getSigner();
    address = (await web3Provider.listAccounts())[0];
  }

  networkId = (await provider.getNetwork()).chainId;

  // FIXME: refactor GSN out of this already huge function
  // Also there should be default values the GSN network.
  console.log("Etherea configuration", options);
  if (
    options?.gsn?.paymasterAddress &&
    options?.gsn?.relayHubAddress &&
    options?.gsn?.stakeManagerAddress
  ) {
    console.log("Configuring GSN");
    const gsnConfig = configureGSN({
      relayHubAddress: options.gsn.relayHubAddress,
      paymasterAddress: options.gsn.paymasterAddress,
      stakeManagerAddress: options.gsn.stakeManagerAddress,
      gasPriceFactorPercent: 70,
      methodSuffix: "_v4",
      jsonStringifyRequest: true,
      chainId: networkId,
      relayLookupWindowBlocks: 1e5,
      verbose: true,
    });

    let origProvider;
    if (typeof endpoint === "string") {
      origProvider = new HttpProvider(endpoint);
    } else {
      origProvider = endpoint;
    }

    console.log("origProvider", origProvider);

    const gsnProvider = new RelayProvider(origProvider, gsnConfig);
    const gsnWeb3Provider = new ethers.providers.Web3Provider(gsnProvider);
    provider = gsnWeb3Provider;
    if (ethersWallet?.privateKey) {
      const privateKey = Buffer.from(
        ethers.utils.arrayify(ethersWallet.privateKey)
      );
      gsnProvider.addAccount({
        address: ethersWallet.address,
        privateKey,
      });
      console.log("Private key available", {
        address: ethersWallet.address,
        privateKey,
      });
      signer = gsnWeb3Provider.getSigner(ethersWallet.address);
    } else {
      signer = gsnWeb3Provider.getSigner();
    }
  }

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
