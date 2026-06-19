package com.example.expense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ExpenseCreateRequest {

    @NotBlank(message = "报销项目不能为空")
    private String title;

    @NotNull(message = "金额不能为空")
    @Positive(message = "金额必须大于0")
    private BigDecimal amount;

    private String description;

    @NotBlank(message = "申请人不能为空")
    private String applicant;
}
