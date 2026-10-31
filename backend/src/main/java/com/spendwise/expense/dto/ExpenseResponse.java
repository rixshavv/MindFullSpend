package com.spendwise.expense.dto;

import com.spendwise.expense.ExpenseCategory;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExpenseResponse(
        Long id,
        String description,
        BigDecimal amount,
        ExpenseCategory category,
        LocalDate date,
        String notes,
        LocalDateTime createdAt
) {
}
