import { ethers } from "ethers";
import { Backend } from "./backend";

export type Serializable =
  | void
  | string
  | number
  | boolean
  | Array<Serializable>
  | { [x: string]: Serializable };

export interface IEthereum extends ethers.providers.ExternalProvider {
  enable(): Promise<any>;
}

export interface IDeployedNetworks {
  [networkId: number]: {
    address: string;
    transactionHash: string;
  };
}

export interface IDeployedContract {
  id: string;
  abi: string;
  networks: IDeployedNetworks;
}

export interface IDeployedContracts {
  [contractName: string]: IDeployedContract;
}

export interface IWalletOptions {
  endpoint?: string | IEthereum;
  privateKey?: string;
  index?: number;
  mnemonic?: string;
  path?: string;
  backend?: Backend;
  disableNativeAgent?: boolean;
}
