import { ethers } from "ethers";
import { State } from "./state";
import { IDeployedContracts, IWalletOptions, IEthereum } from "./types";
import { Memory, Local } from "./backend";
//import { RelayProvider, configureGSN, HttpProvider } from "opengsn-bundle";
import HttpProvider from "web3-providers-http";
import { RelayProvider } from "@opengsn/gsn/dist/src/relayclient/RelayProvider";
import { configureGSN } from "@opengsn/gsn/dist/src/relayclient/GSNConfigurator";
import { NetworkMismatch } from "./exceptions";

const NETWORKS = ["homestead", "rinkeby", "ropsten", "kovan", "goerli"];

declare global {
  interface Window {
    ethereum: IEthereum;
  }
}

export function hasNativeWallet() {
  return !!(typeof window !== "undefined" && window?.ethereum);
}

export async function getNativeWallet(options: IWalletOptions = {}) {
  if (!hasNativeWallet()) {
    throw new Error("Cannot initialize native wallet");
  }

  let agent = window.ethereum;
  let { endpoint, backend } = options;
  let provider: ethers.providers.BaseProvider;
  let signer;
  let address;
  let networkId;
  let networkName;
  let gsnSigner;

  if (endpoint === undefined) {
    endpoint = "homestead";
  } else if (endpoint === "localhost") {
    endpoint = "http://localhost:8545";
  }

  if (backend === undefined) {
    if (typeof process !== "undefined" && process?.versions?.node) {
      backend = new Memory();
    } else {
      backend = new Local("etherea-v0.0.1:");
    }
  }

  const state = new State(backend);

  if (endpoint.startsWith("http")) {
    const rpcProvider = new ethers.providers.JsonRpcProvider(endpoint);
    provider = rpcProvider;
    networkId = (await provider.getNetwork()).chainId;
    console.log("Wanted NetworkId", networkId);
  } else {
    throw new Error("Dunno what to do with endpoint");
  }

  try {
    await agent.enable();
  } catch (e) {
    if (e.code === 4001 || e.error?.code === -32500) {
      throw new Error("Permission denied");
    } else {
      throw e;
    }
  }

  const web3Provider = new ethers.providers.Web3Provider(agent);
  const networkIdNative = (await web3Provider.getNetwork()).chainId;
  const networkNameNative = (await web3Provider.getNetwork()).name;
  networkName = (await provider.getNetwork()).name;
  console.log("Got NetworkId", networkIdNative);
  if (networkIdNative !== networkId) {
    throw new NetworkMismatch(
      `Wallet is connected to "${networkNameNative}", while "${networkName}" is expected.`,
      networkNameNative,
      networkName
    );
  }

  if (
    options?.gsn?.paymasterAddress &&
    options?.gsn?.relayHubAddress &&
    options?.gsn?.stakeManagerAddress
  ) {
    const chainId = await web3Provider.send("net_version", []);
    const gsnConfig = configureGSN({
      relayHubAddress: options.gsn.relayHubAddress,
      paymasterAddress: options.gsn.paymasterAddress,
      stakeManagerAddress: options.gsn.stakeManagerAddress,
      gasPriceFactorPercent: 70,
      methodSuffix: "_v4",
      jsonStringifyRequest: true,
      chainId: chainId,
      relayLookupWindowBlocks: 1e5,
      verbose: true,
    });
    const origProvider = agent;
    const gsnProvider = new RelayProvider(origProvider, gsnConfig);
    const gsnWeb3Provider = new ethers.providers.Web3Provider(gsnProvider);
    provider = gsnWeb3Provider;
    gsnSigner = gsnWeb3Provider.getSigner();
  } else {
    provider = web3Provider;
  }

  signer = web3Provider.getSigner();
  address = (await web3Provider.listAccounts())[0];

  return new Wallet(
    state,
    address,
    provider,
    signer,
    networkId,
    networkName,
    undefined,
    gsnSigner
  );
}

export async function getLocalWallet(options: IWalletOptions = {}) {
  let { endpoint, mnemonic, privateKey, index, backend } = options;
  index = index === undefined ? 0 : index;

  let rpcProvider: ethers.providers.JsonRpcProvider;
  let provider: ethers.providers.BaseProvider;
  let ethersWallet;
  let signer;
  let address;
  let networkId;
  let networkName;
  let gsnSigner;

  if (typeof endpoint !== "string") {
    throw new Error("Endpoint must be a undefined or string");
  }

  if (endpoint === undefined) {
    endpoint = "homestead";
  } else if (endpoint === "localhost") {
    endpoint = "http://localhost:8545";
  }

  if (backend === undefined) {
    if (typeof process !== "undefined" && process?.versions?.node) {
      backend = new Memory();
    } else {
      backend = new Local("etherea-v0.0.1:");
    }
  }

  const state = new State(backend);

  function getWallet() {
    let result;
    if (mnemonic) {
      result = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + index);
    } else if (privateKey) {
      result = new ethers.Wallet(privateKey);
    } /*else if (state.hasMnemonic()) {
      result = ethers.Wallet.fromMnemonic(
        state.getMnemonic(),
        "m/44'/60'/0'/0/" + index
      );
    }*/ else {
      result = ethers.Wallet.createRandom();
    }
    return result;
  }

  /*if (NETWORKS.includes(endpoint)) {
    provider = ethers.getDefaultProvider(endpoint);
    ethersWallet = getWallet();
    ethersWallet = ethersWallet.connect(provider);
    address = ethersWallet.address;
    signer = ethersWallet;
  } else */
  if (endpoint.startsWith("http")) {
    rpcProvider = new ethers.providers.JsonRpcProvider(endpoint);
    provider = rpcProvider;
    ethersWallet = getWallet();
    ethersWallet = ethersWallet.connect(provider);
    address = ethersWallet.address;
    signer = ethersWallet;
  } else {
    throw new Error("Dunno what to do with endpoint");
  }

  networkId = (await provider.getNetwork()).chainId;
  networkName = (await provider.getNetwork()).name;

  if (
    options?.gsn?.paymasterAddress &&
    options?.gsn?.relayHubAddress &&
    options?.gsn?.stakeManagerAddress
  ) {
    const chainId = await rpcProvider.send("net_version", []);
    const gsnConfig = configureGSN({
      relayHubAddress: options.gsn.relayHubAddress,
      paymasterAddress: options.gsn.paymasterAddress,
      stakeManagerAddress: options.gsn.stakeManagerAddress,
      gasPriceFactorPercent: 70,
      methodSuffix: "_v4",
      jsonStringifyRequest: true,
      chainId: chainId,
      relayLookupWindowBlocks: 1e5,
      verbose: true,
    });
    const origProvider = new HttpProvider(endpoint);
    const gsnProvider = new RelayProvider(origProvider, gsnConfig);
    const gsnWeb3Provider = new ethers.providers.Web3Provider(gsnProvider);
    provider = gsnWeb3Provider;
    const privateKey = Buffer.from(
      ethers.utils.arrayify(ethersWallet.privateKey)
    );
    gsnProvider.addAccount({
      address: ethersWallet.address,
      privateKey,
    });
    gsnSigner = gsnWeb3Provider.getSigner(ethersWallet.address);
  }

  return new Wallet(
    state,
    address,
    provider,
    signer,
    networkId,
    networkName,
    ethersWallet,
    gsnSigner
  );
}

export async function getNodeWallet() {}

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
  let networkName;

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
    endpoint = "homestead";
  } else if (endpoint === "localhost") {
    endpoint = "http://localhost:8545";
  }

  if (!nativeAgent) {
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
      await nativeAgent.enable();
    } catch (e) {
      if (e.code === 4001 || e.error?.code === -32500) {
        throw new Error("Permission denied");
      } else {
        throw e;
      }
    }
    const web3Provider = new ethers.providers.Web3Provider(nativeAgent);
    provider = web3Provider;
    signer = web3Provider.getSigner();
    address = (await web3Provider.listAccounts())[0];
  }

  networkId = (await provider.getNetwork()).chainId;
  networkName = (await provider.getNetwork()).name;

  // FIXME: refactor GSN out of this already huge function
  // Also there should be default values the GSN network.
  if (
    options?.gsn?.paymasterAddress &&
    options?.gsn?.relayHubAddress &&
    options?.gsn?.stakeManagerAddress
  ) {
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
      signer = gsnWeb3Provider.getSigner(ethersWallet.address);
    } else {
      signer = gsnWeb3Provider.getSigner();
    }
  }

  return new Wallet(
    state,
    address,
    provider,
    signer,
    networkId,
    networkName,
    ethersWallet
  );
}

export class Wallet {
  state: State;
  address: string;
  signer: ethers.Signer;
  provider: ethers.providers.Provider;
  networkName: string;
  networkId: number;
  wallet?: ethers.Wallet;
  gsnSigner?: ethers.Signer;
  mnemonic?: string;

  contracts?: { [name: string]: ethers.Contract };

  constructor(
    state: State,
    address: string,
    provider: ethers.providers.Provider,
    signer: ethers.Signer,
    networkId: number,
    networkName: string,
    wallet?: ethers.Wallet,
    gsnSigner?: ethers.Signer
  ) {
    this.state = state;
    this.address = address;
    this.provider = provider;
    this.signer = signer;
    this.networkId = networkId;
    this.networkName = networkName;
    this.wallet = wallet;
    this.gsnSigner = gsnSigner;
    if (this.wallet && this.wallet.mnemonic) {
      this.mnemonic = this.wallet.mnemonic.phrase;
    }
  }

  async deploy(abi: string, bytecode: string, ...args: any[]) {
    const factory = new ethers.ContractFactory(abi, bytecode, this.signer);
    const contract = await factory.deploy(...args);
    await contract.deployed();
    return contract;
  }

  contract(address: string, abi: string) {
    const contract = new ethers.Contract(
      address,
      abi,
      this.gsnSigner || this.signer
    );
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

  clear() {
    this.state.clear();
  }
}
