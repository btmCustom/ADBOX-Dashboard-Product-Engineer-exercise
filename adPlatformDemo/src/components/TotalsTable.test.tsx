import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { dashboardCampaigns, groups, row } from "@/test/fixtures";
import { TotalsTable } from "./TotalsTable";

const rows = [
  row({ externalCampaignId: "meta/1", spend: 100, clicks: 10, impressions: 1000, conversions: 5, conversionValue: 200 }),
  row({ externalCampaignId: "gads/2", spend: 50, clicks: 20, impressions: 2000, conversions: 2, conversionValue: 80 }),
  row({ externalCampaignId: "meta/4", spend: 40, clicks: 8, impressions: 800, conversions: 4, conversionValue: 120 }),
  row({ externalCampaignId: "meta/5", spend: 10, clicks: 1, impressions: 100, conversions: 0, conversionValue: 0 }),
];

const campaignOf = (id: string) => {
  const campaign = dashboardCampaigns.find((c) => c.id === id);
  if (!campaign) throw new Error(id);
  return campaign;
};

describe("TotalsTable", () => {
  it("renders initiative rows, expands channels, and reconciles", async () => {
    const user = userEvent.setup();
    render(<TotalsTable rows={rows} campaignOf={campaignOf} groups={groups} />);

    expect(screen.getByText("Fall Rate Promo")).toBeInTheDocument();
    expect(screen.getByText("Checking Account Launch")).toBeInTheDocument();
    expect(screen.getByText("Unmatched")).toBeInTheDocument();
    expect(screen.getByText(/Channel rows sum to each group/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Fall Rate Promo/i }));
    expect(screen.getByText("Meta")).toBeInTheDocument();
    expect(screen.getByText("Google Ads")).toBeInTheDocument();
  });

  it("highlights the full row when selected", async () => {
    const user = userEvent.setup();
    render(<TotalsTable rows={rows} campaignOf={campaignOf} groups={groups} />);

    const initiativeRow = screen.getByRole("button", { name: /Checking Account Launch/i }).closest("tr");
    expect(initiativeRow).toBeTruthy();
    await user.click(initiativeRow!);
    expect(initiativeRow).toHaveAttribute("aria-selected", "true");
    expect(initiativeRow?.className).toMatch(/brand/);
  });

  it("sorts when a metric header is clicked", async () => {
    const user = userEvent.setup();
    render(<TotalsTable rows={rows} campaignOf={campaignOf} groups={groups} />);

    const spendHeader = screen.getAllByRole("button", { name: /^Spend/ }).find((el) => el.closest("th"));
    expect(spendHeader).toBeTruthy();
    await user.click(spendHeader!);
    expect(spendHeader!.closest("th")).toHaveAttribute("aria-sort", "ascending");
    expect(within(screen.getByRole("table")).getByText("Fall Rate Promo")).toBeInTheDocument();
  });
});
