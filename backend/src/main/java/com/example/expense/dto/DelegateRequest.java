package com.example.expense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DelegateRequest {

    @NotNull(message = "报销单ID不能为空")
    private Long expenseId;

    @NotBlank(message = "原审批人不能为空")
    private String originalAuditor;

    @NotBlank(message = "加签审批人不能为空")
    private String delegatedAuditor;

    private String comment;
}
