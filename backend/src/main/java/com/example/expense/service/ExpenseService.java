package com.example.expense.service;

import com.example.expense.dto.AuditRequest;
import com.example.expense.dto.AuditLogResponse;
import com.example.expense.dto.DelegateConfirmRequest;
import com.example.expense.dto.DelegateRequest;
import com.example.expense.dto.ExpenseCreateRequest;
import com.example.expense.dto.ExpenseResponse;
import com.example.expense.entity.AuditLog;
import com.example.expense.entity.Expense;
import com.example.expense.entity.ExpenseStatus;
import com.example.expense.repository.AuditLogRepository;
import com.example.expense.repository.ExpenseRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final AuditLogRepository auditLogRepository;
    private final EntityManager entityManager;

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

    @Transactional(rollbackFor = Exception.class)
    public ExpenseResponse auditExpense(AuditRequest request) {
        if (request.getAction() != ExpenseStatus.APPROVED && request.getAction() != ExpenseStatus.REJECTED) {
            throw new IllegalArgumentException("审批动作不合法，只能是 APPROVED 或 REJECTED");
        }

        Expense expense = expenseRepository.findById(request.getExpenseId())
                .orElseThrow(() -> new IllegalArgumentException("报销单不存在: " + request.getExpenseId()));

        if (expense.getStatus() == ExpenseStatus.SIGNED_ADDING) {
            throw new IllegalStateException("该报销单正在加签核账中，请等待加签经理确认");
        }
        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new IllegalStateException("该报销单已被审批，无法重复审批");
        }

        expense.setStatus(request.getAction());

        try {
            Expense savedExpense = expenseRepository.save(expense);
            entityManager.flush();
            entityManager.lock(savedExpense, LockModeType.OPTIMISTIC_FORCE_INCREMENT);

            AuditLog auditLog = AuditLog.builder()
                    .expenseId(expense.getId())
                    .auditor(request.getAuditor())
                    .action(request.getAction())
                    .comment(request.getComment())
                    .build();
            auditLogRepository.save(auditLog);
            entityManager.flush();

            return ExpenseResponse.fromEntity(savedExpense);
        } catch (OptimisticLockException | OptimisticLockingFailureException e) {
            throw new IllegalStateException("该报销单已被其他主管审批，请刷新页面后重试");
        }
    }

    public List<AuditLogResponse> getAuditLogsByExpenseId(Long expenseId) {
        return auditLogRepository.findByExpenseIdOrderByCreatedAtDesc(expenseId)
                .stream()
                .map(AuditLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(rollbackFor = Exception.class)
    public ExpenseResponse delegate(DelegateRequest request) {
        Expense expense = expenseRepository.findById(request.getExpenseId())
                .orElseThrow(() -> new IllegalArgumentException("报销单不存在: " + request.getExpenseId()));

        if (expense.getStatus() == ExpenseStatus.SIGNED_ADDING) {
            throw new IllegalStateException("该报销单已在加签中，无需重复加签");
        }
        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new IllegalStateException("只能对待审批的报销单发起加签");
        }

        expense.setStatus(ExpenseStatus.SIGNED_ADDING);
        expense.setOriginalAuditor(request.getOriginalAuditor());
        expense.setDelegatedAuditor(request.getDelegatedAuditor());

        try {
            Expense savedExpense = expenseRepository.save(expense);
            entityManager.flush();
            entityManager.lock(savedExpense, LockModeType.OPTIMISTIC_FORCE_INCREMENT);

            AuditLog auditLog = AuditLog.builder()
                    .expenseId(expense.getId())
                    .auditor(request.getOriginalAuditor())
                    .action(ExpenseStatus.SIGNED_ADDING)
                    .comment("加签至 " + request.getDelegatedAuditor()
                            + (request.getComment() != null ? "，原因：" + request.getComment() : ""))
                    .build();
            auditLogRepository.save(auditLog);
            entityManager.flush();

            return ExpenseResponse.fromEntity(savedExpense);
        } catch (OptimisticLockException | OptimisticLockingFailureException e) {
            throw new IllegalStateException("该报销单已被其他主管审批或加签，请刷新页面后重试");
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public ExpenseResponse delegateConfirm(DelegateConfirmRequest request) {
        Expense expense = expenseRepository.findById(request.getExpenseId())
                .orElseThrow(() -> new IllegalArgumentException("报销单不存在: " + request.getExpenseId()));

        if (expense.getStatus() != ExpenseStatus.SIGNED_ADDING) {
            throw new IllegalStateException("该报销单当前不在加签状态");
        }
        if (!request.getDelegatedAuditor().equals(expense.getDelegatedAuditor())) {
            throw new IllegalStateException("只有被加签人 [" + expense.getDelegatedAuditor() + "] 才能确认加签");
        }

        expense.setStatus(ExpenseStatus.PENDING);

        try {
            Expense savedExpense = expenseRepository.save(expense);
            entityManager.flush();
            entityManager.lock(savedExpense, LockModeType.OPTIMISTIC_FORCE_INCREMENT);

            AuditLog auditLog = AuditLog.builder()
                    .expenseId(expense.getId())
                    .auditor(request.getDelegatedAuditor())
                    .action(ExpenseStatus.PENDING)
                    .comment("加签核账确认，退回原审批人 " + expense.getOriginalAuditor()
                            + (request.getComment() != null ? "，意见：" + request.getComment() : ""))
                    .build();
            auditLogRepository.save(auditLog);
            entityManager.flush();

            return ExpenseResponse.fromEntity(savedExpense);
        } catch (OptimisticLockException | OptimisticLockingFailureException e) {
            throw new IllegalStateException("该报销单状态已变更，请刷新页面后重试");
        }
    }
}
