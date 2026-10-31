package com.spendwise.budget.dto;

import java.math.BigDecimal;

public record BudgetResponse(
        int year,
        int month,
        BigDecimal amount
) {
}
