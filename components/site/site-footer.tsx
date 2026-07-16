import Link from "next/link";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-[1200px] px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <div className="font-sans text-lg font-extrabold tracking-tight text-primary">SALON HAIR SYSTEM</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Đào tạo • Mỹ phẩm • Cộng đồng</div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Nền tảng học tập & kinh doanh dành riêng cho ngành làm đẹp – salon – mỹ phẩm. Đồng hành cùng bạn trên hành trình phát triển sự nghiệp.
            </p>
          </div>
          <div>
            <h4 className="font-sans text-sm font-bold text-foreground">Khám phá</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/khoa-hoc" className="hover:text-primary">Khóa học</Link></li>
              <li><Link href="/san-pham" className="hover:text-primary">Sản phẩm</Link></li>
              <li><Link href="/ve-chung-toi" className="hover:text-primary">Về chúng tôi</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sans text-sm font-bold text-foreground">Liên hệ</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />1900 1234</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />lienhe@salonhairsystem.vn</li>
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" />123 Đường Làm Đẹp, Quận 1, TP.HCM</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SALON HAIR SYSTEM. Đã đăng ký bản quyền.
        </div>
      </div>
    </footer>
  );
}
