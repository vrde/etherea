import { ethers } from "ethers";

export type Serializable =
  | void
  | string
  | number
  | boolean
  | Array<Serializable>
  | { [x: string]: Serializable };

export interface IEthereum extends ethers.providers.AsyncSendable {
  enable(): Promise<any>;
}
