import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/hero.png" alt="Học viện làm tóc SALON HAIR SYSTEM" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/20" />
      </div>
      <div className="relative mx-auto flex min-h-[560px] max-w-[1200px] flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="animate-fade-in max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur">
            <Sparkles className="h-4 w-4" /> Học viện &amp; Mỹ phẩm tóc chuyên nghiệp
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            SALON HAIR <span className="text-primary">SYSTEM</span>
          </h1>
          <p className="mt-3 text-lg font-semibold uppercase tracking-wide text-primary">Đào tạo &middot; Mỹ phẩm &middot; Cộng đồng</p>
          <p className="mt-4 max-w-xl text-base text-white md:text-lg">
            Nâng tầm tay nghề với các khóa học chuyên sâu và bộ sản phẩm chăm sóc tóc cao cấp dành riêng cho người làm nghề tóc.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/khoa-hoc"><GraduationCap className="h-5 w-5" /> Khám phá khóa học</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link href="/san-pham">Mua sản phẩm <ArrowRight className="h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
