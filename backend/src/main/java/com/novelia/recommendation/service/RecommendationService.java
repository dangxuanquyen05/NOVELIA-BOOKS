package com.novelia.recommendation.service;

import com.novelia.book.dto.BookResponse;
import com.novelia.recommendation.dto.BookMatchFeedbackRequest;
import com.novelia.recommendation.dto.BookMatchRecommendationResponse;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import com.novelia.recommendation.dto.UserPreferenceResponse;

import java.util.List;

public interface RecommendationService {
    List<BookResponse> getRelatedBooks(String slugOrId, int limit);
    List<BookResponse> getPersonalizedRecommendations(String userEmail, int limit);
    BookMatchRecommendationResponse recommendBySurvey(BookMatchSurveyRequest request);

    void recordFeedback(String userEmail, BookMatchFeedbackRequest request);
    void saveUserPreferences(String userEmail, BookMatchSurveyRequest request);
    UserPreferenceResponse getUserPreferences(String userEmail);
    void deleteUserPreferences(String userEmail);
}
