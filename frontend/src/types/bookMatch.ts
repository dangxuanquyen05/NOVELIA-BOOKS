export interface BookMatchOptionItem {
  code?: string;
  label: string;
  maxBudget?: number;
  targetBudget?: number;
}

export interface BookMatchOptionsResponse {
  readingGoals: Array<{ code: string; label: string }>;
  readingLevels: Array<{ code: string; label: string }>;
  budgetRanges: Array<{ label: string; maxBudget?: number; targetBudget?: number }>;
}

export interface BookMatchSurveyRequest {
  readingGoals?: string[];
  categoryIds?: number[];
  preferredLevel?: string;
  targetBudget?: number;
  maxBudget?: number;
  strictBudget?: boolean;
  language?: string;
  requireInStock?: boolean;
  limit?: number;
  dislikedBookIds?: number[];
}

export interface BookMatchItem {
  bookId: number;
  title: string;
  slug: string;
  isbn: string;
  coverImage?: string;
  originalPrice: number;
  salePrice: number;
  availableQuantity: number;
  readingLevel?: string;
  readingGoals?: string;
  language?: string;
  averageRating: number;
  reviewCount: number;
  authors: string[];
  categories: string[];
  matchScore: number;
  matchReasons: string[];
  missingAttributes: string[];
}

export interface BookMatchRecommendationResponse {
  totalMatches: number;
  items: BookMatchItem[];
  appliedFiltersSummary: string;
}

export interface BookMatchFeedbackRequest {
  bookId: number;
  feedbackType: 'HELPFUL' | 'NOT_RELEVANT';
}

export interface UserPreferenceResponse {
  readingGoals?: string[];
  categoryIds?: number[];
  preferredLevel?: string;
  targetBudget?: number;
  updatedAt?: string;
}

export interface AiStatusResponse {
  aiEnabled: boolean;
  credentialsConfigured: boolean;
  provider: string;
  model: string;
  fallbackAvailable: boolean;
  rateLimitPerMinute: number;
  statusMessage: string;
}

export interface AiAssistantResponse {
  originalQuery: string;
  naturalInsight: string;
  detectedIntent: string;
  extractedCriteria: BookMatchSurveyRequest;
  recommendations: BookMatchRecommendationResponse;
  providerUsed: string;
  fallbackUsed: boolean;
  executionTimeMs: number;
}

