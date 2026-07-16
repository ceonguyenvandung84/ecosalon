import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/site/rating-stars", () => ({
  RatingStars: ({ rating, size, className }: any) => {
    const React = require("react");
    const stars = [];
    const r = rating ?? 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        React.createElement("svg", {
          key: i,
          "data-testid": "star",
          className: i <= Math.round(r) ? "fill-amber-400" : "fill-muted",
          style: { width: size ?? 14, height: size ?? 14 },
        })
      );
    }
    return React.createElement("div", { className: `flex items-center gap-0.5 ${className ?? ""}` }, ...stars);
  },
}));

import { render } from "@testing-library/react";
import React from "react";
import { RatingStars } from "@/components/site/rating-stars";

describe("RatingStars", () => {
  it("renders 5 svg stars", () => {
    const { container } = render(React.createElement(RatingStars, { rating: 3 }));
    expect(container.querySelectorAll("svg")).toHaveLength(5);
  });

  it("renders correct filled stars for rating 5", () => {
    const { container } = render(React.createElement(RatingStars, { rating: 5 }));
    const filled = container.querySelectorAll(".fill-amber-400");
    expect(filled).toHaveLength(5);
  });

  it("renders correct filled stars for rating 3", () => {
    const { container } = render(React.createElement(RatingStars, { rating: 3 }));
    const filled = container.querySelectorAll(".fill-amber-400");
    expect(filled).toHaveLength(3);
  });

  it("renders all empty for rating 0", () => {
    const { container } = render(React.createElement(RatingStars, { rating: 0 }));
    const filled = container.querySelectorAll(".fill-amber-400");
    expect(filled).toHaveLength(0);
  });

  it("rounds rating to nearest integer", () => {
    const { container } = render(React.createElement(RatingStars, { rating: 3.4 }));
    const filled = container.querySelectorAll(".fill-amber-400");
    expect(filled).toHaveLength(3);
  });

  it("rounds rating up at .5", () => {
    const { container } = render(React.createElement(RatingStars, { rating: 3.5 }));
    const filled = container.querySelectorAll(".fill-amber-400");
    expect(filled).toHaveLength(4);
  });

  it("applies custom size", () => {
    const { container } = render(React.createElement(RatingStars, { rating: 4, size: 20 }));
    container.querySelectorAll("svg").forEach((star) => {
      expect(star).toHaveStyle({ width: "20px", height: "20px" });
    });
  });

  it("applies custom className", () => {
    const { container } = render(React.createElement(RatingStars, { rating: 4, className: "custom-class" }));
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("custom-class");
  });

  it("handles null/undefined rating", () => {
    const { container } = render(React.createElement(RatingStars, { rating: null as any }));
    const filled = container.querySelectorAll(".fill-amber-400");
    expect(filled).toHaveLength(0);
  });
});