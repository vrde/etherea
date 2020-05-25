import { mergeDeployedContracts } from ".";
import { IDeployedContracts } from "../types";

describe("Index", () => {
  test("merge two deployed contracts data", () => {
    const previous: IDeployedContracts = {
      "Contract1.sol": {
        id: "0x01",
        abi: "abi1",
        networks: {
          1: { address: "0x01", transactionHash: "0x01" },
        },
      },
      "Contract2.sol": {
        id: "0x02",
        abi: "abi2",
        networks: {
          1: { address: "0x02", transactionHash: "0x02" },
        },
      },
    };
    const current: IDeployedContracts = {
      "Contract1.sol": {
        id: "0x01",
        abi: "abi1",
        networks: {
          2: { address: "0x02", transactionHash: "0x02" },
        },
      },
      "Contract2.sol": {
        id: "0x0202",
        abi: "abi2",
        networks: {
          1: { address: "0x0202", transactionHash: "0x0202" },
        },
      },
      "Contract3.sol": {
        id: "0x03",
        abi: "abi3",
        networks: {
          1: { address: "0x03", transactionHash: "0x03" },
        },
      },
    };
    const expected: IDeployedContracts = {
      "Contract1.sol": {
        id: "0x01",
        abi: "abi1",
        networks: {
          1: { address: "0x01", transactionHash: "0x01" },
          2: { address: "0x02", transactionHash: "0x02" },
        },
      },
      "Contract2.sol": {
        id: "0x0202",
        abi: "abi2",
        networks: {
          1: { address: "0x0202", transactionHash: "0x0202" },
        },
      },
      "Contract3.sol": {
        id: "0x03",
        abi: "abi3",
        networks: {
          1: { address: "0x03", transactionHash: "0x03" },
        },
      },
    };

    expect(mergeDeployedContracts(previous, current)).toStrictEqual(expected);
  });
});
