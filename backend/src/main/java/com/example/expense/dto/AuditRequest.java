package com.example.expense.dto;

import com.example.expense.entity.ExpenseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AuditRequest {

    @NotNull(message = "报销单ID不能为空")
    private Long expenseId;

    @NotBlank(message = "审批人不能为空")
    private String auditor;

    @NotNull(message = "审批动作不能为空")
    private ExpenseStatus action;

    private String comment;
}
