import { Memory } from "./backend";
import { State } from "./state";

describe("Wallet storage", () => {
  test(".getMnemonic and .setMnemonic", () => {
    const state = new State(new Memory());
    expect(state.hasMnemonic()).toBe(false);
    expect(state.getMnemonic()).toBe(undefined);
    expect(state.setMnemonic("test")).toBe("test");
    expect(state.getMnemonic()).toBe("test");
  });
});
