import { mkdir, writeFile, readFile } from "fs";
import { join, dirname } from "path";
import { exec } from "child_process";
import { Wallet } from "../wallet";
import { ethers } from "ethers";
import { IDeployedContracts, IDeployedNetworks } from "../types";
import { promisify } from "util";

const mkdirAsync = promisify(mkdir);
const execAsync = promisify(exec);
const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);

export interface ICompiledContract {
  abi: string;
  bin: string;
}

export interface ICompiledContracts {
  [x: string]: ICompiledContract;
}

export interface ISolcOutput {
  contracts: ICompiledContracts;
  version: string;
}

export function loadLibraries() {
  const basepath = process.cwd();
  const libs: string[] = [];
  try {
    const path = dirname(
      require.resolve("openzeppelin-solidity/package.json", {
        paths: [basepath],
      })
    );
    libs.push("openzeppelin-solidity=" + path);
  } catch (e) {
    // console.log("Cannot find openzeppelin-solidity library");
  }
  try {
    const path = dirname(
      require.resolve("@openzeppelin/contracts/package.json", {
        paths: [basepath],
      })
    );
    libs.push("@openzeppelin/contracts=" + path);
  } catch (e) {
    // console.log("Cannot find @openzeppelin/solidity library");
  }
  return libs;
}

export async function solc(contractPath: string) {
  const libs = loadLibraries();
  const { stdout, stderr } = await execAsync(
    `solc ${libs.join(" ")} --optimize --combined-json bin,abi ${contractPath}`
  );
  const output: ISolcOutput = JSON.parse(stdout);
  return output["contracts"];
}

export async function compile(contractPath: string) {
  const compiledContracts = await solc(contractPath);
  const result: ICompiledContracts = {};
  for (let key of Object.keys(compiledContracts)) {
    const [path, name] = key.split(":");
    if (path === contractPath) {
      result[name] = compiledContracts[key];
    }
  }
  return result;
}

export async function deploy(
  compiledContracts: ICompiledContracts,
  wallet: Wallet
) {
  const deployedContracts: IDeployedContracts = {};
  const networkId = wallet.networkId;
  for (let name of Object.keys(compiledContracts)) {
    const { abi, bin } = compiledContracts[name];
    const deployedContract = await wallet.deploy(abi, bin);
    const transaction = deployedContract.deployTransaction;
    const receipt = await transaction.wait();

    if (!transaction.hash) {
      throw new Error("Cannot find transaction hash, deploy failed");
    }

    const networks: IDeployedNetworks = {};

    networks[networkId] = {
      address: deployedContract.address,
      transactionHash: transaction.hash,
    };

    deployedContracts[name] = {
      id: ethers.utils.keccak256("0x" + bin),
      abi,
      networks,
    };
  }

  return deployedContracts;
}

export async function compileAndDeploy(contractPath: string, wallet: Wallet) {
  const compiledContracts = await solc(contractPath);
  const deployedContracts: IDeployedContracts = {};
  const networkId = wallet.networkId;

  for (let key of Object.keys(compiledContracts)) {
    const [path, name] = key.split(":");
    if (path !== contractPath) {
      continue;
    }
    console.log("Deploying", key);

    const { abi, bin } = compiledContracts[key];
    const deployedContract = await wallet.deploy(abi, bin);
    const transaction = deployedContract.deployTransaction;
    const receipt = await transaction.wait();

    if (!transaction.hash) {
      throw new Error("Cannot find transaction hash, deploy failed");
    }

    console.log("\tBlock number", receipt.blockNumber);
    console.log("\tGas price", transaction.gasPrice.toString());
    console.log("\tGas used", receipt.gasUsed?.toString());
    console.log("\tContract address", deployedContract.address);
    console.log("\tTransaction hash", transaction.hash);

    const networks: IDeployedNetworks = {};

    networks[networkId] = {
      address: deployedContract.address,
      transactionHash: transaction.hash,
    };

    deployedContracts[name] = {
      id: ethers.utils.keccak256("0x" + bin),
      abi,
      networks,
    };
  }

  return deployedContracts;
}

export async function build(
  inContract: string,
  outDir: string,
  wallet: Wallet
) {
  let previousContracts = {};
  const outFilename = join(outDir, "contracts.json");
  const deployedContracts = await compileAndDeploy(inContract, wallet);
  try {
    previousContracts = JSON.parse(await readFileAsync(outFilename, "utf8"));
  } catch (e) {
    console.log("Cannot find previous artifacts.");
  }
  const mergedContracts = mergeDeployedContracts(
    previousContracts,
    deployedContracts
  );
  await mkdirAsync(outDir, { recursive: true });
  await writeFileAsync(outFilename, JSON.stringify(mergedContracts, null, 2));
  return mergedContracts;
}

export function mergeDeployedContracts(
  previous: IDeployedContracts,
  current: IDeployedContracts
) {
  // TODO: Get it together vrde
  let updated: IDeployedContracts = JSON.parse(JSON.stringify(previous));
  // Update new contracts
  for (let contract of Object.keys(current)) {
    if (previous[contract] && current[contract].id === previous[contract].id) {
      updated[contract].networks = {
        ...previous[contract].networks,
        ...current[contract].networks,
      };
    } else {
      updated[contract] = current[contract];
    }
  }
  return updated;
}

//export async function compile(inContract: string, outDir: string) {
//  const contractFilename = basename(inContract);
//  const contractData = await solc(inContract);
//  const outContractData = join(outDir, contractFilename);
//  await writeFileAsync(outContractData, contractData);
//}
