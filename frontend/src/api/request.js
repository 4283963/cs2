import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 200) {
      return res.data
    }
    message.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    message.error(error.response?.data?.message || error.message || '网络错误')
    return Promise.reject(error)
  }
)

export const expenseApi = {
  list: (status) => request.get('/expense', { params: { status } }),
  get: (id) => request.get(`/expense/${id}`),
  create: (data) => request.post('/expense', data),
  audit: (data) => request.post('/expense/audit', data),
  auditLogs: (id) => request.get(`/expense/${id}/audit-logs`)
}

export default request
