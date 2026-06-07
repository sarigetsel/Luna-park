export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountPercent: number;
  expiresAt: string;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt?: string;
}

export interface CreateCouponDto {
  code: string;
  description?: string;
  discountPercent: number;
  expiresAt: string;
  usageLimit?: number | null;
  isActive?: boolean;
  imageUrl?: string;
}
