import { describe, expect, it } from "vitest";
import { buildConfig, formatEgyptianPhone, getStoredPhone, DEFAULT_RAW } from "@/lib/whatsapp/config";

describe("formatEgyptianPhone", () => {
  it("normalizes a local number to international form", () => {
    const fmt = formatEgyptianPhone("01031445949");
    expect(fmt.international).toBe("201031445949");
    expect(fmt.raw).toBe("01031445949");
    expect(fmt.display).toBe("+20 103 144 5949");
    expect(fmt.waMeLink).toBe("https://wa.me/201031445949");
  });

  it("accepts an already international number", () => {
    const fmt = formatEgyptianPhone("+20 103 144 5949");
    expect(fmt.international).toBe("201031445949");
    expect(fmt.raw).toBe("01031445949");
    expect(fmt.display).toBe("+20 103 144 5949");
  });

  it("keeps a too-short number readable instead of slicing it", () => {
    const fmt = formatEgyptianPhone("0100");
    expect(fmt.international).toBe("20100");
    expect(fmt.raw).toBe("0100");
    expect(fmt.display).toBe("+20100");
    expect(fmt.waMeLink).toBe("https://wa.me/20100");
  });
});

describe("buildConfig", () => {
  it("falls back to the default line outside the browser", () => {
    expect(getStoredPhone()).toBe(DEFAULT_RAW);
    const config = buildConfig();
    expect(config.international).toBe("201031445949");
    expect(config.carrier).toBe("Egypt");
    expect(config.getDirectChatLink()).toBe("https://wa.me/201031445949");
  });

  it("builds a link with an encoded prefilled message", () => {
    const config = buildConfig("01000000000");
    expect(config.international).toBe("201000000000");
    expect(config.getDirectChatLink("مرحبا بك في العيادة")).toBe(
      `https://wa.me/201000000000?text=${encodeURIComponent("مرحبا بك في العيادة")}`
    );
    expect(config.getDirectChatLink("hello world")).toContain(
      "text=hello%20world"
    );
  });

  it("exposes the webhook verify token from the environment", () => {
    expect(typeof buildConfig().webhookVerifyToken).toBe("string");
  });
});
