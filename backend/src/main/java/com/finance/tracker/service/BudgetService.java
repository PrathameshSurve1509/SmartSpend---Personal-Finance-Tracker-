
package com.finance.tracker.service;

import com.finance.tracker.model.Budget;
import com.finance.tracker.repository.BudgetRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;

    public BudgetService(BudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    // Add or update a category budget
    public Budget saveBudget(Budget budget) {

        Optional<Budget> existing =
                budgetRepository.findByUserIdAndMonthAndCategory(
                        budget.getUserId(),
                        budget.getMonth(),
                        budget.getCategory()
                );

        if (existing.isPresent()) {
            Budget oldBudget = existing.get();
            oldBudget.setAmount(budget.getAmount());

            return budgetRepository.save(oldBudget);
        }

        return budgetRepository.save(budget);
    }

    // Get budgets for a particular month
    public List<Budget> getBudgetsByMonth(
            String userId, String month) {

        return budgetRepository.findByUserIdAndMonth(
                userId, month);
    }

    // Delete a budget belonging to a user
    public boolean deleteBudget(String id, String userId) {

        return budgetRepository.findByIdAndUserId(id, userId)
                .map(budget -> {
                    budgetRepository.delete(budget);
                    return true;
                })
                .orElse(false);
    }
}
