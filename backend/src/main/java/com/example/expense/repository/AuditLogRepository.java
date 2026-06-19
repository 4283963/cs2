package com.example.expense.repository;

import com.example.expense.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByExpenseIdOrderByCreatedAtDesc(Long expenseId);
}
