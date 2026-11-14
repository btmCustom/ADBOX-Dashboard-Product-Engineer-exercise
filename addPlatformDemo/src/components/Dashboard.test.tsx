import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { dashboardCampaigns, groups, row } from "@/test/fixtures";
import { Dashboard } from "./Dashboard";

const rows = [
  row({ externalCampaignId: "meta/1", spend: 100, conversionValue: 200 }),
  row({ externalCampaignId: "gads/2", spend: 50, conversionValue: 100 }),
  row({ externalCampaignId: "meta/4", spend: 40, conversionValue: 80 }),
  row({ externalCampaignId: "meta/5", spend: 10, conversionValue: 0 }),
];

describe("Dashboard", () => {
  it("shows headline metrics for all rows by default", () => {
    render(<Dashboard rows={rows} campaigns={dashboardCampaigns} groups={groups} />);
    expect(screen.getByLabelText("Headline metrics")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Channel.*All channels/i })).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByText("Totals by initiative and channel")).toBeInTheDocument();
  });

  it("filters by channel and can clear filters", async () => {
    const user = userEvent.setup();
    render(<Dashboard rows={rows} campaigns={dashboardCampaigns} groups={groups} />);

    await user.click(screen.getByRole("button", { name: /Channel.*All channels/i }));
    await user.click(screen.getByRole("option", { name: "Meta" }));
    expect(screen.getByText(/Showing/i).textContent).toMatch(/Meta/);
    expect(screen.getByText(/3 of 4 daily rows/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Clear filters/i }));
    expect(screen.queryByText(/daily rows/i)).not.toBeInTheDocument();
  });

  it("filters by initiative", async () => {
    const user = userEvent.setup();
    render(<Dashboard rows={rows} campaigns={dashboardCampaigns} groups={groups} />);

    await user.click(screen.getByRole("button", { name: /Initiative.*All initiatives/i }));
    await user.click(screen.getByRole("option", { name: "Fall Rate Promo" }));
    expect(screen.getByText(/2 of 4 daily rows/i)).toBeInTheDocument();
  });
});
