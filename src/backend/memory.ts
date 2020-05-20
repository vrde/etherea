import { Backend, Serializable } from "./types";

export class Memory extends Backend {
  storage: { [x: string]: Serializable } = {};

  _get(key: string) {
    return this.storage[key];
  }

  _set(key: string, value: Serializable) {
    this.storage[key] = value;
  }
}
