import Link from "next/link";
import { ArrowRight, GraduationCap, ShoppingBag, Users, Star, BadgeCheck } from "lucide-react";
import { Hero } from "@/components/site/hero";
import { StatCounter } from "@/components/site/stat-counter";
import { CourseCard } from "@/components/site/course-card";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";
import { getFeaturedCourses, getFeaturedProducts, getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [courses, products, stats] = await Promise.all([
    getFeaturedCourses(4),
    getFeaturedProducts(5),
    getStats(),
  ]);

  return (
    <>
      <Hero />

      {/* Stats */}
      <section className="bg-secondary/40">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-8 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
          <StatCounter value={stats?.students ?? 0} suffix="+" label="Học viên" icon={<Users className="h-6 w-6" />} />
          <StatCounter value={stats?.courses ?? 0} suffix="+" label="Khóa học" icon={<GraduationCap className="h-6 w-6" />} />
          <StatCounter value={stats?.products ?? 0} suffix="+" label="Sản phẩm" icon={<ShoppingBag className="h-6 w-6" />} />
          <StatCounter value={stats?.satisfaction ?? 98} suffix="%" label="Hài lòng" icon={<Star className="h-6 w-6" />} />
        </div>
      </section>

      {/* Featured courses */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Đào tạo</p>
            <h2 className="mt-1 font-sans text-2xl font-bold md:text-3xl">Khóa học nổi bật</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">Các chương trình đào tạo được học viên yêu thích nhất.</p>
          </div>
          <Button asChild variant="ghost" className="hidden gap-1 sm:inline-flex">
            <Link href="/khoa-hoc">Xem tất cả <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(courses ?? []).map((c, i) => <CourseCard key={c?.id ?? i} course={c} index={i} />)}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Mỹ phẩm</p>
              <h2 className="mt-1 font-sans text-2xl font-bold md:text-3xl">Sản phẩm bán chạy</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">Bộ sản phẩm chăm sóc tóc cao cấp cho salon chuyên nghiệp.</p>
            </div>
            <Button asChild variant="ghost" className="hidden gap-1 sm:inline-flex">
              <Link href="/san-pham">Xem tất cả <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {(products ?? []).map((p, i) => <ProductCard key={p?.id ?? i} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-lg md:px-12">
          <BadgeCheck className="h-12 w-12" />
          <h2 className="font-sans text-2xl font-bold md:text-3xl">Bắt đầu hành trình nghề tóc của bạn</h2>
          <p className="max-w-xl text-primary-foreground/85">Tham gia cộng đồng SALON HAIR SYSTEM để học hỏi, chia sẻ và phát triển sự nghiệp.</p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/dang-ky">Đăng ký miễn phí</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
