"use client";

import { useEffect } from "react";

// Captures a ?ref=CODE query param on any page and stores it in a cookie
// (90 days) so the affiliate can be credited when the visitor signs up.
export function ReferralCapture() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) {
        document.cookie = `shs_ref=${encodeURIComponent(ref)}; path=/; max-age=${60 * 60 * 24 * 90}`;
      }
    } catch {
      // ignore
    }
  }, []);
  return null;
}
