package com.spendwise.dashboard;

import com.spendwise.expense.dto.ExpenseResponse;
import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        int year,
        int month,
        BigDecimal totalSpent,
        BigDecimal monthlyBudget,
        BigDecimal remainingBudget,
        BigDecimal previousMonthSpent,
        BigDecimal monthOverMonthChangePercent,
        long transactionCount,
        String topCategory,
        List<CategorySummary> categoryBreakdown,
        List<DailySummary> dailySpending,
        List<ExpenseResponse> recentExpenses,
        List<String> insights
) {
    public record CategorySummary(
            String category,
            BigDecimal amount,
            BigDecimal percentage
    ) {
    }

    public record DailySummary(
            String date,
            BigDecimal amount
    ) {
    }
}
