package com.spendwise.budget;

import com.spendwise.auth.AuthService;
import com.spendwise.budget.dto.BudgetRequest;
import com.spendwise.budget.dto.BudgetResponse;
import com.spendwise.user.AppUser;
import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final AuthService authService;

    public BudgetService(
            BudgetRepository budgetRepository,
            AuthService authService) {
        this.budgetRepository = budgetRepository;
        this.authService = authService;
    }

    public BudgetResponse save(String email, BudgetRequest request) {
        AppUser user = authService.findUser(email);

        MonthlyBudget budget = budgetRepository
                .findByUser_IdAndYearAndMonth(
                        user.getId(), request.year(), request.month())
                .orElseGet(() -> new MonthlyBudget(
                        user, request.year(), request.month(), request.amount()));

        if (budget.getId() != null) {
            budget.changeAmount(request.amount());
        }

        MonthlyBudget saved = budgetRepository.save(budget);
        return new BudgetResponse(
                saved.getYear(), saved.getMonth(), saved.getAmount());
    }

    @Transactional(readOnly = true)
    public BudgetResponse get(String email, int year, int month) {
        if (month < 1 || month > 12) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Month must be between 1 and 12.");
        }

        AppUser user = authService.findUser(email);
        return budgetRepository.findByUser_IdAndYearAndMonth(
                        user.getId(), year, month)
                .map(budget -> new BudgetResponse(
                        budget.getYear(), budget.getMonth(), budget.getAmount()))
                .orElseGet(() -> new BudgetResponse(year, month, BigDecimal.ZERO));
    }
}
