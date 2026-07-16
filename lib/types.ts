export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS"

export const COURSE_LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]

export interface CategoryDTO {
  id: string
  name: string
  slug: string
  type: "COURSE" | "PRODUCT"
  icon: string | null
}

export const LEVEL_LABELS: Record<string, string> = {
  "Cơ bản": "Cơ bản",
  "Trung cấp": "Trung cấp",
  "Nâng cao": "Nâng cao",
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
}

export interface AdminStats {
  users: number;
  courses: number;
  products: number;
  enrollments: number;
  reviews: number;
}

export interface SignupTrendPoint {
  date: string;
  count: number;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
}

export interface AdminRecentUser {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "INSTRUCTOR" | "USER";
  createdAt: string;
}

export interface ProductListItem {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  image: string;
  price: number;
  discountPercent: number;
  stock: number;
  category: string;
  brand: string;
  rating: number;
  reviewsCount: number;
  soldCount: number;
  isFeatured?: boolean;
  isPublished?: boolean;
}
export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  thumbnail: string;
  price: number;
  discountPrice: number | null;
  level: CourseLevel;
  durationHours: number;
  instructorName: string;
  category: string;
  rating: number;
  reviewsCount: number;
  lessonsCount: number;
  studentsCount: number;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface ProductForm {
  title: string;
  shortDesc: string;
  description: string;
  price: string | number;
  discountPercent: string | number;
  stock: string | number;
  sku: string;
  images: string[];
  categoryId: string;
  brandId: string;
  isFeatured: boolean;
  isPublished: boolean;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export interface ProductDetailItem extends ProductForm {
  id: string;
  slug: string;
  image: string;
  soldCount: number;
  rating: number;
  reviewsCount: number;
  category?: string;
  brand?: string;
}

export interface ApiCount {
  courses?: number;
  products?: number;
  certificates?: number;
}

export interface InstructorOption {
  id: string;
  fullName: string | null;
  email: string;
}

export interface CategoryAdminItem {
  id: string;
  name: string;
  slug: string;
  type: "COURSE" | "PRODUCT";
  icon: string | null;
  description?: string;
  _count: {
    courses?: number;
    products?: number;
  };
}

export interface BrandAdminItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoPath?: string;
  _count?: {
    products?: number;
  };
}

export interface CertField {
  key: string;
  label: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  width?: number;
}

export const CERT_FIELD_KEYS: { key: CertField["key"]; label: string }[] = [
  { key: "studentName", label: "Tên học viên" },
  { key: "courseTitle", label: "Khóa học" },
  { key: "instructorName", label: "Giảng viên" },
  { key: "issueDate", label: "Ngày cấp" },
  { key: "certificateNumber", label: "Mã chứng chỉ" },
  { key: "completionDate", label: "Ngày hoàn thành" },
  { key: "verifyUrl", label: "Link xác thực" },
];

export interface CertTemplateAdminItem {
  id: string;
  title: string;
  description?: string;
  svgTemplate: string;
  backgroundPath?: string | null;
  fields?: CertField[] | null;
  isDefault: boolean;
  isActive: boolean;
  _count?: {
    certificates?: number;
  };
}

export interface UserAdminItem {
  id: string;
  fullName: string | null;
  email: string;
  role: "ADMIN" | "INSTRUCTOR" | "USER";
  isActive: boolean;
  enrollmentsCount?: number;
  createdAt?: string;
}

export interface CategoryForm {
  id?: string;
  name: string;
  type: "COURSE" | "PRODUCT";
  icon?: string;
  description?: string;
}

export interface BrandForm {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  logoPath?: string;
}

export interface CertTemplateForm {
  id?: string;
  title: string;
  description?: string;
  svgTemplate: string;
  backgroundPath?: string | null;
  fields?: CertField[] | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CourseForm {
  id?: string;
  title: string;
  shortDesc: string;
  description: string;
  price: string | number;
  discountPercent: string | number;
  durationHours: string | number;
  instructorName: string;
  categoryId: string;
  rating: number;
  reviewsCount: string | number;
  lessonsCount: string | number;
  studentsCount: string | number;
  isFeatured: boolean;
  isPublished: boolean;
  discountPrice?: string | number;
  level: string;
  instructorBio?: string;
  instructorId?: string;
  thumbnailPath: string | null;
  thumbnailPublic: boolean;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  requirements?: string[];
  objectives?: string[];
  tags?: string[];
  prerequisiteIds?: string[];
  _reqInput?: string;
  _objInput?: string;
  _tagInput?: string;
}

export interface CourseDetailItem extends CourseForm {
  id: string;
  slug: string;
  thumbnail: string;
  brandId: string;
  brandName: string;
  sticker: string | null;
  videosCount: number;
  discountPrice?: number;
  level: string;
  instructorBio?: string;
  instructorId?: string;
  category?: string;
  price: number;
  discountPercent: number;
  studentsCount: number;
}

export interface QuizForm {
  id?: string;
  title: string;
  description: string;
  lessonId: string;
  passPercent: number;
  timeLimit: number;
  attemptLimit: number;
  isPublished: boolean;
}

export interface QuestionItem {
  id?: string;
  type: string;
  text: string;
  options: string[] | null;
  correctAnswer: string;
  matchedPairs: { left: string; right: string }[] | null;
  correctOrder: string[] | null;
  explanation: string;
  points: string | number;
  order?: number;
}

export interface QuizDetailItem extends QuizForm {
  id: string;
  lessonTitle: string;
  questionCount: number;
  attemptCount: number;
  createdAt: string;
  questions?: QuestionItem[];
  lesson?: { title: string; course?: { title: string } };
}

export interface CouponAdminItem {
  id: string;
  code: string;
  label: string;
  type: "PERCENT" | "FIXED_AMOUNT";
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number;
  usedCount: number;
  courseIds: string[];
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface CouponForm {
  code: string;
  label: string;
  type: "PERCENT" | "FIXED_AMOUNT";
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  courseIds: string[];
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface CustomerAdminItem {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  phone?: string;
  tags: string[];
  orderCount: number;
  enrollmentCount: number;
  totalSpent: number;
  lastActivity: string;
}

export interface CustomerSummary {
  totalCustomers: number;
  payingCustomers: number;
  totalRevenue: number;
}

export interface CustomerDetailItem extends CustomerAdminItem {
  isActive: boolean;
  bio?: string;
  createdAt: string;
  paidOrderCount: number;
  orders: { id: string; orderCode: string; itemCount: number; createdAt: string; status: string; total: number }[];
  enrollments: { id: string; courseTitle: string; enrolledAt: string; progress: number }[];
  notes: { id: string; content: string; author?: { fullName?: string }; createdAt: string }[];
}

export interface OrderAdminItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  firstItemImage?: string;
  itemsCount: number;
  total: number;
  status: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productImage?: string;
  productTitle: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDetailItem extends OrderAdminItem {
  orderType: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  note?: string;
  shippingAddress?: string;
  paymentMethod?: string;
  paidAt?: string;
  user?: { email?: string };
}

export interface AffiliateItem {
  id: string;
  userName: string;
  userEmail: string;
  code: string;
  commissionRate: number;
  referredCount: number;
  balance: number;
  status: string;
}

export interface PayoutItem {
  id: string;
  userName: string;
  affiliateCode: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: string;
  createdAt: string;
}

export interface ReferredUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface CommissionEntry {
  id: string;
  orderCode: string;
  rate: number;
  amount: number;
  status: string;
  createdAt: string;
}

export interface AffiliatePayoutEntry {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  processedAt?: string;
}

export interface AffiliateDetailItem {
  id: string;
  code: string;
  status: string;
  balance: number;
  totalEarned: number;
  totalPaid: number;
  commissionRate: number;
  user?: { fullName: string; email: string; phone?: string };
  referredUsers?: ReferredUser[];
  commissions?: CommissionEntry[];
  payouts?: AffiliatePayoutEntry[];
  payoutBankName?: string;
  payoutAccountNumber?: string;
  payoutAccountName?: string;
}

export interface CourseQuestionItem {
  id: string;
  title: string;
  content: string;
  _count?: { answers: number };
  user?: { fullName: string };
  course: { id: string; title: string; slug: string };
}

export interface CourseAnswerItem {
  id: string;
  content: string;
  user?: { fullName: string; role?: string };
}

export interface ForumThreadItem {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  category?: { name: string };
  author?: { name: string };
  replyCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isHidden: boolean;
}

export interface ForumCategoryItem {
  id: string;
  name: string;
  description?: string;
  _count?: { threads: number };
}

export interface BlogPostItem {
  id: string;
  title: string;
  isFeatured: boolean;
  isPublished: boolean;
  viewCount: number;
  publishedAt: string;
  category?: { name: string };
}

export interface BlogCategoryItem {
  id: string;
  name: string;
}

export interface BlogCommentItem {
  id: string;
  content: string;
  createdAt: string;
  isHidden: boolean;
  user?: { fullName: string };
  post?: { title: string };
}

export interface BlogForm {
  title: string;
  excerpt: string;
  content: string;
  categoryId: string;
  coverImage: string;
  isPublished: boolean;
  isFeatured: boolean;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message?: string;
  createdAt: string;
  isRead: boolean;
  user?: { fullName?: string; email?: string };
}

export interface CertificateItem {
  id: string;
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  issueDate: string;
  isRevoked: boolean;
}

export interface QuizResultAttempt {
  id: string;
  score: number;
  passed: boolean;
  timeSpent?: number;
  completedAt?: string;
  user: { fullName: string; email: string };
}

export interface QuizResultsData {
  quiz: { title: string; lesson?: { title: string } };
  stats: { totalAttempts: number; avgScore: number; passRate: number };
  questions: { length: number }[];
  attempts: QuizResultAttempt[];
}

export interface LessonAttachment {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt?: string;
}
