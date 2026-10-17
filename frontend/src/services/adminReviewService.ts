import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { PageResponse } from '../types/book';
import type { ModerateReviewInput, Review, ReviewStatus } from '../types/review';

export const adminReviewService = {
  async getAllReviews(
    status?: ReviewStatus,
    bookId?: number,
    rating?: number,
    keyword?: string,
    page = 0,
    size = 10
  ): Promise<PageResponse<Review>> {
    const res = await apiClient.get<ApiResponse<PageResponse<Review>>>('/admin/reviews', {
      params: {
        status: status || undefined,
        bookId: bookId || undefined,
        rating: rating || undefined,
        keyword: keyword || undefined,
        page,
        size
      },
    });
    return res.data.data;
  },

  async moderateReview(id: number, input: ModerateReviewInput): Promise<Review> {
    const res = await apiClient.put<ApiResponse<Review>>(`/admin/reviews/${id}/moderate`, input);
    return res.data.data;
  },

  async deleteReview(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/admin/reviews/${id}`);
  },
};
