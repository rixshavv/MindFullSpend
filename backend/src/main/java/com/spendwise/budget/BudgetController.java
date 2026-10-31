package com.spendwise.budget;

import com.spendwise.budget.dto.BudgetRequest;
import com.spendwise.budget.dto.BudgetResponse;
import jakarta.validation.Valid;
import java.time.YearMonth;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public BudgetResponse get(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        YearMonth current = YearMonth.now();
        return budgetService.get(
                jwt.getSubject(),
                year == null ? current.getYear() : year,
                month == null ? current.getMonthValue() : month
        );
    }

    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    public BudgetResponse save(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody BudgetRequest request) {
        return budgetService.save(jwt.getSubject(), request);
    }
}
