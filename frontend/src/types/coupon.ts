export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Coupon {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  originalAmount?: number;
  finalAmount?: number;
  message?: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdateCouponInput {
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}
