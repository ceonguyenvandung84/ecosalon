// String constants replacing Prisma enums (SQLite/D1 has no enums)
// Use these instead of importing enums from @prisma/client

export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
} as const
export type Role = (typeof Role)[keyof typeof Role]

export const CategoryType = {
  COURSE: 'COURSE',
  PRODUCT: 'PRODUCT',
} as const
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType]

export const ReviewType = {
  COURSE: 'COURSE',
  PRODUCT: 'PRODUCT',
} as const
export type ReviewType = (typeof ReviewType)[keyof typeof ReviewType]

export const CouponType = {
  PERCENT: 'PERCENT',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const
export type CouponType = (typeof CouponType)[keyof typeof CouponType]

export const EnrollmentSource = {
  FREE: 'FREE',
  PAID: 'PAID',
  COUPON: 'COUPON',
} as const
export type EnrollmentSource = (typeof EnrollmentSource)[keyof typeof EnrollmentSource]

export const CourseLevel = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  ALL_LEVELS: 'ALL_LEVELS',
} as const
export type CourseLevel = (typeof CourseLevel)[keyof typeof CourseLevel]

export const VideoProvider = {
  YOUTUBE: 'YOUTUBE',
  VIMEO: 'VIMEO',
  S3: 'S3',
  OTHER: 'OTHER',
} as const
export type VideoProvider = (typeof VideoProvider)[keyof typeof VideoProvider]

export const ItemType = {
  COURSE: 'COURSE',
  PRODUCT: 'PRODUCT',
} as const
export type ItemType = (typeof ItemType)[keyof typeof ItemType]

export const NotificationType = {
  ORDER_PAID: 'ORDER_PAID',
  ORDER_STATUS: 'ORDER_STATUS',
  NEW_ENROLLMENT: 'NEW_ENROLLMENT',
  NEW_REPLY: 'NEW_REPLY',
  NEW_COMMENT: 'NEW_COMMENT',
  AFFILIATE_COMMISSION: 'AFFILIATE_COMMISSION',
  AFFILIATE_STATUS: 'AFFILIATE_STATUS',
  PAYOUT_STATUS: 'PAYOUT_STATUS',
  ADMIN_BROADCAST: 'ADMIN_BROADCAST',
  GENERAL: 'GENERAL',
  MENTION: 'MENTION',
} as const
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export const AdminAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  VIEW: 'VIEW',
} as const
export type AdminAction = (typeof AdminAction)[keyof typeof AdminAction]

export const AdminEntity = {
  USER: 'USER',
  COURSE: 'COURSE',
  PRODUCT: 'PRODUCT',
  ORDER: 'ORDER',
  CATEGORY: 'CATEGORY',
  COUPON: 'COUPON',
  CERTIFICATE: 'CERTIFICATE',
  CERTIFICATE_TEMPLATE: 'CERTIFICATE_TEMPLATE',
  BLOG_POST: 'BLOG_POST',
  BLOG_CATEGORY: 'BLOG_CATEGORY',
  BLOG_COMMENT: 'BLOG_COMMENT',
  FORUM_THREAD: 'FORUM_THREAD',
  FORUM_REPLY: 'FORUM_REPLY',
  QUIZ: 'QUIZ',
  QUESTION: 'QUESTION',
  LESSON: 'LESSON',
  BRAND: 'BRAND',
  AFFILIATE: 'AFFILIATE',
  SETTINGS: 'SETTINGS',
} as const
export type AdminEntity = (typeof AdminEntity)[keyof typeof AdminEntity]

export const QuestionType = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  TRUE_FALSE: 'TRUE_FALSE',
  FILL_IN: 'FILL_IN',
  MATCHING: 'MATCHING',
  ORDERING: 'ORDERING',
} as const
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType]

export const OrderType = {
  COURSE: 'COURSE',
  PRODUCT: 'PRODUCT',
} as const
export type OrderType = (typeof OrderType)[keyof typeof OrderType]

export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  PROCESSING: 'PROCESSING',
  SHIPPING: 'SHIPPING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const PaymentMethod = {
  BANK_QR: 'BANK_QR',
  VNPAY: 'VNPAY',
  MOMO: 'MOMO',
  COD: 'COD',
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export const AffiliateStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const
export type AffiliateStatus = (typeof AffiliateStatus)[keyof typeof AffiliateStatus]

export const TransactionStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus]

export const CommissionStatus = {
  HOLD: 'HOLD',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const
export type CommissionStatus = (typeof CommissionStatus)[keyof typeof CommissionStatus]

export const PayoutStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  REJECTED: 'REJECTED',
} as const
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus]

export const InstructorApplicationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const
export type InstructorApplicationStatus = (typeof InstructorApplicationStatus)[keyof typeof InstructorApplicationStatus]

// Helpers for fields that were previously String[] (stored as JSON-encoded strings in SQLite/D1)
export function parseJsonArray<T = string>(v: unknown): T[] {
  try {
    if (typeof v === 'string') return JSON.parse(v) as T[]
    if (Array.isArray(v)) return v as T[]
    return []
  } catch {
    return []
  }
}

// Helpers for fields that were previously Json (stored as JSON-encoded strings in SQLite/D1)
export function parseJson<T = any>(v: unknown, fallback: T): T {
  try {
    if (typeof v === 'string') return JSON.parse(v) as T
    if (v === null || v === undefined) return fallback
    return v as T
  } catch {
    return fallback
  }
}
