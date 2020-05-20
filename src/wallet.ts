import { ethers } from "ethers";
import { State } from "./state";
import { IEthereum } from "./types";

export class Wallet {
  state: State;
  ethereum?: IEthereum;
  agent?: string;
  wallet?: ethers.Wallet;
  provider?: ethers.providers.Provider;

  constructor(state: State, ethereum?: IEthereum) {
    this.state = state;
    this.ethereum = ethereum;
  }

  async setup() {
    if (this.ethereum) {
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
      this.agent = "native";
    } else {
      this.agent = "origin";
      if (this.state.hasMnemonic()) {
        const mnemonic = this.state.getMnemonic();
        this.wallet = ethers.Wallet.fromMnemonic(mnemonic);
      } else {
        this.wallet = ethers.Wallet.createRandom();
        this.state.setMnemonic(this.wallet.mnemonic);
      }
      this.provider = ethers.getDefaultProvider();
    }
  }
}
