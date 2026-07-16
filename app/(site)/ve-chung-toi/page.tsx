import Image from "next/image";
import { Target, Eye, Heart, Award, Users, Sparkles } from "lucide-react";

export const metadata = { title: "Về chúng tôi | SALON HAIR SYSTEM" };

export default function AboutPage() {
  const values = [
    { icon: Award, title: "Chất lượng", desc: "Chương trình đào tạo bài bản, cập nhật xu hướng mới nhất." },
    { icon: Heart, title: "Tận tâm", desc: "Đồng hành cùng học viên trên từng bước phát triển nghề." },
    { icon: Users, title: "Cộng đồng", desc: "Mạng lưới nghệ sĩ tóc rộng khắp, kết nối và chia sẻ." },
  ];
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/hero.png" alt="Về SALON HAIR SYSTEM" fill className="object-cover" sizes="100vw" priority />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-4 py-24 text-center text-white sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm backdrop-blur"><Sparkles className="h-4 w-4" /> Về chúng tôi</span>
          <h1 className="mt-4 font-sans text-4xl font-bold md:text-5xl">SALON HAIR SYSTEM</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/85">Hệ sinh thái Đào tạo – Mỹ phẩm – Cộng đồng dành cho người làm nghề tóc chuyên nghiệp tại Việt Nam.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Target className="h-6 w-6" /></div>
            <h2 className="font-sans text-2xl font-bold">Sứ mệnh</h2>
            <p className="mt-3 text-muted-foreground">Mang đến kiến thức và kỹ năng nghề tóc chuẩn quốc tế, giúp mọi học viên tự tin làm chủ sự nghiệp và tạo ra giá trị thật cho khách hàng.</p>
          </div>
          <div className="rounded-2xl bg-card p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Eye className="h-6 w-6" /></div>
            <h2 className="font-sans text-2xl font-bold">Tầm nhìn</h2>
            <p className="mt-3 text-muted-foreground">Trở thành hệ thống đào tạo và cung cấp mỹ phẩm tóc hàng đầu Việt Nam, nơi nuôi dưỡng thế hệ nghệ sĩ tóc tài năng.</p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-center font-sans text-3xl font-bold">Giá trị cốt lõi</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {values.map((v, i) => (
              <div key={i} className="rounded-2xl bg-secondary/40 p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><v.icon className="h-7 w-7" /></div>
                <h3 className="font-sans text-lg font-bold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
