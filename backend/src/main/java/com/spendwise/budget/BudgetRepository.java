package com.spendwise.budget;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetRepository extends JpaRepository<MonthlyBudget, Long> {
    Optional<MonthlyBudget> findByUser_IdAndYearAndMonth(
            Long userId, int year, int month);
}
