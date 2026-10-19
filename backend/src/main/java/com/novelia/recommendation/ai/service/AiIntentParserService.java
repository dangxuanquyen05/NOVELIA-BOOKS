package com.novelia.recommendation.ai.service;

import com.novelia.category.entity.Category;
import com.novelia.recommendation.ai.dto.ParsedCriteriaResult;

import java.util.List;

public interface AiIntentParserService {

    /**
     * Parse natural language user query into structured BookMatch criteria.
     *
     * @param userQuery The natural language request (e.g. "Muốn đọc cuốn kỹ năng dưới 200k")
     * @param availableCategories List of current real categories from database
     * @return ParsedCriteriaResult containing structured BookMatchSurveyRequest
     */
    ParsedCriteriaResult parseNaturalQuery(String userQuery, List<Category> availableCategories);
}
