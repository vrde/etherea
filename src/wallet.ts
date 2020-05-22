import { ethers } from "ethers";
import { State } from "./state";
import { IEthereum } from "./types";

export abstract class Wallet {
  state: State;
  ethereum?: IEthereum;
  agent?: string;
  wallet?: ethers.Wallet;
  provider?: ethers.providers.Provider;
  address?: string;

  constructor(state: State) {
    this.state = state;
  }

  async deploy(abi: string, bytecode: string, ...args: [any]) {
    const factory = new ethers.ContractFactory(abi, bytecode, this.getSigner());
    const contract = await factory.deploy(args);
    await contract.deployed();
    return contract;
  }

  contract(address: string, abi: string) {
    if (!this.provider) {
      throw new Error("Setup the wallet first.");
    }
    const contract = new ethers.Contract(address, abi, this.provider);
    return contract;
  }

  abstract getSigner(): ethers.Signer;
}

export class LocalWallet extends Wallet {
  agent: string = "local";
  provider?: ethers.providers.BaseProvider;

  setup() {
    if (this.state.hasMnemonic()) {
      const mnemonic = this.state.getMnemonic();
      this.wallet = ethers.Wallet.fromMnemonic(mnemonic);
    } else {
      this.wallet = ethers.Wallet.createRandom();
      this.state.setMnemonic(this.wallet.mnemonic);
    }
    this.provider = ethers.getDefaultProvider();
    this.wallet.connect(this.provider);
    this.address = this.wallet.address;
  }

  getSigner() {
    if (!this.wallet) {
      throw new Error("Setup the wallet first.");
    }
    return this.wallet;
  }
}

export class Web3Wallet extends Wallet {
  ethereum: IEthereum;
  agent: string = "web3";
  provider?: ethers.providers.JsonRpcProvider;

  constructor(state: State, ethereum: IEthereum) {
    super(state);
    this.ethereum = ethereum;
  }

  async setup() {
    try {
      await this.ethereum.enable();
    } catch (e) {
      if (e.code === 4001 || e.error?.code === -32500) {
        throw new Error("Permission denied");
      } else {
        throw e;
      }
    }
    this.provider = new ethers.providers.Web3Provider(this.ethereum);
    this.address = (await this.provider.listAccounts())[0];
  }

  getSigner() {
    if (!this.provider) {
      throw new Error("Setup the wallet first.");
    }
    return this.provider.getSigner();
  }
}

export class NodeWallet extends Wallet {
  url: string;
  agent: string = "node";
  provider?: ethers.providers.JsonRpcProvider;

  constructor(state: State, url: string) {
    super(state);
    this.url = url;
  }

  async setup() {
    this.provider = new ethers.providers.JsonRpcProvider(this.url);
    this.address = (await this.provider.listAccounts())[0];
  }

  getSigner() {
    if (!this.provider) {
      throw new Error("Setup the wallet first.");
    }
    return this.provider.getSigner();
  }
}
