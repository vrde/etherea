import { Backend } from "./backend";

export class State {
  backend: Backend;

  constructor(backend: Backend) {
    this.backend = backend;
  }

  hasMnemonic() {
    return this.backend.has("mnemonic");
  }

  getMnemonic() {
    return <string>this.backend.get("mnemonic");
  }

  setMnemonic(mnemonic: string) {
    return <string>this.backend.set("mnemonic", mnemonic);
  }

  clear() {
    this.backend.clear();
  }
}
