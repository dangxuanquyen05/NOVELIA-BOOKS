export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: number;
  bookId: number;
  bookTitle?: string;
  userId: number;
  userFullName?: string;
  orderId?: number;
  rating: number;
  comment: string;
  status: ReviewStatus;
  isApproved: boolean;
  isVerifiedPurchase?: boolean;
  rejectionReason?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  createdAt: string;
}

export interface BookReviewSummary {
  bookId: number;
  averageRating: number;
  totalReviews: number;
  starCounts: Record<number, number>;
}

export interface CreateReviewInput {
  rating: number;
  comment: string;
  orderId?: number;
}

export interface ModerateReviewInput {
  status: ReviewStatus;
  rejectionReason?: string;
}
