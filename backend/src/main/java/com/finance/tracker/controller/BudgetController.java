
package com.finance.tracker.controller;

import com.finance.tracker.model.Budget;
import com.finance.tracker.model.User;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.service.BudgetService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;
    private final UserRepository userRepository;

    public BudgetController(
            BudgetService budgetService,
            UserRepository userRepository) {

        this.budgetService = budgetService;
        this.userRepository = userRepository;
    }

    private User getLoggedInUser(Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {
            return null;
        }

        return userRepository.findByEmail(authentication.getName())
                .orElse(null);
    }

    private boolean isValidBudget(Budget budget) {

        return budget.getMonth() != null
                && Pattern.matches(
                        "\\d{4}-(0[1-9]|1[0-2])",
                        budget.getMonth())
                && budget.getCategory() != null
                && !budget.getCategory().isBlank()
                && budget.getAmount() > 0
                && Double.isFinite(budget.getAmount());
    }

    // Create or update a budget
    @PostMapping
    public ResponseEntity<?> saveBudget(
            @RequestBody Budget budget,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in first.");
        }

        if (!isValidBudget(budget)) {
            return ResponseEntity.badRequest()
                    .body("Enter a valid month, category and positive amount.");
        }

        budget.setUserId(user.getId());
        budget.setId(null);

        Budget saved = budgetService.saveBudget(budget);

        return ResponseEntity.ok(saved);
    }

    // Get budgets for a month
    @GetMapping
    public ResponseEntity<?> getBudgets(
            @RequestParam String month,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in first.");
        }

        if (!Pattern.matches(
                "\\d{4}-(0[1-9]|1[0-2])", month)) {
            return ResponseEntity.badRequest()
                    .body("Invalid month format. Use YYYY-MM.");
        }

        List<Budget> budgets =
                budgetService.getBudgetsByMonth(
                        user.getId(), month);

        return ResponseEntity.ok(budgets);
    }

    // Delete a budget
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBudget(
            @PathVariable String id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in first.");
        }

        boolean deleted = budgetService.deleteBudget(
                id, user.getId());

        if (!deleted) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Budget not found.");
        }

        return ResponseEntity.noContent().build();
    }
}
