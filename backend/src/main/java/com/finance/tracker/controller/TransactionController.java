
package com.finance.tracker.controller;

import com.finance.tracker.model.Transaction;
import com.finance.tracker.model.User;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.service.TransactionService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final UserRepository userRepository;

    public TransactionController(
            TransactionService transactionService,
            UserRepository userRepository) {

        this.transactionService = transactionService;
        this.userRepository = userRepository;
    }

    // Validate transaction details
    private boolean isValidTransaction(Transaction transaction) {

        return transaction.getTitle() != null
                && !transaction.getTitle().isBlank()
                && transaction.getAmount() > 0
                && Double.isFinite(transaction.getAmount())
                && transaction.getType() != null
                && (transaction.getType().equalsIgnoreCase("INCOME")
                || transaction.getType().equalsIgnoreCase("EXPENSE"))
                && transaction.getDate() != null;
    }

    // Add transaction
    @PostMapping
    public ResponseEntity<?> addTransaction(
            @RequestBody Transaction transaction,
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in first.");
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not found.");
        }

        if (!isValidTransaction(transaction)) {
            return ResponseEntity.badRequest()
                    .body("Enter valid transaction details.");
        }

        transaction.setType(
                transaction.getType().toUpperCase(Locale.ROOT));

        transaction.setUserId(user.getId());
        transaction.setId(null);

        Transaction saved =
                transactionService.addTransaction(transaction);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Get logged-in user's transactions
    @GetMapping
    public ResponseEntity<?> getTransactions(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in first.");
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not found.");
        }

        List<Transaction> transactions =
                transactionService.getTransactionsByUser(user.getId());

        return ResponseEntity.ok(transactions);
    }

    // Update transaction
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTransaction(
            @PathVariable String id,
            @RequestBody Transaction transaction,
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in first.");
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not found.");
        }

        if (!isValidTransaction(transaction)) {
            return ResponseEntity.badRequest()
                    .body("Enter valid transaction details.");
        }

        transaction.setType(
                transaction.getType().toUpperCase(Locale.ROOT));

        return transactionService.updateTransactionForUser(
                        id, user.getId(), transaction)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body("Transaction not found."));
    }

    // Delete transaction
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(
            @PathVariable String id,
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please log in first.");
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not found.");
        }

        boolean deleted = transactionService
                .deleteTransactionForUser(id, user.getId());

        if (!deleted) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Transaction not found.");
        }

        return ResponseEntity.noContent().build();
    }
}
