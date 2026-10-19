import { apiClient } from './api';
import type { ApiResponse } from '../types/api';
import type {
  BookMatchOptionsResponse,
  BookMatchSurveyRequest,
  BookMatchRecommendationResponse,
  BookMatchFeedbackRequest,
  UserPreferenceResponse,
} from '../types/bookMatch';

export const bookMatchService = {
  // Lấy các tùy chọn cho bài khảo sát BookMatch
  getOptions: async (): Promise<ApiResponse<BookMatchOptionsResponse>> => {
    const response = await apiClient.get<ApiResponse<BookMatchOptionsResponse>>('/bookmatch/options');
    return response.data;
  },

  // Gửi tiêu chí khảo sát và nhận danh sách gợi ý cá nhân hóa BookMatch
  getRecommendationsBySurvey: async (
    request: BookMatchSurveyRequest
  ): Promise<ApiResponse<BookMatchRecommendationResponse>> => {
    const response = await apiClient.post<ApiResponse<BookMatchRecommendationResponse>>(
      '/bookmatch/recommend',
      request
    );
    return response.data;
  },

  // Ghi nhận phản hồi gợi ý (Hữu ích / Không phù hợp)
  sendFeedback: async (request: BookMatchFeedbackRequest): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/bookmatch/feedback', request);
    return response.data;
  },

  // Lấy sở thích đã lưu của tài khoản đang đăng nhập
  getUserPreferences: async (): Promise<ApiResponse<UserPreferenceResponse>> => {
    const response = await apiClient.get<ApiResponse<UserPreferenceResponse>>('/bookmatch/preferences');
    return response.data;
  },

  // Lưu sở thích vào tài khoản đang đăng nhập
  saveUserPreferences: async (request: BookMatchSurveyRequest): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/bookmatch/preferences', request);
    return response.data;
  },

  // Xóa toàn bộ sở thích và lịch sử phản hồi gợi ý của tài khoản (Right to be Forgotten)
  deleteUserPreferences: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>('/bookmatch/preferences');
    return response.data;
  },

  // Kiểm tra trạng thái hoạt động của Trợ lý AI / Cơ chế dự phòng
  getAiStatus: async (): Promise<ApiResponse<import('../types/bookMatch').AiStatusResponse>> => {
    const response = await apiClient.get<ApiResponse<import('../types/bookMatch').AiStatusResponse>>(
      '/bookmatch/ai/status'
    );
    return response.data;
  },

  // Gửi câu hỏi ngôn ngữ tự nhiên tới Trợ lý AI Assistant
  askAiAssistant: async (
    query: string
  ): Promise<ApiResponse<import('../types/bookMatch').AiAssistantResponse>> => {
    const response = await apiClient.post<ApiResponse<import('../types/bookMatch').AiAssistantResponse>>(
      '/bookmatch/ai/assistant',
      { query }
    );
    return response.data;
  },
};

