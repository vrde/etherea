import { ethers } from "ethers";

import {
  EventFragment,
  FunctionFragment,
  ParamType,
} from "ethers/utils/abi-coder";
import { Interface } from "ethers/utils/interface";
import { Provider } from "ethers/providers/abstract-provider";
import { Signer } from "ethers/abstract-signer";

export class Contract {
  contract: ethers.Contract;
  constructor(
    addressOrName: string,
    contractInterface:
      | Array<string | FunctionFragment | EventFragment | ParamType>
      | string
      | Interface,
    signerOrProvider: Signer | Provider
  ) {
    this.contract = new ethers.Contract(
      addressOrName,
      contractInterface,
      signerOrProvider
    );
    Object.keys(this.contract.interface.functions).forEach((name) => {
      const value = this.contract[name];
      const wrapped = async (...args: any[]) => {
        const result = await value(...args);
        console.log(name, args, result);
        return result;
      };
      (this as any)[name] = wrapped;
    });
  }
  // TODO: reimplement deploy and attach
}
