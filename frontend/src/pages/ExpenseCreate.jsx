import React from 'react'
import { Form, Input, InputNumber, Button, Card, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { expenseApi } from '../api/request.js'

function ExpenseCreate() {
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    try {
      await expenseApi.create(values)
      message.success('报销单提交成功，等待审批')
      navigate('/')
    } catch (e) {
    }
  }

  return (
    <Card title="提交报销单" style={{ maxWidth: 600 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ applicant: '张三' }}
      >
        <Form.Item
          label="报销项目"
          name="title"
          rules={[{ required: true, message: '请输入报销项目' }]}
        >
          <Input placeholder="如：出差交通费、办公用品等" maxLength={200} />
        </Form.Item>

        <Form.Item
          label="报销金额（元）"
          name="amount"
          rules={[
            { required: true, message: '请输入报销金额' },
            { type: 'number', min: 0.01, message: '金额必须大于0' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            step={0.01}
            precision={2}
            placeholder="请输入金额"
          />
        </Form.Item>

        <Form.Item
          label="报销说明"
          name="description"
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入详细说明（选填）"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="申请人"
          name="applicant"
          rules={[{ required: true, message: '请输入申请人姓名' }]}
        >
          <Input placeholder="请输入您的姓名" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
            提交审批
          </Button>
          <Button onClick={() => navigate('/')}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default ExpenseCreate
