import api from './api'

export interface SalaryRecord {
  id: string
  yearMonth: string
  baseSalary: number
  bonus: number
  deduction: number
  netSalary: number
  status: string
  employee: { name: string; employeeNo: string }
}

export const salaryService = {
  getAll: () => api.get<SalaryRecord[]>('/hr/salary'),
  create: (data: { employeeId: string; yearMonth: string; baseSalary: number; bonus?: number; deduction?: number }) =>
    api.post('/hr/salary', data),
  pay: (id: string) => api.post(`/hr/salary/${id}/pay`),
  delete: (id: string) => api.delete(`/hr/salary/${id}`),
}
