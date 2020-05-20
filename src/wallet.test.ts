import { Wallet } from "./wallet";
import { Memory } from "./backend";
import { State } from "./state";

describe("Browser without a web3 agent", () => {
  test("Create a new wallet", async () => {
    const state = new State(new Memory());
    const wallet = new Wallet(state);
    await wallet.setup();
    expect(wallet.agent).toBe("origin");
    //expect(wallet.privateKey).toBeTruthy();
  });

  test("Load an existing wallet", async () => {
    const state = new State(new Memory());
    const wallet = new Wallet(state);
    await wallet.setup();
    expect(wallet.agent).toBe("origin");
    //expect(wallet.privateKey).toBeTruthy();
  });
});
