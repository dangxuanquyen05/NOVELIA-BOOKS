package com.novelia.shipment.entity;

import com.novelia.order.entity.Order;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "shipments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Column(name = "shipping_carrier", nullable = false, length = 100)
    @Builder.Default
    private String shippingCarrier = "GiaoHangNhanh";

    @Enumerated(EnumType.STRING)
    @Column(name = "shipping_status", nullable = false, length = 20)
    @Builder.Default
    private ShippingStatus shippingStatus = ShippingStatus.PENDING;

    @Column(name = "estimated_delivery")
    private LocalDateTime estimatedDelivery;

    @Column(name = "actual_delivery")
    private LocalDateTime actualDelivery;

    @Column(length = 255)
    private String note;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum ShippingStatus {
        PENDING,
        PICKED_UP,
        IN_TRANSIT,
        DELIVERED,
        FAILED_ATTEMPT,
        RETURNED
    }
}
