import { uint, uint64 } from "./array";

describe("From number to array", () => {
  test("uint", () => {
    expect(uint(1)).toStrictEqual(
      new Uint8Array([
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
      ])
    );
  });

  test("uint32", () => {
    expect(uint64("0xaabbccdd")).toStrictEqual(
      new Uint8Array([0, 0, 0, 0, 0xaa, 0xbb, 0xcc, 0xdd])
    );
  });
});
