package com.example.expense.service;

import com.example.expense.dto.AuditRequest;
import com.example.expense.dto.AuditLogResponse;
import com.example.expense.dto.ExpenseCreateRequest;
import com.example.expense.dto.ExpenseResponse;
import com.example.expense.entity.AuditLog;
import com.example.expense.entity.Expense;
import com.example.expense.entity.ExpenseStatus;
import com.example.expense.repository.AuditLogRepository;
import com.example.expense.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional
    public ExpenseResponse createExpense(ExpenseCreateRequest request) {
        Expense expense = Expense.builder()
                .title(request.getTitle())
                .amount(request.getAmount())
                .description(request.getDescription())
                .applicant(request.getApplicant())
                .status(ExpenseStatus.PENDING)
                .build();

        Expense saved = expenseRepository.save(expense);
        return ExpenseResponse.fromEntity(saved);
    }

    public List<ExpenseResponse> getAllExpenses() {
        return expenseRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ExpenseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getExpensesByStatus(ExpenseStatus status) {
        return expenseRepository.findByStatus(status)
                .stream()
                .map(ExpenseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public ExpenseResponse getExpenseById(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("报销单不存在: " + id));
        return ExpenseResponse.fromEntity(expense);
    }

    @Transactional
    public ExpenseResponse auditExpense(AuditRequest request) {
        if (request.getAction() != ExpenseStatus.APPROVED && request.getAction() != ExpenseStatus.REJECTED) {
            throw new IllegalArgumentException("审批动作不合法，只能是 APPROVED 或 REJECTED");
        }

        Expense expense = expenseRepository.findById(request.getExpenseId())
                .orElseThrow(() -> new IllegalArgumentException("报销单不存在: " + request.getExpenseId()));

        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new IllegalStateException("该报销单已被审批，无法重复审批");
        }

        expense.setStatus(request.getAction());
        Expense savedExpense = expenseRepository.save(expense);

        AuditLog auditLog = AuditLog.builder()
                .expenseId(expense.getId())
                .auditor(request.getAuditor())
                .action(request.getAction())
                .comment(request.getComment())
                .build();
        auditLogRepository.save(auditLog);

        return ExpenseResponse.fromEntity(savedExpense);
    }

    public List<AuditLogResponse> getAuditLogsByExpenseId(Long expenseId) {
        return auditLogRepository.findByExpenseIdOrderByCreatedAtDesc(expenseId)
                .stream()
                .map(AuditLogResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
