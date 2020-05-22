import { LocalWallet, Web3Wallet, NodeWallet } from "./wallet";
import { State } from "./state";
import { Local, Memory } from "./backend";
import { IEthereum } from "./types";

export { Wallet } from "./wallet";

declare global {
  interface Window {
    ethereum: IEthereum;
  }
}

export async function getWallet(endpoint?: string) {
  let wallet;
  let backend;

  if (typeof process !== "undefined" && process?.versions?.node) {
    backend = new Memory();
  } else {
    backend = new Local("etherea-v0.0.1:");
  }

  const state = new State(backend);

  if (endpoint) {
    wallet = new NodeWallet(state, endpoint);
  } else if (typeof window !== "undefined" && window?.ethereum) {
    wallet = new Web3Wallet(state, window.ethereum);
  } else {
    wallet = new LocalWallet(state);
  }

  await wallet.setup();
  return wallet;
}
