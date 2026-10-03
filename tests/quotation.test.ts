import { describe, expect, it } from "vitest";
import { wrapThaiText } from "../src/lib/quotation";
describe("quotation wrapping", () => {
  it("keeps Thai graphemes together and wraps long product names", () => {
    const text =
        "แอร์ติดผนัง Inverter 12,000 BTU รุ่น A12 เครื่องปรับอากาศสำหรับบ้าน",
      measure = (value: string) =>
        [
          ...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(
            value,
          ),
        ].length;
    const lines = wrapThaiText(text, 20, measure);
    expect(lines.length).toBeGreaterThan(1);
    lines.forEach((line) => expect(measure(line)).toBeLessThanOrEqual(20));
    expect(lines.join("").replaceAll(" ", "")).toBe(text.replaceAll(" ", ""));
  });
  it("handles empty and unbroken model codes", () => {
    expect(wrapThaiText("", 4, (value) => value.length)).toEqual([""]);
    expect(
      wrapThaiText("ABCDEFGHIJKLMNOP", 4, (value) => value.length),
    ).toEqual(["ABCD", "EFGH", "IJKL", "MNOP"]);
  });
});
