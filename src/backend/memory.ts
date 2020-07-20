import { Backend, Serializable } from "./types";

export class Memory extends Backend {
  storage: { [x: string]: Serializable } = {};
  //storage = new Map<string, Serializable>();

  _get<T extends Serializable>(key: string): T {
    //return this.storage[key];
    return this.storage[key] as T;
  }

  _set<T extends Serializable>(key: string, value: T) {
    this.storage[key] = value;
  }

  _remove(key: string) {
    delete this.storage[key];
  }

  _keys() {
    return Object.keys(this.storage);
  }
}
