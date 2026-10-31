package com.spendwise.dashboard;

import com.spendwise.auth.AuthService;
import com.spendwise.budget.BudgetRepository;
import com.spendwise.budget.MonthlyBudget;
import com.spendwise.dashboard.DashboardResponse.CategorySummary;
import com.spendwise.dashboard.DashboardResponse.DailySummary;
import com.spendwise.expense.Expense;
import com.spendwise.expense.ExpenseCategory;
import com.spendwise.expense.ExpenseRepository;
import com.spendwise.expense.ExpenseService;
import com.spendwise.expense.dto.ExpenseResponse;
import com.spendwise.user.AppUser;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final AuthService authService;
    private final ExpenseRepository expenseRepository;
    private final ExpenseService expenseService;
    private final BudgetRepository budgetRepository;

    public DashboardService(
            AuthService authService,
            ExpenseRepository expenseRepository,
            ExpenseService expenseService,
            BudgetRepository budgetRepository) {
        this.authService = authService;
        this.expenseRepository = expenseRepository;
        this.expenseService = expenseService;
        this.budgetRepository = budgetRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String email, int year, int month) {
        YearMonth selected = YearMonth.of(year, month);
        YearMonth previous = selected.minusMonths(1);
        AppUser user = authService.findUser(email);

        List<Expense> monthExpenses = expenseRepository
                .findByUser_IdAndExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(
                        user.getId(), selected.atDay(1), selected.atEndOfMonth());

        List<Expense> previousExpenses = expenseRepository
                .findByUser_IdAndExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(
                        user.getId(), previous.atDay(1), previous.atEndOfMonth());

        BigDecimal total = sum(monthExpenses);
        BigDecimal previousTotal = sum(previousExpenses);

        BigDecimal budget = budgetRepository
                .findByUser_IdAndYearAndMonth(user.getId(), year, month)
                .map(MonthlyBudget::getAmount)
                .orElse(BigDecimal.ZERO);

        BigDecimal remaining = budget.subtract(total);
        BigDecimal changePercent = previousTotal.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : total.subtract(previousTotal)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(previousTotal, 2, RoundingMode.HALF_UP);

        Map<ExpenseCategory, BigDecimal> byCategory = monthExpenses.stream()
                .collect(Collectors.groupingBy(
                        Expense::getCategory,
                        () -> new EnumMap<>(ExpenseCategory.class),
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                Expense::getAmount,
                                BigDecimal::add
                        )
                ));

        List<CategorySummary> categoryBreakdown = byCategory.entrySet().stream()
                .sorted(Map.Entry.<ExpenseCategory, BigDecimal>comparingByValue().reversed())
                .map(entry -> new CategorySummary(
                        entry.getKey().name(),
                        money(entry.getValue()),
                        total.compareTo(BigDecimal.ZERO) == 0
                                ? BigDecimal.ZERO
                                : entry.getValue()
                                        .multiply(BigDecimal.valueOf(100))
                                        .divide(total, 1, RoundingMode.HALF_UP)
                ))
                .toList();

        Map<LocalDate, BigDecimal> byDay = monthExpenses.stream()
                .collect(Collectors.groupingBy(
                        Expense::getExpenseDate,
                        TreeMap::new,
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                Expense::getAmount,
                                BigDecimal::add
                        )
                ));

        List<DailySummary> dailySpending = byDay.entrySet().stream()
                .map(entry -> new DailySummary(
                        entry.getKey().toString(), money(entry.getValue())))
                .toList();

        String topCategory = categoryBreakdown.isEmpty()
                ? "None"
                : categoryBreakdown.get(0).category();

        List<String> insights = buildInsights(
                total, budget, remaining, previousTotal,
                changePercent, topCategory, monthExpenses.size());

        List<ExpenseResponse> recentExpenses = monthExpenses.stream()
                .limit(6)
                .map(expenseService::toResponse)
                .toList();

        return new DashboardResponse(
                year,
                month,
                money(total),
                money(budget),
                money(remaining),
                money(previousTotal),
                changePercent,
                monthExpenses.size(),
                topCategory,
                categoryBreakdown,
                dailySpending,
                recentExpenses,
                insights
        );
    }

    private List<String> buildInsights(
            BigDecimal total,
            BigDecimal budget,
            BigDecimal remaining,
            BigDecimal previousTotal,
            BigDecimal changePercent,
            String topCategory,
            int count) {
        List<String> insights = new ArrayList<>();

        if (count == 0) {
            insights.add("No expenses recorded for this month yet. Add a transaction to start tracking.");
            return insights;
        }

        if (budget.compareTo(BigDecimal.ZERO) > 0) {
            if (remaining.compareTo(BigDecimal.ZERO) < 0) {
                insights.add("You are over your monthly budget by " + remaining.abs() + ".");
            } else {
                insights.add("You have " + remaining + " remaining in your monthly budget.");
            }
        } else {
            insights.add("Set a monthly budget to track how your spending compares with your target.");
        }

        if (previousTotal.compareTo(BigDecimal.ZERO) > 0) {
            if (changePercent.compareTo(BigDecimal.ZERO) > 0) {
                insights.add("Spending is " + changePercent + "% higher than the previous month.");
            } else if (changePercent.compareTo(BigDecimal.ZERO) < 0) {
                insights.add("Spending is " + changePercent.abs() + "% lower than the previous month.");
            } else {
                insights.add("Spending is unchanged compared with the previous month.");
            }
        }

        if (!"None".equals(topCategory)) {
            insights.add("Your highest spending category this month is " + topCategory + ".");
        }

        return insights;
    }

    private BigDecimal sum(List<Expense> expenses) {
        return expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal money(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }
}
