import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type { PageResponse } from '../types/book';
import type { BookReviewSummary, CreateReviewInput, Review } from '../types/review';

export const reviewService = {
  async getBookReviews(bookId: number, page = 0, size = 10): Promise<PageResponse<Review>> {
    const res = await apiClient.get<ApiResponse<PageResponse<Review>>>(`/books/${bookId}/reviews`, {
      params: { page, size },
    });
    return res.data.data;
  },

  async getBookReviewSummary(bookId: number): Promise<BookReviewSummary> {
    const res = await apiClient.get<ApiResponse<BookReviewSummary>>(`/books/${bookId}/reviews/summary`);
    return res.data.data;
  },

  async createReview(bookId: number, input: CreateReviewInput): Promise<Review> {
    const res = await apiClient.post<ApiResponse<Review>>(`/books/${bookId}/reviews`, input);
    return res.data.data;
  },

  async getMyReviews(page = 0, size = 10): Promise<PageResponse<Review>> {
    const res = await apiClient.get<ApiResponse<PageResponse<Review>>>('/reviews/my', {
      params: { page, size },
    });
    return res.data.data;
  },

  async deleteReview(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/reviews/${id}`);
  },
};
