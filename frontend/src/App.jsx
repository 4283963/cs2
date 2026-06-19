import React from 'react'
import { Layout, Menu } from 'antd'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  FormOutlined,
  UnorderedListOutlined,
  AuditOutlined
} from '@ant-design/icons'
import ExpenseList from './pages/ExpenseList.jsx'
import ExpenseCreate from './pages/ExpenseCreate.jsx'
import ExpenseAudit from './pages/ExpenseAudit.jsx'

const { Header, Content, Sider } = Layout

function App() {
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <UnorderedListOutlined />,
      label: <Link to="/">报销列表</Link>
    },
    {
      key: '/create',
      icon: <FormOutlined />,
      label: <Link to="/create">提交报销</Link>
    },
    {
      key: '/audit',
      icon: <AuditOutlined />,
      label: <Link to="/audit">主管审批</Link>
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: '#001529',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
          报销审批系统
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '16px' }}>
          <Content style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: '#fff',
            borderRadius: 8
          }}>
            <Routes>
              <Route path="/" element={<ExpenseList />} />
              <Route path="/create" element={<ExpenseCreate />} />
              <Route path="/audit" element={<ExpenseAudit />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default App
