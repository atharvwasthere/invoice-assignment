import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("shows the range summary", () => {
    render(<Pagination page={1} limit={20} total={2000} onPage={() => {}} />);
    expect(screen.getByText(/Showing 1–20 of 2,000/)).toBeInTheDocument();
  });

  it("calls onPage with the next page when Next is clicked", () => {
    const onPage = vi.fn();
    render(<Pagination page={1} limit={20} total={2000} onPage={onPage} />);
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onPage).toHaveBeenCalledWith(2);
  });

  it("disables Previous on the first page", () => {
    render(<Pagination page={1} limit={20} total={2000} onPage={() => {}} />);
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });
});
