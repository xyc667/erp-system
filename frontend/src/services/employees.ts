import api from './api'

export interface Employee {
  id: string
  employeeNo: string
  name: string
  departmentId: string | null
  positionId: string | null
  email: string | null
  phone: string | null
  status: string
  hireDate: string | null
  department: { name: string } | null
  position: { name: string } | null
}

export const employeesService = {
  getAll: () => api.get<Employee[]>('/hr/employees'),
  create: (data: Partial<Employee> & { employeeNo: string; name: string }) =>
    api.post<Employee>('/hr/employees', data),
  update: (id: string, data: Partial<Employee>) => api.patch<Employee>(`/hr/employees/${id}`, data),
  delete: (id: string) => api.delete(`/hr/employees/${id}`),
}
