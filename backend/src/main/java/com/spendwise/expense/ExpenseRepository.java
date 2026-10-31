package com.spendwise.expense;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUser_IdAndExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(
            Long userId, LocalDate from, LocalDate to);

    List<Expense> findByUser_IdAndCategoryAndExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(
            Long userId, ExpenseCategory category, LocalDate from, LocalDate to);

    Optional<Expense> findByIdAndUser_Id(Long id, Long userId);
}
