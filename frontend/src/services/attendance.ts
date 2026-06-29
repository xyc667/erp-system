import api from './api'

export interface Attendance {
  id: string
  date: string
  status: string
  checkIn: string | null
  checkOut: string | null
  remark: string | null
  employee: { name: string; employeeNo: string; department: { name: string } | null }
}

export const attendanceService = {
  getAll: () => api.get<Attendance[]>('/hr/attendance'),
  create: (data: { employeeId: string; date: string; status?: string; remark?: string }) =>
    api.post('/hr/attendance', data),
  checkOut: (id: string) => api.post(`/hr/attendance/${id}/checkout`),
  delete: (id: string) => api.delete(`/hr/attendance/${id}`),
}
