-- 报销单表
CREATE TABLE IF NOT EXISTS expense (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '报销项目',
    amount DECIMAL(12,2) NOT NULL COMMENT '报销金额',
    description VARCHAR(500) COMMENT '报销说明',
    applicant VARCHAR(50) NOT NULL COMMENT '申请人',
    status VARCHAR(20) NOT NULL COMMENT '状态：PENDING-待审批 APPROVED-已同意 REJECTED-已拒绝',
    created_at DATETIME NOT NULL COMMENT '创建时间',
    updated_at DATETIME COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_applicant (applicant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报销单表';

-- 审批日志表
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    expense_id BIGINT NOT NULL COMMENT '报销单ID',
    auditor VARCHAR(50) NOT NULL COMMENT '审批人',
    action VARCHAR(20) NOT NULL COMMENT '审批动作：APPROVED-同意 REJECTED-拒绝',
    comment VARCHAR(500) COMMENT '审批意见',
    created_at DATETIME NOT NULL COMMENT '审批时间',
    INDEX idx_expense_id (expense_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批日志表';

-- 初始化示例数据
INSERT INTO expense (title, amount, description, applicant, status, created_at)
SELECT * FROM (
    SELECT '出差交通费', 580.00, '北京到上海高铁往返', '张三', 'PENDING', NOW()
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM expense WHERE title = '出差交通费' AND applicant = '张三');

INSERT INTO expense (title, amount, description, applicant, status, created_at)
SELECT * FROM (
    SELECT '办公用品采购', 2350.50, '部门季度办公用品', '李四', 'APPROVED', NOW()
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM expense WHERE title = '办公用品采购' AND applicant = '李四');
