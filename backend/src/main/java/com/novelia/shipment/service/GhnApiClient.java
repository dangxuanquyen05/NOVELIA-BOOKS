package com.novelia.shipment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novelia.shipment.config.ShippingProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class GhnApiClient {

    private final ShippingProperties shippingProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GhnApiClient(ShippingProperties shippingProperties, RestTemplateBuilder builder, ObjectMapper objectMapper) {
        this.shippingProperties = shippingProperties;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(shippingProperties.getConnectionTimeoutMs());
        requestFactory.setReadTimeout(shippingProperties.getReadTimeoutMs());

        this.restTemplate = builder
                .requestFactory(() -> requestFactory)
                .build();
    }

    /**
     * Tính phí giao hàng trực tiếp từ GHN API với cơ chế retry và timeout.
     */
    public Optional<BigDecimal> calculateFee(int toDistrictId, String toWardCode, int weightGrams) {
        if (!shippingProperties.isLiveCredentialsConfigured()) {
            log.info("GHN Client: Bỏ qua gọi API tính cước trực tiếp vì chưa cấu hình Live API Token / Shop ID.");
            return Optional.empty();
        }

        String url = shippingProperties.getApiEndpoint() + "/shipping-order/fee";
        Map<String, Object> body = new HashMap<>();
        body.put("from_district_id", 1482); // Quận Đống Đa, Hà Nội (Kho trung tâm Novelia)
        body.put("to_district_id", toDistrictId);
        body.put("to_ward_code", toWardCode != null ? toWardCode : "");
        body.put("service_type_id", 2); // Chuẩn E-commerce
        body.put("weight", weightGrams > 0 ? weightGrams : 500);

        JsonNode responseNode = executeWithRetry(url, HttpMethod.POST, body);
        if (responseNode != null && responseNode.has("data") && responseNode.get("data").has("total")) {
            BigDecimal fee = new BigDecimal(responseNode.get("data").get("total").asText());
            log.info("GHN Client: Tính cước thành công qua API: {} VND", fee);
            return Optional.of(fee);
        }

        return Optional.empty();
    }

    /**
     * Tạo đơn vận chuyển trên hệ thống GHN và nhận mã vận đơn thực tế (order_code).
     */
    public Optional<String> createShippingOrder(Map<String, Object> orderPayload) {
        if (!shippingProperties.isLiveCredentialsConfigured()) {
            log.info("GHN Client: Chưa cấu hình Live credentials. Không tạo mã vận đơn giả lập theo quy định.");
            return Optional.empty();
        }

        String url = shippingProperties.getApiEndpoint() + "/shipping-order/create";
        JsonNode responseNode = executeWithRetry(url, HttpMethod.POST, orderPayload);
        if (responseNode != null && responseNode.has("data") && responseNode.get("data").has("order_code")) {
            String actualOrderCode = responseNode.get("data").get("order_code").asText();
            log.info("GHN Client: Tạo vận đơn thực tế thành công với mã: {}", actualOrderCode);
            return Optional.of(actualOrderCode);
        }

        return Optional.empty();
    }

    /**
     * Tra cứu chi tiết vận đơn từ GHN API.
     */
    public Optional<JsonNode> getOrderDetail(String trackingNumber) {
        if (!shippingProperties.isLiveCredentialsConfigured() || trackingNumber == null || trackingNumber.trim().isEmpty()) {
            return Optional.empty();
        }

        String url = shippingProperties.getApiEndpoint() + "/shipping-order/detail";
        Map<String, Object> body = Map.of("order_code", trackingNumber.trim());

        JsonNode responseNode = executeWithRetry(url, HttpMethod.POST, body);
        return Optional.ofNullable(responseNode);
    }

    /**
     * Thực thi HTTP Request với chính sách Retry tự động khi gặp timeout hoặc lỗi mạng.
     */
    private JsonNode executeWithRetry(String url, HttpMethod method, Object requestBody) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", shippingProperties.getApiToken());
        if (shippingProperties.getShopId() != null) {
            headers.set("ShopId", String.valueOf(shippingProperties.getShopId()));
        }

        HttpEntity<Object> entity = new HttpEntity<>(requestBody, headers);
        int maxAttempts = shippingProperties.getMaxRetryAttempts();
        long backoffMs = shippingProperties.getRetryBackoffMs();

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                log.debug("GHN API Request [Attempt {}/{}]: {} {}", attempt, maxAttempts, method, url);
                ResponseEntity<String> response = restTemplate.exchange(url, method, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return objectMapper.readTree(response.getBody());
                }
            } catch (ResourceAccessException ex) {
                // Network timeout or connection refused
                log.warn("GHN API Timeout / Lỗi kết nối (Lần {}/{}): {}", attempt, maxAttempts, ex.getMessage());
                if (attempt == maxAttempts) {
                    log.error("GHN API đạt giới hạn số lần retry ({}) - Từ bỏ yêu cầu.", maxAttempts);
                    return null;
                }
                try {
                    Thread.sleep(backoffMs * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return null;
                }
            } catch (RestClientResponseException ex) {
                log.error("GHN API phản hồi lỗi HTTP {} (Lần {}/{}): {}", ex.getStatusCode(), attempt, maxAttempts, ex.getResponseBodyAsString());
                if (ex.getStatusCode().is5xxServerError() && attempt < maxAttempts) {
                    try {
                        Thread.sleep(backoffMs * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return null;
                    }
                } else {
                    return null;
                }
            } catch (Exception ex) {
                log.error("Lỗi không mong muốn khi gọi GHN API: {}", ex.getMessage());
                return null;
            }
        }
        return null;
    }
}
