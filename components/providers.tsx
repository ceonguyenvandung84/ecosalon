"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { CartProvider } from "@/components/site/cart-provider";
import { ReferralCapture } from "@/components/site/referral-capture";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <ReferralCapture />
        {children}
      </CartProvider>
    </SessionProvider>
  );
}
