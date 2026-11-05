
package com.finance.tracker.repository;

import com.finance.tracker.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository
        extends MongoRepository<Transaction, String> {

    List<Transaction> findByUserId(String userId);

    Optional<Transaction> findByIdAndUserId(
            String id, String userId);
}
