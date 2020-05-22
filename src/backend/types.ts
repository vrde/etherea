export type Serializable =
  | null
  | undefined
  | string
  | number
  | boolean
  | Serializable[]
  | { [x: string]: Serializable };

export type Modifier<T extends Serializable> = (x: T) => T;

export type Setter<T extends Serializable> = T | Modifier<T>;

export abstract class Backend {
  prefix: string;

  abstract _get<T extends Serializable>(key: string): T;
  abstract _set<T extends Serializable>(key: string, value: T): void;

  constructor(prefix: string = "") {
    this.prefix = prefix;
  }

  get<T extends Serializable>(key: string, fallback?: T): T {
    const value = this._get<T>(this.prefix + key);
    return value === undefined ? (fallback as T) : value;
  }

  set<T extends Serializable>(key: string, setter: Setter<T>, fallback?: T) {
    let value: T | undefined;
    if (setter instanceof Function) {
      const prev = this.get<T>(this.prefix + key, fallback);
      value = setter(prev);
    } else {
      value = setter;
    }
    if (value !== undefined) this._set(this.prefix + key, value);
    return value;
  }

  has(key: string) {
    return this._get(this.prefix + key) !== undefined;
  }
}
