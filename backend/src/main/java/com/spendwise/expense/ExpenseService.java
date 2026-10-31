package com.spendwise.expense;

import com.spendwise.auth.AuthService;
import com.spendwise.expense.dto.ExpenseRequest;
import com.spendwise.expense.dto.ExpenseResponse;
import com.spendwise.user.AppUser;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final AuthService authService;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            AuthService authService) {
        this.expenseRepository = expenseRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> list(
            String email,
            LocalDate from,
            LocalDate to,
            ExpenseCategory category) {
        AppUser user = authService.findUser(email);

        List<Expense> expenses = category == null
                ? expenseRepository
                    .findByUser_IdAndExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(
                            user.getId(), from, to)
                : expenseRepository
                    .findByUser_IdAndCategoryAndExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(
                            user.getId(), category, from, to);

        return expenses.stream().map(this::toResponse).toList();
    }

    public ExpenseResponse create(String email, ExpenseRequest request) {
        AppUser user = authService.findUser(email);

        Expense expense = new Expense(
                user,
                request.description().trim(),
                request.amount(),
                request.category(),
                request.date(),
                cleanNotes(request.notes())
        );

        return toResponse(expenseRepository.save(expense));
    }

    public ExpenseResponse update(
            String email,
            Long expenseId,
            ExpenseRequest request) {
        AppUser user = authService.findUser(email);

        Expense expense = expenseRepository
                .findByIdAndUser_Id(expenseId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Expense was not found."));

        expense.update(
                request.description().trim(),
                request.amount(),
                request.category(),
                request.date(),
                cleanNotes(request.notes())
        );

        return toResponse(expenseRepository.save(expense));
    }

    public void delete(String email, Long expenseId) {
        AppUser user = authService.findUser(email);

        Expense expense = expenseRepository
                .findByIdAndUser_Id(expenseId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Expense was not found."));

        expenseRepository.delete(expense);
    }

    private String cleanNotes(String notes) {
        return notes == null || notes.isBlank() ? null : notes.trim();
    }

    public ExpenseResponse toResponse(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getDescription(),
                expense.getAmount(),
                expense.getCategory(),
                expense.getExpenseDate(),
                expense.getNotes(),
                expense.getCreatedAt()
        );
    }
}
