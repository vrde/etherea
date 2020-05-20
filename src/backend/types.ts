export type Serializable =
  | void
  | string
  | number
  | boolean
  | Array<Serializable>
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

  get<T extends Serializable>(key: string, fallback?: T): T | undefined {
    const value = this._get<T>(this.prefix + key);
    return value === undefined ? fallback : value;
  }

  set<T extends Serializable>(key: string, setter: Setter<T>, fallback?: T) {
    let value: T | undefined;
    if (setter instanceof Function) {
      const prev = this.get(this.prefix + key, fallback);
      if (prev) value = setter(prev);
    } else {
      value = setter;
    }
    this._set(this.prefix + key, value);
    return value;
  }

  has(key: string) {
    return this._get(this.prefix + key) !== undefined;
  }
}
