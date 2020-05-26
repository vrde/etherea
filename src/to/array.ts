import { utils } from "ethers";

type NumberLike = string | number | ArrayLike<number> | utils.Hexable;

export function genericUint(value: NumberLike, bits: number) {
  if (bits % 8 !== 0) {
    throw new Error("bits must be a multiple of 8");
  }
  const hex = utils.hexZeroPad(utils.hexlify(value), bits / 8);
  return utils.arrayify(hex);
}

export const uint = (value: NumberLike) => genericUint(value, 256);
export const uint8 = (value: NumberLike) => genericUint(value, 8);
export const uint16 = (value: NumberLike) => genericUint(value, 16);
export const uint24 = (value: NumberLike) => genericUint(value, 24);
export const uint32 = (value: NumberLike) => genericUint(value, 32);
export const uint40 = (value: NumberLike) => genericUint(value, 40);
export const uint48 = (value: NumberLike) => genericUint(value, 48);
export const uint56 = (value: NumberLike) => genericUint(value, 56);
export const uint64 = (value: NumberLike) => genericUint(value, 64);
export const uint72 = (value: NumberLike) => genericUint(value, 72);
export const uint80 = (value: NumberLike) => genericUint(value, 80);
export const uint88 = (value: NumberLike) => genericUint(value, 88);
export const uint96 = (value: NumberLike) => genericUint(value, 96);
export const uint104 = (value: NumberLike) => genericUint(value, 104);
export const uint112 = (value: NumberLike) => genericUint(value, 112);
export const uint120 = (value: NumberLike) => genericUint(value, 120);
export const uint128 = (value: NumberLike) => genericUint(value, 128);
export const uint136 = (value: NumberLike) => genericUint(value, 136);
export const uint144 = (value: NumberLike) => genericUint(value, 144);
export const uint152 = (value: NumberLike) => genericUint(value, 152);
export const uint160 = (value: NumberLike) => genericUint(value, 160);
export const uint168 = (value: NumberLike) => genericUint(value, 168);
export const uint176 = (value: NumberLike) => genericUint(value, 176);
export const uint184 = (value: NumberLike) => genericUint(value, 184);
export const uint192 = (value: NumberLike) => genericUint(value, 192);
export const uint200 = (value: NumberLike) => genericUint(value, 200);
export const uint208 = (value: NumberLike) => genericUint(value, 208);
export const uint216 = (value: NumberLike) => genericUint(value, 216);
export const uint224 = (value: NumberLike) => genericUint(value, 224);
export const uint232 = (value: NumberLike) => genericUint(value, 232);
export const uint240 = (value: NumberLike) => genericUint(value, 240);
export const uint248 = (value: NumberLike) => genericUint(value, 248);
export const uint256 = uint;
