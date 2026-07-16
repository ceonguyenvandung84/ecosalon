"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/utils";

export function StatCounter({ value, suffix = "", label, icon }: { value: number; suffix?: string; label: string; icon?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const target = value ?? 0;
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      {icon ? <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div> : null}
      <div className="font-sans text-3xl font-bold text-foreground md:text-4xl">
        {formatNumber(display)}{suffix}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
