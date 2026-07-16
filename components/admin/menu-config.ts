import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, BarChart3, GraduationCap, Brain, ScrollText,
  HelpCircle, ShoppingBag, FolderTree, Tags, ClipboardList,
  Megaphone, DollarSign, Banknote, MessagesSquare, Flag,
  Tag, FileText, Bell, Users, Contact, UserCheck, Shield,
  History, Settings,
} from "lucide-react";

export interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: string;
  children?: MenuItem[];
}

export interface MenuGroup {
  title: string;
  icon: LucideIcon;
  href?: string;
  items: MenuItem[];
}

export const menuGroups: MenuGroup[] = [
  {
    title: "TỔNG QUAN & BÁO CÁO",
    icon: LayoutDashboard,
    href: "/admin",
    items: [
      { href: "/admin", label: "Bàn làm việc chung", icon: LayoutDashboard },
      { href: "/admin/phan-tich", label: "Báo cáo EduTech", icon: BarChart3 },
      { href: "/admin/phan-tich?tab=ecommerce", label: "Báo cáo E-Commerce", icon: ShoppingBag },
      { href: "/admin/phan-tich?tab=affiliate", label: "Báo cáo Affiliate", icon: Megaphone },
    ],
  },
  {
    title: "QUẢN LÝ ĐÀO TẠO",
    icon: GraduationCap,
    href: "/admin/dao-tao",
    items: [
      { href: "/admin/khoa-hoc", label: "Khóa học & Bài học", icon: GraduationCap },
      { href: "/admin/quiz", label: "Câu hỏi & Quiz", icon: Brain },
      { href: "/admin/chung-chi", label: "Chứng chỉ số", icon: ScrollText },
      { href: "/admin/mau-chung-chi", label: "Mẫu chứng chỉ", icon: ScrollText },
      { href: "/admin/cau-hoi", label: "Hỏi & Đáp (Q&A)", icon: HelpCircle },
    ],
  },
  {
    title: "QUẢN LÝ BÁN HÀNG",
    icon: ShoppingBag,
    href: "/admin/ban-hang",
    items: [
      { href: "/admin/san-pham", label: "Sản phẩm", icon: ShoppingBag },
      {
        href: "/admin/danh-muc",
        label: "Danh mục",
        icon: FolderTree,
        children: [
          { href: "/admin/danh-muc?type=COURSE", label: "Danh mục khóa học", icon: FolderTree },
          { href: "/admin/danh-muc?type=PRODUCT", label: "Danh mục sản phẩm", icon: FolderTree },
        ],
      },
      { href: "/admin/thuong-hieu", label: "Thương hiệu", icon: Tags },
      {
        href: "/admin/don-hang",
        label: "Đơn hàng",
        icon: ClipboardList,
        badgeKey: "ordersPending",
        children: [
          { href: "/admin/don-hang", label: "Tất cả đơn hàng", icon: ClipboardList },
          { href: "/admin/don-hang?status=PENDING_PAYMENT", label: "Chờ thanh toán", icon: ClipboardList },
          { href: "/admin/don-hang?status=PAID", label: "Đã thanh toán", icon: ClipboardList },
        ],
      },
    ],
  },
  {
    title: "TIẾP THỊ LIÊN KẾT",
    icon: Megaphone,
    href: "/admin/dashboard/tiep-thi",
    items: [
      { href: "/admin/tiep-thi", label: "Đối tác", icon: Megaphone },
      { href: "/admin/cai-dat?tab=commission", label: "Cấu hình Hoa hồng", icon: DollarSign },
      { href: "/admin/tiep-thi?tab=payouts", label: "Yêu cầu Thanh toán", icon: Banknote },
    ],
  },
  {
    title: "QUẢN LÝ CỘNG ĐỒNG",
    icon: MessagesSquare,
    href: "/admin/cong-dong",
    items: [
      { href: "/admin/dien-dan", label: "Chuyên mục & Bài đăng", icon: MessagesSquare },
      { href: "/admin/dien-dan?tab=reports", label: "Vi phạm & Từ khóa", icon: Flag },
    ],
  },
  {
    title: "MARKETING & NỘI DUNG",
    icon: FileText,
    href: "/admin/marketing",
    items: [
      { href: "/admin/ma-giam-gia", label: "Mã giảm giá", icon: Tag },
      { href: "/admin/bai-viet", label: "Bài viết (Blog)", icon: FileText },
      { href: "/admin/thong-bao", label: "Thông báo", icon: Bell },
    ],
  },
  {
    title: "CÀI ĐẶT & HỆ THỐNG",
    icon: Settings,
    href: "/admin/cai-dat",
    items: [
      { href: "/admin/nguoi-dung", label: "Người dùng", icon: Users },
      { href: "/admin/khach-hang", label: "Khách hàng", icon: Contact },
      { href: "/admin/ung-vien-giang-vien", label: "Giảng viên ứng viên", icon: UserCheck, badgeKey: "instructorApplicants" },
      { href: "/admin/cai-dat?tab=rbac", label: "Phân quyền nhân viên", icon: Shield },
      { href: "/admin/lich-su-hoat-dong", label: "Lịch sử hoạt động", icon: History },
      { href: "/admin/cai-dat", label: "Cấu hình hệ thống", icon: Settings },
    ],
  },
];
