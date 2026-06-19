package com.example.expense.controller;

import com.example.expense.dto.*;
import com.example.expense.entity.ExpenseStatus;
import com.example.expense.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expense")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ApiResponse<ExpenseResponse> createExpense(@Valid @RequestBody ExpenseCreateRequest request) {
        return ApiResponse.success(expenseService.createExpense(request));
    }

    @GetMapping
    public ApiResponse<List<ExpenseResponse>> getAllExpenses(
            @RequestParam(required = false) ExpenseStatus status) {
        if (status != null) {
            return ApiResponse.success(expenseService.getExpensesByStatus(status));
        }
        return ApiResponse.success(expenseService.getAllExpenses());
    }

    @GetMapping("/{id}")
    public ApiResponse<ExpenseResponse> getExpenseById(@PathVariable Long id) {
        return ApiResponse.success(expenseService.getExpenseById(id));
    }

    @PostMapping("/audit")
    public ApiResponse<ExpenseResponse> auditExpense(@Valid @RequestBody AuditRequest request) {
        return ApiResponse.success(expenseService.auditExpense(request));
    }

    @PostMapping("/delegate")
    public ApiResponse<ExpenseResponse> delegateExpense(@Valid @RequestBody DelegateRequest request) {
        return ApiResponse.success(expenseService.delegate(request));
    }

    @PostMapping("/delegate-confirm")
    public ApiResponse<ExpenseResponse> delegateConfirm(@Valid @RequestBody DelegateConfirmRequest request) {
        return ApiResponse.success(expenseService.delegateConfirm(request));
    }

    @GetMapping("/{id}/audit-logs")
    public ApiResponse<List<AuditLogResponse>> getAuditLogs(@PathVariable Long id) {
        return ApiResponse.success(expenseService.getAuditLogsByExpenseId(id));
    }
}
