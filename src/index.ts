import { Wallet } from "./wallet";
import { State } from "./state";
import { Local } from "./backend";
import { IEthereum } from "./types";

export { Wallet } from "./wallet";

declare global {
  interface Window {
    ethereum: IEthereum;
  }
}

export async function getWallet() {
  const state = new State(new Local("jeth-v0.0.1:"));
  const wallet = new Wallet(state, window.ethereum);
  await wallet.setup();
  return wallet;
}
