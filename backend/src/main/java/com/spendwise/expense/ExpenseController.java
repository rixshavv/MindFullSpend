package com.spendwise.expense;

import com.spendwise.expense.dto.ExpenseRequest;
import com.spendwise.expense.dto.ExpenseResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public List<ExpenseResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) ExpenseCategory category) {

        YearMonth currentMonth = YearMonth.now();
        LocalDate start = from == null ? currentMonth.atDay(1) : from;
        LocalDate end = to == null ? currentMonth.atEndOfMonth() : to;

        if (end.isBefore(start)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "'to' must be on or after 'from'.");
        }

        return expenseService.list(jwt.getSubject(), start, end, category);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ExpenseRequest request) {
        return expenseService.create(jwt.getSubject(), request);
    }

    @PutMapping("/{id}")
    public ExpenseResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request) {
        return expenseService.update(jwt.getSubject(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id) {
        expenseService.delete(jwt.getSubject(), id);
    }
}
