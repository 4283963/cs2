import React, { useState, useEffect } from 'react'
import { Table, Tag, Select, Card, Button, Modal, List, Descriptions, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { expenseApi } from '../api/request.js'
import dayjs from 'dayjs'

const statusMap = {
  PENDING: { color: 'orange', text: '待审批' },
  APPROVED: { color: 'green', text: '已同意' },
  REJECTED: { color: 'red', text: '已拒绝' },
  SIGNED_ADDING: { color: 'purple', text: '加签中' }
}

function ExpenseList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState()
  const [detailModal, setDetailModal] = useState({ open: false, record: null, logs: [] })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await expenseApi.list(statusFilter)
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const showDetail = async (record) => {
    const logs = await expenseApi.auditLogs(record.id)
    setDetailModal({ open: true, record, logs })
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
        <Button type="link" onClick={() => showDetail(record)}>查看详情</Button>
      )
    }
  ]

  return (
    <div>
      <Card
        title="报销列表"
        extra={
          <Space>
            <Select
              placeholder="按状态筛选"
              allowClear
              style={{ width: 160 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'PENDING', label: '待审批' },
                { value: 'APPROVED', label: '已同意' },
                { value: 'REJECTED', label: '已拒绝' },
                { value: 'SIGNED_ADDING', label: '加签中' }
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
        />
      </Card>

      <Modal
        title="报销单详情"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, record: null, logs: [] })}
        footer={null}
        width={600}
      >
        {detailModal.record && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="ID">{detailModal.record.id}</Descriptions.Item>
              <Descriptions.Item label="申请人">{detailModal.record.applicant}</Descriptions.Item>
              <Descriptions.Item label="报销项目" span={2}>{detailModal.record.title}</Descriptions.Item>
              <Descriptions.Item label="金额">¥{Number(detailModal.record.amount).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[detailModal.record.status].color}>
                  {statusMap[detailModal.record.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="说明" span={2}>
                {detailModal.record.description || '-'}
              </Descriptions.Item>
              {detailModal.record.originalAuditor && (
                <Descriptions.Item label="原审批人">{detailModal.record.originalAuditor}</Descriptions.Item>
              )}
              {detailModal.record.delegatedAuditor && (
                <Descriptions.Item label="加签核账人">{detailModal.record.delegatedAuditor}</Descriptions.Item>
              )}
              <Descriptions.Item label="提交时间" span={2}>
                {dayjs(detailModal.record.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>审批日志</div>
            {detailModal.logs.length > 0 ? (
              <List
                size="small"
                bordered
                dataSource={detailModal.logs}
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
            ) : (
              <div style={{ color: '#999' }}>暂无审批日志</div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

export default ExpenseList
