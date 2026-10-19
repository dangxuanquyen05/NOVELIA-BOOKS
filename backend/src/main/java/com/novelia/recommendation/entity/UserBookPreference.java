package com.novelia.recommendation.entity;

import com.novelia.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_book_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class UserBookPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "reading_goals", length = 255)
    private String readingGoals;

    @Column(name = "preferred_categories", length = 255)
    private String preferredCategories;

    @Column(name = "preferred_level", length = 20)
    private String preferredLevel;

    @Column(name = "target_budget", precision = 14, scale = 2)
    private BigDecimal targetBudget;

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
