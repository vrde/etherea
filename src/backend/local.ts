import { Backend, Serializable } from "./types";

export class Local extends Backend {
  _get(key: string) {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : undefined;
  }

  _set(key: string, value: Serializable) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}
