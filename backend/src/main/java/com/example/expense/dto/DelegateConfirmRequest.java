package com.example.expense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DelegateConfirmRequest {

    @NotNull(message = "报销单ID不能为空")
    private Long expenseId;

    @NotBlank(message = "确认人不能为空")
    private String delegatedAuditor;

    private String comment;
}
