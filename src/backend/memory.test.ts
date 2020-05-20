import { Memory } from "./memory";
import { Serializable } from "./types";

describe("Memory backend", () => {
  test(".get and .set", () => {
    const m = new Memory();
    expect(m.get("non-existing")).toBe(undefined);
    expect(m.get("non-existing", "fallback")).toBe("fallback");
    expect(m.set("drink", "tea")).toBe("tea");
    expect(m.get("drink")).toBe("tea");
    expect(m.set("drink", "coffee")).toBe("coffee");
    expect(m.get("drink")).toBe("coffee");
    const upper = (x: string) => x.toUpperCase();
    expect(m.set("drink", upper)).toBe("COFFEE");
    expect(m.get("drink")).toBe("COFFEE");
    expect(m.set("vehicle", upper, "bike")).toBe("BIKE");
    expect(m.get("vehicle")).toBe("BIKE");
  });
  test(".has", () => {
    const m = new Memory();
    m.set("animal", "cat");
    expect(m.has("animal")).toBe(true);
    expect(m.has("drink")).toBe(false);
  });
});
