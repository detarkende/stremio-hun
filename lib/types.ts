export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// Fix global Object.keys, Object.entries, Object.values, and Object.fromEntries to preserve literal types of keys and values
declare global {
  interface ObjectConstructor {
    keys<T>(o: T): (keyof T)[];

    entries<T>(o: T): [keyof T, T[keyof T]][];

    values<T>(o: T): T[keyof T][];

    fromEntries<T>(entries: [keyof T, T[keyof T]][]): T;
  }
}
