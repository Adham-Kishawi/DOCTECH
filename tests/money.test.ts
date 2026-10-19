import { describe, expect, it } from "vitest";
import {
  EGP_PIASTRES,
  formatMoney,
  fromPiastres,
  toPiastres,
  toPiastresFromInput,
} from "@/lib/money";

describe("money — EGP <-> piastres", () => {
  it("uses 100 piastres per EGP", () => {
    expect(EGP_PIASTRES).toBe(100);
  });

  it("stores EGP as integer piastres", () => {
    expect(toPiastres(450)).toBe(45000);
    expect(toPiastres(380.75)).toBe(38075);
    expect(toPiastres(0.1)).toBe(10);
    expect(toPiastres(0)).toBe(0);
    expect(toPiastres(-12.5)).toBe(-1250);
  });

  it("absorbs float noise that a DOUBLE column would have summed wrongly", () => {
    expect(toPiastres(0.1) + toPiastres(0.2)).toBe(30);
    expect(toPiastres(0.29)).toBe(29);
  });

  it("returns 0 for non-finite input", () => {
    expect(toPiastres(NaN)).toBe(0);
    expect(toPiastres(Infinity)).toBe(0);
    expect(toPiastres(-Infinity)).toBe(0);
  });

  it("renders piastres as EGP", () => {
    expect(fromPiastres(45000)).toBe(450);
    expect(fromPiastres(10)).toBe(0.1);
    expect(fromPiastres(1)).toBe(0.01);
    expect(fromPiastres(12345)).toBe(123.45);
    expect(fromPiastres(0)).toBe(0);
  });

  it("returns 0 for non-finite piastres", () => {
    expect(fromPiastres(NaN)).toBe(0);
    expect(fromPiastres(Infinity)).toBe(0);
  });

  it("round-trips every amount the app can store", () => {
    for (const piastres of [0, 1, 10, 99, 100, 450, 12345, 9999999]) {
      expect(toPiastres(fromPiastres(piastres))).toBe(piastres);
    }
  });

  it("parses typed form input as EGP", () => {
    expect(toPiastresFromInput("1250.5")).toBe(125050);
    expect(toPiastresFromInput(400)).toBe(40000);
    expect(toPiastresFromInput("0")).toBe(0);
  });

  it("parses grouped and comma-decimal input", () => {
    expect(toPiastresFromInput("1 250,50")).toBe(125050);
    expect(toPiastresFromInput("1٬250")).toBe(125000);
    expect(toPiastresFromInput("1250,5")).toBe(125050);
  });

  it("treats unusable input as zero", () => {
    expect(toPiastresFromInput("")).toBe(0);
    expect(toPiastresFromInput("abc")).toBe(0);
  });

  it("formats currency in the active locale", () => {
    expect(formatMoney(45000, "en")).toContain("450.00");
    expect(formatMoney(45000, "en")).not.toContain("NaN");
    expect(formatMoney(45000, "ar")).not.toContain("NaN");
    expect(formatMoney(45000, "ar")).toMatch(/450|٤٥٠/);
    expect(formatMoney(1, "en")).toContain("0.01");
  });
});
