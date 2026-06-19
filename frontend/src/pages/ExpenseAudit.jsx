import React, { useState, useEffect, useMemo } from 'react'
import {
  Table, Tag, Button, Modal, Form, Input, message, Space, Descriptions,
  List, Tabs, Card
} from 'antd'
import {
  CheckOutlined, CloseOutlined, ReloadOutlined, UserAddOutlined
} from '@ant-design/icons'
import { expenseApi } from '../api/request.js'
import dayjs from 'dayjs'

const statusMap = {
  PENDING: { color: 'orange', text: '待审批' },
  APPROVED: { color: 'green', text: '已同意' },
  REJECTED: { color: 'red', text: '已拒绝' },
  SIGNED_ADDING: { color: 'purple', text: '加签中' }
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

  const [delegateModal, setDelegateModal] = useState({
    open: false,
    record: null,
    logs: []
  })

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    record: null,
    logs: []
  })

  const [auditForm] = Form.useForm()
  const [delegateForm] = Form.useForm()
  const [confirmForm] = Form.useForm()

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

  const myAuditList = useMemo(() => {
    return data.filter(r => r.status === 'PENDING')
  }, [data])

  const myDelegateList = useMemo(() => {
    return data.filter(
      r => r.status === 'SIGNED_ADDING' && r.delegatedAuditor === auditor
    )
  }, [data, auditor])

  const openAuditModal = async (record, action) => {
    const logs = await expenseApi.auditLogs(record.id)
    setAuditModal({ open: true, record, action, logs })
    auditForm.resetFields()
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

  const openDelegateModal = async (record) => {
    const logs = await expenseApi.auditLogs(record.id)
    setDelegateModal({ open: true, record, logs })
    delegateForm.resetFields()
  }

  const handleDelegate = async (values) => {
    try {
      await expenseApi.delegate({
        expenseId: delegateModal.record.id,
        originalAuditor: auditor,
        delegatedAuditor: values.delegatedAuditor,
        comment: values.comment
      })
      message.success('已发起加签，等待 ' + values.delegatedAuditor + ' 协助核账')
      setDelegateModal({ open: false, record: null, logs: [] })
      fetchData()
    } catch (e) {
    }
  }

  const openConfirmModal = async (record) => {
    const logs = await expenseApi.auditLogs(record.id)
    setConfirmModal({ open: true, record, logs })
    confirmForm.resetFields()
  }

  const handleConfirm = async (values) => {
    try {
      await expenseApi.delegateConfirm({
        expenseId: confirmModal.record.id,
        delegatedAuditor: auditor,
        comment: values.comment
      })
      message.success('加签核账确认完成，已退回原审批人 ' + confirmModal.record.originalAuditor)
      setConfirmModal({ open: false, record: null, logs: [] })
      fetchData()
    } catch (e) {
    }
  }

  const baseColumns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '报销项目', dataIndex: 'title' },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (val) => `¥${Number(val).toFixed(2)}`
    },
    { title: '申请人', dataIndex: 'applicant' },
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
    }
  ]

  const auditColumns = [
    ...baseColumns,
    {
      title: '流转信息',
      dataIndex: 'originalAuditor',
      render: (_, record) => (
        <>
          {record.originalAuditor && (
            <div style={{ color: '#888', fontSize: 12, lineHeight: '18px' }}>
              原审批人：{record.originalAuditor}
            </div>
          )}
          {record.delegatedAuditor && (
            <div style={{ color: '#888', fontSize: 12, lineHeight: '18px' }}>
              协助核账：{record.delegatedAuditor}
            </div>
          )}
        </>
      )
    },
    {
      title: '操作',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => openAuditModal(record, 'APPROVED')}
          >
            同意
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => openAuditModal(record, 'REJECTED')}
          >
            拒绝
          </Button>
          <Button
            icon={<UserAddOutlined />}
            onClick={() => openDelegateModal(record)}
          >
            加签
          </Button>
        </Space>
      )
    }
  ]

  const delegateColumns = [
    ...baseColumns,
    {
      title: '原审批人',
      dataIndex: 'originalAuditor'
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => openConfirmModal(record)}
        >
          确认加签核账
        </Button>
      )
    }
  ]

  const renderAuditLogs = (logs) => (
    <>
      {logs.length > 0 && (
        <>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>历史审批记录</div>
          <List
            size="small"
            bordered
            dataSource={logs}
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
    </>
  )

  const renderBaseDescriptions = (record) => (
    <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
      <Descriptions.Item label="ID">{record.id}</Descriptions.Item>
      <Descriptions.Item label="申请人">{record.applicant}</Descriptions.Item>
      <Descriptions.Item label="报销项目" span={2}>{record.title}</Descriptions.Item>
      <Descriptions.Item label="金额">¥{Number(record.amount).toFixed(2)}</Descriptions.Item>
      <Descriptions.Item label="状态">
        <Tag color={statusMap[record.status].color}>
          {statusMap[record.status].text}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="说明" span={2}>
        {record.description || '-'}
      </Descriptions.Item>
      {record.originalAuditor && (
        <Descriptions.Item label="原审批人">{record.originalAuditor}</Descriptions.Item>
      )}
      {record.delegatedAuditor && (
        <Descriptions.Item label="加签核账人">{record.delegatedAuditor}</Descriptions.Item>
      )}
    </Descriptions>
  )

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span>当前操作人：</span>
          <Input
            style={{ width: 200 }}
            value={auditor}
            onChange={(e) => setAuditor(e.target.value)}
            placeholder="请输入当前审批人姓名"
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
          <span style={{ color: '#888', fontSize: 12 }}>
            提示：切换为「李经理」可查看加签待确认列表
          </span>
        </Space>
      </Card>

      <Tabs
        defaultActiveKey="audit"
        items={[
          {
            key: 'audit',
            label: `待我审批（${myAuditList.length}）`,
            children: (
              <Table
                rowKey="id"
                loading={loading}
                dataSource={myAuditList}
                columns={auditColumns}
                locale={{ emptyText: '暂无待审批报销单' }}
              />
            )
          },
          {
            key: 'delegate',
            label: `待我确认（加签）（${myDelegateList.length}）`,
            children: (
              <Table
                rowKey="id"
                loading={loading}
                dataSource={myDelegateList}
                columns={delegateColumns}
                locale={{ emptyText: '暂无待您确认的加签单据，请切换操作人为被加签人查看' }}
              />
            )
          }
        ]}
      />

      {/* 同意/拒绝弹窗 */}
      <Modal
        title={auditModal.action === 'APPROVED' ? '同意报销' : '拒绝报销'}
        open={auditModal.open}
        onCancel={() => setAuditModal({ open: false, record: null, action: null, logs: [] })}
        onOk={() => auditForm.submit()}
        okText={auditModal.action === 'APPROVED' ? '确认同意' : '确认拒绝'}
        okButtonProps={{
          danger: auditModal.action === 'REJECTED'
        }}
        width={600}
        destroyOnClose
      >
        {auditModal.record && (
          <>
            {renderBaseDescriptions(auditModal.record)}
            {renderAuditLogs(auditModal.logs)}
            <Form form={auditForm} layout="vertical" onFinish={handleAudit}>
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

      {/* 加签弹窗 */}
      <Modal
        title="发起加签 - 邀请其他经理协助核账"
        open={delegateModal.open}
        onCancel={() => setDelegateModal({ open: false, record: null, logs: [] })}
        onOk={() => delegateForm.submit()}
        okText="发起加签"
        width={600}
        destroyOnClose
      >
        {delegateModal.record && (
          <>
            {renderBaseDescriptions(delegateModal.record)}
            {renderAuditLogs(delegateModal.logs)}
            <Form form={delegateForm} layout="vertical" onFinish={handleDelegate}>
              <Form.Item
                label="加签审批人（协助核账的经理姓名）"
                name="delegatedAuditor"
                rules={[{ required: true, message: '请输入加签审批人姓名' }]}
              >
                <Input placeholder="如：李经理" />
              </Form.Item>
              <Form.Item label="加签原因" name="comment">
                <Input.TextArea
                  rows={3}
                  placeholder="请说明加签原因（选填）"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* 加签确认弹窗 */}
      <Modal
        title="确认加签核账 - 完成后退回原审批人"
        open={confirmModal.open}
        onCancel={() => setConfirmModal({ open: false, record: null, logs: [] })}
        onOk={() => confirmForm.submit()}
        okText="确认核账并退回"
        width={600}
        destroyOnClose
      >
        {confirmModal.record && (
          <>
            {renderBaseDescriptions(confirmModal.record)}
            {renderAuditLogs(confirmModal.logs)}
            <Form form={confirmForm} layout="vertical" onFinish={handleConfirm}>
              <Form.Item label="核账意见" name="comment">
                <Input.TextArea
                  rows={3}
                  placeholder="请输入您的核账意见（选填），确认后将退回原审批人继续审批"
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
