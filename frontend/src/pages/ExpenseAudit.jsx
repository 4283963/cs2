import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, message, Space, Descriptions, List } from 'antd'
import { CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons'
import { expenseApi } from '../api/request.js'
import dayjs from 'dayjs'

const statusMap = {
  PENDING: { color: 'orange', text: '待审批' },
  APPROVED: { color: 'green', text: '已同意' },
  REJECTED: { color: 'red', text: '已拒绝' }
}

function ExpenseAudit() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [auditor, setAuditor] = useState('王主管')
  const [auditModal, setAuditModal] = useState({
    open: false,
    record: null,
    action: null,
    logs: []
  })
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await expenseApi.list()
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openAuditModal = async (record, action) => {
    const logs = await expenseApi.auditLogs(record.id)
    setAuditModal({ open: true, record, action, logs })
    form.resetFields()
  }

  const handleAudit = async (values) => {
    try {
      await expenseApi.audit({
        expenseId: auditModal.record.id,
        auditor,
        action: auditModal.action,
        comment: values.comment
      })
      message.success(
        auditModal.action === 'APPROVED' ? '已同意该报销单' : '已拒绝该报销单'
      )
      setAuditModal({ open: false, record: null, action: null, logs: [] })
      fetchData()
    } catch (e) {
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80
    },
    {
      title: '报销项目',
      dataIndex: 'title'
    },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (val) => `¥${Number(val).toFixed(2)}`
    },
    {
      title: '申请人',
      dataIndex: 'applicant'
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status) => {
        const s = statusMap[status]
        return <Tag color={s.color}>{s.text}</Tag>
      }
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            disabled={record.status !== 'PENDING'}
            onClick={() => openAuditModal(record, 'APPROVED')}
          >
            同意
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            disabled={record.status !== 'PENDING'}
            onClick={() => openAuditModal(record, 'REJECTED')}
          >
            拒绝
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8 }}>当前审批人：</span>
        <Input
          style={{ width: 200, display: 'inline-block' }}
          value={auditor}
          onChange={(e) => setAuditor(e.target.value)}
          placeholder="请输入审批人姓名"
        />
        <Button icon={<ReloadOutlined />} style={{ marginLeft: 8 }} onClick={fetchData}>
          刷新
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
      />

      <Modal
        title={
          auditModal.action === 'APPROVED' ? '同意报销' : '拒绝报销'
        }
        open={auditModal.open}
        onCancel={() => setAuditModal({ open: false, record: null, action: null, logs: [] })}
        onOk={() => form.submit()}
        okText={auditModal.action === 'APPROVED' ? '确认同意' : '确认拒绝'}
        okButtonProps={{
          danger: auditModal.action === 'REJECTED'
        }}
        width={600}
      >
        {auditModal.record && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="ID">{auditModal.record.id}</Descriptions.Item>
              <Descriptions.Item label="申请人">{auditModal.record.applicant}</Descriptions.Item>
              <Descriptions.Item label="报销项目" span={2}>{auditModal.record.title}</Descriptions.Item>
              <Descriptions.Item label="金额">¥{Number(auditModal.record.amount).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="说明">
                {auditModal.record.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            {auditModal.logs.length > 0 && (
              <>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>历史审批记录</div>
                <List
                  size="small"
                  bordered
                  dataSource={auditModal.logs}
                  style={{ marginBottom: 16 }}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <span>{item.auditor}</span>
                            <Tag color={statusMap[item.action].color}>
                              {statusMap[item.action].text}
                            </Tag>
                            <span style={{ color: '#999', fontSize: 12 }}>
                              {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                            </span>
                          </Space>
                        }
                        description={item.comment || '无审批意见'}
                      />
                    </List.Item>
                  )}
                />
              </>
            )}

            <Form form={form} layout="vertical" onFinish={handleAudit}>
              <Form.Item label="审批意见" name="comment">
                <Input.TextArea
                  rows={3}
                  placeholder={auditModal.action === 'APPROVED' ? '请输入同意意见（选填）' : '请输入拒绝理由（选填）'}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  )
}

export default ExpenseAudit
