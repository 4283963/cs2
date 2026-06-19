package com.example.expense.repository;

import com.example.expense.entity.Expense;
import com.example.expense.entity.ExpenseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByStatus(ExpenseStatus status);
    List<Expense> findByApplicant(String applicant);
    List<Expense> findAllByOrderByCreatedAtDesc();
}
