export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface CreateReview {
  productId: number;
  rating: number;
  title: string;
  comment: string;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { [star: number]: number };
}
