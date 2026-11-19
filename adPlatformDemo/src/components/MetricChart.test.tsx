import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { dashboardCampaigns, groups, row } from "@/test/fixtures";
import { MetricChart } from "./MetricChart";

const rows = [
  row({
    externalCampaignId: "meta/1",
    campaignName: "Fall Rate Promo - Prospecting",
    spend: 100,
    conversionValue: 250,
    date: "2026-08-01",
  }),
  row({
    externalCampaignId: "gads/2",
    campaignName: "FALL_RATE_PROMO_Search_Brand",
    spend: 50,
    conversionValue: 100,
    date: "2026-08-02",
  }),
  row({
    externalCampaignId: "meta/4",
    campaignName: "Checking Launch - Conversions",
    spend: 40,
    conversionValue: 80,
    date: "2026-08-01",
  }),
];

const campaignOf = (id: string) => dashboardCampaigns.find((c) => c.id === id)!;

describe("MetricChart", () => {
  it("renders a ranked breakout for categorical dimensions", () => {
    render(<MetricChart rows={rows} campaignOf={campaignOf} groups={groups} />);
    expect(screen.getByRole("heading", { name: /ROAS by initiative/i })).toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveTextContent("Fall Rate Promo");
    expect(screen.getByRole("list")).toHaveTextContent("Checking Account Launch");
    expect(screen.getByRole("list")).toHaveTextContent("2.33×"); // 350/150
  });

  it("switches metric and dimension from the dropdowns", async () => {
    const user = userEvent.setup();
    render(<MetricChart rows={rows} campaignOf={campaignOf} groups={groups} />);

    await user.click(screen.getByRole("button", { name: /Metric.*ROAS/i }));
    await user.click(screen.getByRole("option", { name: "Spend" }));
    expect(screen.getByRole("heading", { name: /Spend by initiative/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Break out by.*Initiative/i }));
    await user.click(screen.getByRole("option", { name: "Channel" }));
    expect(screen.getByRole("heading", { name: /Spend by channel/i })).toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveTextContent("Meta");
    expect(screen.getByRole("list")).toHaveTextContent("Google Ads");
  });

  it("uses a time series chart for day breakout", async () => {
    const user = userEvent.setup();
    const { container } = render(<MetricChart rows={rows} campaignOf={campaignOf} groups={groups} />);

    await user.click(screen.getByRole("button", { name: /Break out by.*Initiative/i }));
    await user.click(screen.getByRole("option", { name: "Day" }));
    expect(screen.getByRole("heading", { name: /ROAS by day/i })).toBeInTheDocument();
    expect(container.querySelector(".recharts-responsive-container")).toBeTruthy();
  });
});
