"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, BookOpen, ShoppingCart, Users, CreditCard, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqSections = [
  {
    title: "Tài khoản & Đăng ký",
    icon: Users,
    questions: [
      { q: "Làm sao để đăng ký tài khoản?", a: "Nhấn nút \"Đăng ký\" ở góc phải màn hình, điền email và mật khẩu. Sau khi đăng ký, bạn có thể trở thành học viên hoặc đăng ký làm giảng viên nếu có kinh nghiệm." },
      { q: "Tôi quên mật khẩu thì phải làm sao?", a: "Nhấn \"Quên mật khẩu\" ở trang đăng nhập. Hệ thống sẽ gửi link đặt lại mật khẩu qua email của bạn." },
      { q: "Làm sao để trở thành giảng viên?", a: "Đăng nhập > vào \"Đăng ký làm giảng viên\" > điền thông tin > gửi đơn. Đơn sẽ được admin duyệt trong 1-3 ngày làm việc." },
      { q: "Có mấy loại tài khoản?", a: "Có 3 loại: Học viên (mua khóa học/sản phẩm), Giảng viên (tạo và bán khóa học), và Quản trị (quản lý nền tảng)." },
    ],
  },
  {
    title: "Mua sắm & Thanh toán",
    icon: ShoppingCart,
    questions: [
      { q: "Tôi có thể thanh toán bằng những phương thức nào?", a: "Hiện tại chúng tôi hỗ trợ: Chuyển khoản VietQR (miễn phí), VNPay, và MoMo. Tất cả đều an toàn và bảo mật." },
      { q: "Khi nào tôi nhận được hàng?", a: "Đơn hàng sản phẩm vật lý sẽ được xử lý trong 1-3 ngày làm việc và giao trong 3-7 ngày tùy khu vực. Khóa học online được kích hoạt ngay sau khi thanh toán thành công." },
      { q: "Tôi có thể hủy đơn hàng không?", a: "Bạn có thể hủy đơn trước khi đơn chuyển sang trạng thái \"Đang xử lý\". Vào trang \"Đơn hàng của tôi\" để hủy hoặc liên hệ bộ phận hỗ trợ." },
      { q: "Chính sách đổi trả như thế nào?", a: "Sản phẩm vật lý được đổi trả trong 7 ngày nếu còn nguyên seal, chưa qua sử dụng. Khóa học online không được hoàn tiền sau khi đã kích hoạt. Liên hệ hotline để được hỗ trợ." },
    ],
  },
  {
    title: "Khóa học & Học tập",
    icon: BookOpen,
    questions: [
      { q: "Làm sao để bắt đầu một khóa học?", a: "Chọn khóa học > nhấn \"Đăng ký\" > thanh toán > khóa học sẽ xuất hiện trong \"Khóa học của tôi\". Nhấn \"Bắt đầu\" để học." },
      { q: "Tôi có được cấp chứng chỉ không?", a: "Có! Khi hoàn thành 100% bài học và pass quiz của khóa học, bạn sẽ nhận được chứng chỉ hoàn thành. Chứng chỉ có thể tải PDF hoặc xác minh online." },
      { q: "Quiz có thể làm lại không?", a: "Tùy từng khóa học. Mỗi quiz có thể có số lần làm tối đa khác nhau (mặc định là 3 lần). Vượt quá giới hạn, bạn cần liên hệ hỗ trợ." },
      { q: "Tôi có thể học trên điện thoại không?", a: "Có, website hoàn toàn tương thích với điện thoại và tablet. Bạn có thể học mọi lúc mọi nơi qua trình duyệt." },
    ],
  },
  {
    title: "Tiếp thị liên kết (Affiliate)",
    icon: CreditCard,
    questions: [
      { q: "Chương trình affiliate hoạt động như thế nào?", a: "Đăng ký tham gia > nhận link giới thiệu > chia sẻ cho bạn bè > khi họ mua hàng, bạn nhận hoa hồng 10-30% tùy sản phẩm." },
      { q: "Khi nào tôi nhận được tiền hoa hồng?", a: "Hoa hồng được cộng vào tài khoản khi đơn hàng được thanh toán thành công. Bạn có thể rút tiền khi số dư đạt tối thiểu 500.000đ." },
      { q: "Làm sao theo dõi hoa hồng?", a: "Vào \"Tiếp thị liên kết\" trong tài khoản để xem danh sách đơn hàng, hoa hồng chờ duyệt, và lịch sử thanh toán." },
    ],
  },
  {
    title: "Diễn đàn & Cộng đồng",
    icon: HelpCircle,
    questions: [
      { q: "Làm sao để đăng bài trên diễn đàn?", a: "Đăng nhập > vào \"Diễn đàn\" > chọn chủ đề > nhấn \"Tạo chủ đề mới\". Bạn cần đăng nhập để tham gia." },
      { q: "Tôi có thể hỏi đáp về bài học không?", a: "Có! Mỗi bài học có phần Hỏi đáp. Bạn có thể đặt câu hỏi và giảng viên hoặc học viên khác sẽ trả lời." },
    ],
  },
];

export default function GuidePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSections = faqSections
    .map((section) => ({
      ...section,
      questions: section.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.a.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((section) => section.questions.length > 0);

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Hướng dẫn sử dụng</h1>
        <p className="text-muted-foreground">Tìm câu trả lời cho các câu hỏi thường gặp</p>
      </div>

      <div className="relative max-w-md mx-auto mb-10">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm câu hỏi..."
          className="pl-9"
        />
      </div>

      {filteredSections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Không tìm thấy câu hỏi phù hợp.</p>
          <p className="text-sm mt-1">Thử tìm kiếm với từ khóa khác.</p>
           <Link href="/ve-chung-toi">
             <Button variant="outline" className="mt-4">Liên hệ hỗ trợ</Button>
           </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="border rounded-xl p-6 bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((item, i) => (
                    <AccordionItem key={i} value={`${section.title}-${i}`}>
                      <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 text-center p-6 border rounded-xl bg-muted/50">
        <h3 className="font-semibold mb-2">Bạn không tìm thấy câu trả lời?</h3>
        <p className="text-sm text-muted-foreground mb-4">Liên hệ với chúng tôi qua email hoặc hotline, đội ngũ hỗ trợ sẵn sàng giúp bạn 24/7.</p>
        <div className="flex items-center justify-center gap-3">
           <Link href="/ve-chung-toi">
             <Button>Liên hệ hỗ trợ</Button>
           </Link>
          <Link href="/dang-ky">
            <Button variant="outline">Đăng ký tài khoản</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}