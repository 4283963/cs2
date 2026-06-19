package com.example.expense.dto;

import com.example.expense.entity.AuditLog;
import com.example.expense.entity.ExpenseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {

    private Long id;
    private Long expenseId;
    private String auditor;
    private ExpenseStatus action;
    private String comment;
    private LocalDateTime createdAt;

    public static AuditLogResponse fromEntity(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .expenseId(log.getExpenseId())
                .auditor(log.getAuditor())
                .action(log.getAction())
                .comment(log.getComment())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
