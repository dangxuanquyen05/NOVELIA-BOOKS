package com.novelia.recommendation.ai.service;

import com.novelia.category.entity.Category;
import com.novelia.recommendation.ai.dto.ParsedCriteriaResult;
import com.novelia.recommendation.dto.BookMatchSurveyRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic, offline Rule-Based Intent Parser for Vietnamese book search queries.
 * Acts as high-reliability primary or fallback provider when external AI is unavailable.
 */
@Service
public class RuleBasedIntentParser implements AiIntentParserService {

    private static final Pattern BUDGET_UNDER_PATTERN = Pattern.compile(
            "(?:dưới|nhỏ hơn|<|dưới mức|không quá|tối đa)\\s*(\\d+)(?:\\s*(?:k|nghìn|ngàn|000|đ|vnd))?",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern BUDGET_ABOUT_PATTERN = Pattern.compile(
            "(?:tầm|khoảng|cỡ|gần|quanh)\\s*(\\d+)(?:\\s*(?:k|nghìn|ngàn|000|đ|vnd))?",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public ParsedCriteriaResult parseNaturalQuery(String userQuery, List<Category> availableCategories) {
        if (userQuery == null || userQuery.trim().isEmpty()) {
            return ParsedCriteriaResult.builder()
                    .surveyRequest(BookMatchSurveyRequest.builder().limit(8).build())
                    .naturalInsight("Đã áp dụng các gợi ý tiêu chuẩn từ thư viện sách tinh hoa NOVELIA.")
                    .detectedIntent("Gợi ý tổng quát")
                    .provider("rule-based-fallback")
                    .fallbackUsed(true)
                    .build();
        }

        String lowerQuery = userQuery.toLowerCase().trim();

        // 1. Detect Reading Goals
        Set<String> goals = new HashSet<>();
        if (containsAny(lowerQuery, "tư duy", "phát triển", "thành công", "tự tin", "động lực", "thói quen", "bản thân")) {
            goals.add("MINDSET");
        }
        if (containsAny(lowerQuery, "chữa lành", "stress", "căng thẳng", "bình yên", "thư giãn", "nhẹ nhàng", "tĩnh tâm", "buồn", "mệt mỏi")) {
            goals.add("HEALING");
            goals.add("REFLECTION");
        }
        if (containsAny(lowerQuery, "triết học", "tư tưởng", "khắc kỷ", "hiện sinh", "nhân sinh", "ý nghĩa cuộc sống")) {
            goals.add("PHILOSOPHY");
        }
        if (containsAny(lowerQuery, "kỹ năng", "kinh doanh", "lãnh đạo", "giao tiếp", "quản trị", "làm việc", "sự nghiệp", "tiền bạc", "đầu tư")) {
            goals.add("CAREER_SKILLS");
        }
        if (containsAny(lowerQuery, "trinh thám", "ly kỳ", "vụ án", "suy luận", "kịch tính", "hồi hộp")) {
            goals.add("DETECTIVE");
            goals.add("ENTERTAINMENT");
        }
        if (containsAny(lowerQuery, "kinh điển", "văn học", "bất hủ", "danh tác", "tiểu thuyết kinh điển")) {
            goals.add("CLASSIC");
        }

        // 2. Detect Reading Level
        String preferredLevel = "INTERMEDIATE";
        if (containsAny(lowerQuery, "dễ hiểu", "nhập môn", "cơ bản", "mới bắt đầu", "ngắn gọn", "dễ tiếp cận", "cho người mới")) {
            preferredLevel = "BEGINNER";
        } else if (containsAny(lowerQuery, "chuyên sâu", "nâng cao", "học thuật", "nghiên cứu", "chi tiết", "dày")) {
            preferredLevel = "ADVANCED";
        }

        // 3. Detect Budget
        BigDecimal targetBudget = null;
        BigDecimal maxBudget = null;
        boolean strictBudget = false;

        Matcher underMatcher = BUDGET_UNDER_PATTERN.matcher(lowerQuery);
        if (underMatcher.find()) {
            try {
                long num = Long.parseLong(underMatcher.group(1));
                if (num < 1000) num *= 1000; // e.g. 150k -> 150000
                maxBudget = BigDecimal.valueOf(num);
                targetBudget = BigDecimal.valueOf(Math.round(num * 0.85));
                strictBudget = true;
            } catch (Exception ignored) {}
        }

        if (maxBudget == null) {
            Matcher aboutMatcher = BUDGET_ABOUT_PATTERN.matcher(lowerQuery);
            if (aboutMatcher.find()) {
                try {
                    long num = Long.parseLong(aboutMatcher.group(1));
                    if (num < 1000) num *= 1000;
                    targetBudget = BigDecimal.valueOf(num);
                    maxBudget = BigDecimal.valueOf(Math.round(num * 1.25));
                } catch (Exception ignored) {}
            }
        }

        if (maxBudget == null && containsAny(lowerQuery, "rẻ", "tiết kiệm", "giá sinh viên", "hạt dẻ")) {
            maxBudget = BigDecimal.valueOf(150000);
            targetBudget = BigDecimal.valueOf(100000);
            strictBudget = true;
        }

        // 4. Detect Category IDs from catalog
        Set<Long> matchedCategoryIds = new HashSet<>();
        List<String> matchedCategoryNames = new ArrayList<>();

        if (availableCategories != null) {
            for (Category cat : availableCategories) {
                if (cat.getName() != null && lowerQuery.contains(cat.getName().toLowerCase())) {
                    matchedCategoryIds.add(cat.getId());
                    matchedCategoryNames.add(cat.getName());
                } else if (cat.getSlug() != null && lowerQuery.contains(cat.getSlug().replace("-", " "))) {
                    matchedCategoryIds.add(cat.getId());
                    matchedCategoryNames.add(cat.getName());
                }
            }
        }

        // Fallback: If no explicit category name mentioned, map common aliases
        if (matchedCategoryIds.isEmpty() && availableCategories != null) {
            for (Category cat : availableCategories) {
                String catName = cat.getName() != null ? cat.getName().toLowerCase() : "";
                if (containsAny(lowerQuery, "văn học", "truyện", "tiểu thuyết") && catName.contains("văn học")) {
                    matchedCategoryIds.add(cat.getId());
                    matchedCategoryNames.add(cat.getName());
                } else if (containsAny(lowerQuery, "kinh tế", "startup", "khởi nghiệp", "kinh doanh") && catName.contains("kinh doanh")) {
                    matchedCategoryIds.add(cat.getId());
                    matchedCategoryNames.add(cat.getName());
                } else if (containsAny(lowerQuery, "tâm lý", "tâm hồn", "cảm xúc") && (catName.contains("tâm lý") || catName.contains("kỹ năng"))) {
                    matchedCategoryIds.add(cat.getId());
                    matchedCategoryNames.add(cat.getName());
                }
            }
        }

        // 5. Require in stock
        boolean requireInStock = containsAny(lowerQuery, "còn hàng", "giao ngay", "mua liền", "sẵn sách");

        BookMatchSurveyRequest surveyRequest = BookMatchSurveyRequest.builder()
                .readingGoals(goals)
                .categoryIds(matchedCategoryIds)
                .preferredLevel(preferredLevel)
                .targetBudget(targetBudget)
                .maxBudget(maxBudget)
                .strictBudget(strictBudget)
                .requireInStock(requireInStock)
                .language("vi")
                .limit(8)
                .build();

        // 6. Natural insight explanation
        StringBuilder insight = new StringBuilder();
        insight.append("Dựa trên nhu cầu của bạn, Novelia Books đã chuyển đổi thành các tiêu chí đọc: ");
        if (!goals.isEmpty()) {
            insight.append("Mục tiêu: ").append(String.join(", ", goals)).append("; ");
        }
        if (!matchedCategoryNames.isEmpty()) {
            insight.append("Thể loại: ").append(String.join(", ", matchedCategoryNames)).append("; ");
        }
        if (maxBudget != null) {
            insight.append(String.format("Ngân sách tối đa: %,d đ; ", maxBudget.longValue()));
        }
        insight.append("Mức độ: ").append("BEGINNER".equals(preferredLevel) ? "Dễ tiếp cận" : "ADVANCED".equals(preferredLevel) ? "Chuyên sâu" : "Tiêu chuẩn");
        insight.append(". Toàn bộ tác phẩm được đối chiếu và xác thực trực tiếp từ kho sách thật.");

        return ParsedCriteriaResult.builder()
                .surveyRequest(surveyRequest)
                .naturalInsight(insight.toString())
                .detectedIntent("Trích xuất thông minh (Rule-based NLP Engine)")
                .provider("rule-based-fallback")
                .fallbackUsed(true)
                .build();
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) {
                return true;
            }
        }
        return false;
    }
}
