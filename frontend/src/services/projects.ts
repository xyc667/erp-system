import api from './api'

export interface ProjectTask {
  id: string
  name: string
  status: string
  progress: number
  assignee: { name: string } | null
}

export interface Project {
  id: string
  code: string
  name: string
  description: string | null
  status: string
  progress: number
  budget: number | null
  manager: { name: string } | null
  tasks: ProjectTask[]
}

export const projectsService = {
  getAll: () => api.get<Project[]>('/projects'),
  create: (data: {
    code: string
    name: string
    description?: string
    managerId?: string
    budget?: number
    tasks?: { name: string; assigneeId?: string }[]
  }) => api.post<Project>('/projects', data),
  activate: (id: string) => api.post(`/projects/${id}/activate`),
  complete: (id: string) => api.post(`/projects/${id}/complete`),
  delete: (id: string) => api.delete(`/projects/${id}`),
}
