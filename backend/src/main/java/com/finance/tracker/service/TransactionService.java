
package com.finance.tracker.service;

import com.finance.tracker.model.Transaction;
import com.finance.tracker.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    // Add a new transaction
    public Transaction addTransaction(Transaction transaction) {
        transaction.setId(null);
        return transactionRepository.save(transaction);
    }

    // Get transactions belonging to a user
    public List<Transaction> getTransactionsByUser(String userId) {
        return transactionRepository.findByUserId(userId);
    }

    // Update a transaction belonging to a user
    public Optional<Transaction> updateTransactionForUser(
            String transactionId,
            String userId,
            Transaction updatedTransaction) {

        return transactionRepository
                .findByIdAndUserId(transactionId, userId)
                .map(existingTransaction -> {

                    existingTransaction.setTitle(
                            updatedTransaction.getTitle());

                    existingTransaction.setAmount(
                            updatedTransaction.getAmount());

                    existingTransaction.setType(
                            updatedTransaction.getType());

                    existingTransaction.setCategory(
                            updatedTransaction.getCategory());

                    existingTransaction.setDate(
                            updatedTransaction.getDate());

                    // Preserve original ID and owner
                    return transactionRepository.save(
                            existingTransaction);
                });
    }

    // Delete a transaction belonging to a user
    public boolean deleteTransactionForUser(
            String transactionId,
            String userId) {

        return transactionRepository
                .findByIdAndUserId(transactionId, userId)
                .map(transaction -> {
                    transactionRepository.delete(transaction);
                    return true;
                })
                .orElse(false);
    }
}
