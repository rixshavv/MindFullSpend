package com.spendwise.expense;

import com.spendwise.user.AppUser;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses", indexes = {
        @Index(name = "idx_expense_user_date", columnList = "user_id, expense_date"),
        @Index(name = "idx_expense_user_category", columnList = "user_id, category")
})
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false, length = 160)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ExpenseCategory category;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected Expense() {
    }

    public Expense(
            AppUser user,
            String description,
            BigDecimal amount,
            ExpenseCategory category,
            LocalDate expenseDate,
            String notes) {
        this.user = user;
        this.description = description;
        this.amount = amount;
        this.category = category;
        this.expenseDate = expenseDate;
        this.notes = notes;
        this.createdAt = LocalDateTime.now();
    }

    public void update(
            String description,
            BigDecimal amount,
            ExpenseCategory category,
            LocalDate expenseDate,
            String notes) {
        this.description = description;
        this.amount = amount;
        this.category = category;
        this.expenseDate = expenseDate;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public ExpenseCategory getCategory() { return category; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
