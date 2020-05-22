import { promisify } from "util";
import { writeFile } from "fs";
import { basename, join } from "path";
import { exec } from "child_process";

const execAsync = promisify(exec);
const writeFileAsync = promisify(writeFile);

interface IContractData {
  [x: string]: {
    abi: string;
    bin: string;
  };
}

interface ISolcOutput {
  contracts: IContractData;
  version: string;
}

export async function solc(contractPath: string) {
  console.log("Compile", contractPath);
  const { stdout, stderr } = await execAsync(
    `solc --combined-json bin,abi ${contractPath}`
  );
  const output: ISolcOutput = JSON.parse(stdout);
  return output["contracts"];
}

//export async function compile(inContract: string, outDir: string) {
//  const contractFilename = basename(inContract);
//  const contractData = await solc(inContract);
//  const outContractData = join(outDir, contractFilename);
//  await writeFileAsync(outContractData, contractData);
//}
