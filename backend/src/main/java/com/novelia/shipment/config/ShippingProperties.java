package com.novelia.shipment.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "novelia.shipping.ghn")
public class ShippingProperties {
    private String carrierName = "GiaoHangNhanh";
    private String apiEndpoint = "https://dev-online-gateway.ghn.vn/shiip/public-api/v2";
    private String apiToken; // Live credentials: null if not yet provided by partner
    private Integer shopId;   // Live shop ID
    private boolean sandboxMode = true;
    private int connectionTimeoutMs = 5000;
    private int readTimeoutMs = 10000;
    private int maxRetryAttempts = 3;
    private long retryBackoffMs = 1000;
    private String webhookToken = "novelia_ghn_webhook_secret_2026";

    public boolean isLiveCredentialsConfigured() {
        return apiToken != null && !apiToken.trim().isEmpty() && shopId != null;
    }
}
