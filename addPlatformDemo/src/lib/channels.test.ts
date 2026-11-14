import { describe, expect, it } from "vitest";
import { channelOf, SHORT_CHANNEL, toExternalCampaignId } from "./channels";

describe("toExternalCampaignId", () => {
  it("prefixes each channel with its short code", () => {
    expect(toExternalCampaignId("meta", "123")).toBe("meta/123");
    expect(toExternalCampaignId("google", "456")).toBe("gads/456");
    expect(toExternalCampaignId("amazon", "789")).toBe("amzn/789");
  });
});

describe("channelOf", () => {
  it("round-trips short prefixes", () => {
    for (const channel of ["meta", "google", "amazon"] as const) {
      expect(channelOf(`${SHORT_CHANNEL[channel]}/id`)).toBe(channel);
    }
  });

  it("rejects unknown prefixes", () => {
    expect(() => channelOf("tiktok/1")).toThrow(/Unknown channel prefix/);
  });
});
