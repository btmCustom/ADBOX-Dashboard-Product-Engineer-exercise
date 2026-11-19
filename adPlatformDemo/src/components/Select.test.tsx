import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

describe("Select", () => {
  it("opens, lists options, and notifies on change", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        label="Channel"
        value="all"
        options={[
          { value: "all", label: "All channels" },
          { value: "meta", label: "Meta" },
        ]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /channel/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Meta" }));
    expect(onChange).toHaveBeenCalledWith("meta");
  });

  it("exposes an accessible name that includes the selected value", () => {
    render(
      <Select
        label="Metric"
        value="roas"
        options={[
          { value: "roas", label: "ROAS" },
          { value: "spend", label: "Spend" },
        ]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /metric.*roas/i })).toBeInTheDocument();
  });
});
