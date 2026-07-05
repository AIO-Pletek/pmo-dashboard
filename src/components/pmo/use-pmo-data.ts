'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  Customer,
  Project,
  Timeline,
  Report,
  ExcelFile,
  DashboardData,
  Division,
  DivisionOverview,
  ProjectFilters,
  ReportFilters,
  ApiResponse,
  PaginatedResponse,
  DeleteResponse,
  TimelineDocument,
} from './types';

// ==========================================
// Generic fetch helper
// ==========================================

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed', message: 'Request failed' }));
    throw new Error(err.message || err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ==========================================
// Query Keys
// ==========================================

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  customers: (search?: string) => ['customers', search] as const,
  customer: (id: string) => ['customer', id] as const,
  projects: (filters?: ProjectFilters) => ['projects', filters] as const,
  project: (id: string) => ['project', id] as const,
  timelines: (projectId: string) => ['timelines', projectId] as const,
  timeline: (id: string) => ['timeline', id] as const,
  reports: (filters?: ReportFilters) => ['reports', filters] as const,
  report: (id: string) => ['report', id] as const,
  excelFiles: (projectId?: string) => ['excelFiles', projectId] as const,
  divisions: ['divisions'] as const,
  division: (id: string) => ['division', id] as const,
  divisionOverview: ['divisionOverview'] as const,
  timelineDocs: ['timelineDocs'] as const,
  timelineDoc: (id: string) => ['timelineDoc', id] as const,
};

// ==========================================
// Dashboard
// ==========================================

export function useDashboard(options?: Partial<UseQueryOptions<DashboardData>>) {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiFetch<DashboardData>('/api/dashboard'),
    ...options,
  });
}

// ==========================================
// Customers
// ==========================================

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: queryKeys.customers(search),
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      return apiFetch<PaginatedResponse<Customer>>(
        `/api/customers?${params.toString()}`
      );
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () =>
      apiFetch<ApiResponse<Customer & { projects: Project[] }>>(`/api/customers/${id}`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<ApiResponse<Customer>>('/api/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Customer> & { id: string }) =>
      apiFetch<ApiResponse<Customer>>(`/api/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update customer');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<DeleteResponse>(`/api/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete customer');
    },
  });
}

// ==========================================
// Projects
// ==========================================

export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: queryKeys.projects(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.customerId) params.set('customerId', filters.customerId);
      if (filters?.category) params.set('category', filters.category);
      if (filters?.status) params.set('status', filters.status);
      return apiFetch<PaginatedResponse<Project & { customer: Customer }>>(
        `/api/projects?${params.toString()}`
      );
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () =>
      apiFetch<ApiResponse<Project & { customer: Customer; timelines: Timeline[]; reports: Report[]; excelFiles: ExcelFile[] }>>(
        `/api/projects/${id}`
      ),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'customer'>) =>
      apiFetch<ApiResponse<Project>>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Project created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create project');
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Project> & { id: string }) =>
      apiFetch<ApiResponse<Project>>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Project updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update project');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<DeleteResponse>(`/api/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Project deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete project');
    },
  });
}

// ==========================================
// Timelines
// ==========================================

export function useTimelines(projectId: string) {
  return useQuery({
    queryKey: queryKeys.timelines(projectId),
    queryFn: () =>
      apiFetch<PaginatedResponse<Timeline>>(
        `/api/timelines?projectId=${projectId}`
      ),
    enabled: !!projectId,
  });
}

export function useCreateTimeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Timeline, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<ApiResponse<Timeline>>('/api/timelines', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timelines', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      toast.success('Timeline entry created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create timeline entry');
    },
  });
}

export function useUpdateTimeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Timeline> & { id: string }) =>
      apiFetch<ApiResponse<Timeline>>(`/api/timelines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timelines'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      toast.success('Timeline entry updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update timeline entry');
    },
  });
}

export function useDeleteTimeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      apiFetch<DeleteResponse>(`/api/timelines/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timelines', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      toast.success('Timeline entry deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete timeline entry');
    },
  });
}

// ==========================================
// Reports
// ==========================================

export function useReports(filters?: ReportFilters) {
  return useQuery({
    queryKey: queryKeys.reports(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.projectId) params.set('projectId', filters.projectId);
      if (filters?.type) params.set('type', filters.type);
      if (filters?.status) params.set('status', filters.status);
      return apiFetch<PaginatedResponse<Report & { project?: Project }>>(
        `/api/reports?${params.toString()}`
      );
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<ApiResponse<Report>>('/api/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      toast.success('Report created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create report');
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Report> & { id: string }) =>
      apiFetch<ApiResponse<Report>>(`/api/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      toast.success('Report updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update report');
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      apiFetch<DeleteResponse>(`/api/reports/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      toast.success('Report deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete report');
    },
  });
}

// ==========================================
// Excel Files
// ==========================================

export function useExcelFiles(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.excelFiles(projectId),
    queryFn: () => {
      const params = new URLSearchParams();
      if (projectId) params.set('projectId', projectId);
      return apiFetch<PaginatedResponse<ExcelFile>>(
        `/api/upload?${params.toString()}`
      );
    },
  });
}

export function useUploadExcel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, projectId }: { file: File; projectId: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      return fetch('/api/upload', {
        method: 'POST',
        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(error.message || `HTTP ${res.status}`);
        }
        return res.json() as Promise<ApiResponse<ExcelFile>>;
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['excelFiles'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      toast.success('Excel file uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload Excel file');
    },
  });
}

export function useDeleteExcelFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      apiFetch<DeleteResponse>(`/api/upload/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['excelFiles'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      toast.success('File deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete file');
    },
  });
}

// ==========================================
// Divisions
// ==========================================

export function useDivisions() {
  return useQuery({
    queryKey: queryKeys.divisions,
    queryFn: () =>
      apiFetch<PaginatedResponse<Division>>('/api/divisions'),
  });
}

export function useDivision(id: string) {
  return useQuery({
    queryKey: queryKeys.division(id),
    queryFn: () =>
      apiFetch<ApiResponse<Division>>(`/api/divisions/${id}`),
    enabled: !!id,
  });
}

export function useCreateDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Division, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<ApiResponse<Division>>('/api/divisions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      queryClient.invalidateQueries({ queryKey: ['divisionOverview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Division created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create division');
    },
  });
}

export function useUpdateDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Division> & { id: string }) =>
      apiFetch<ApiResponse<Division>>(`/api/divisions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      queryClient.invalidateQueries({ queryKey: ['divisionOverview'] });
      toast.success('Division updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update division');
    },
  });
}

export function useDeleteDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<DeleteResponse>(`/api/divisions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      queryClient.invalidateQueries({ queryKey: ['divisionOverview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Division deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete division');
    },
  });
}

export function useDivisionOverview() {
  return useQuery({
    queryKey: queryKeys.divisionOverview,
    queryFn: () =>
      apiFetch<ApiResponse<DivisionOverview>>('/api/divisions/overview'),
  });
}

// Users list (for PIC dropdown — accessible by any authenticated user)
export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: string;
  divisionId: string | null;
  division: { id: string; name: string } | null;
  isActive: boolean;
}

export function useUsers(opts?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: ['users', opts],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (opts?.activeOnly) params.set('activeOnly', 'true');
      const qs = params.toString();
      return apiFetch<PaginatedResponse<UserListItem>>(
        `/api/users${qs ? `?${qs}` : ''}`
      );
    },
  });
}

// Activity Log
export function useActivityLog(projectId: string) {
  return useQuery({
    queryKey: ['activityLog', projectId],
    queryFn: () =>
      apiFetch<PaginatedResponse<import('./types').ActivityLogEntry>>(
        `/api/projects/${projectId}/activity`
      ),
    enabled: !!projectId,
  });
}

// ==========================================
// Timeline Documents (Builder)
// ==========================================

export function useTimelineDocs() {
  return useQuery({
    queryKey: queryKeys.timelineDocs,
    queryFn: () =>
      apiFetch<PaginatedResponse<TimelineDocument>>('/api/timeline-docs'),
  });
}

export function useTimelineDoc(id: string) {
  return useQuery({
    queryKey: queryKeys.timelineDoc(id),
    queryFn: () =>
      apiFetch<ApiResponse<TimelineDocument>>(`/api/timeline-docs/${id}`),
    enabled: !!id,
  });
}

export function useCreateTimelineDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      projectLead: string;
      startDate: string;
      totalWeeks: number;
      phases: TimelineDocument['phases'];
      notes: string;
    }) =>
      apiFetch<ApiResponse<TimelineDocument>>('/api/timeline-docs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelineDocs'] });
      toast.success('Timeline berhasil dibuat');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat timeline');
    },
  });
}

export function useUpdateTimelineDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<TimelineDocument> & { id: string }) =>
      apiFetch<ApiResponse<TimelineDocument>>(`/api/timeline-docs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timelineDocs'] });
      queryClient.invalidateQueries({ queryKey: ['timelineDoc', variables.id] });
      toast.success('Timeline berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memperbarui timeline');
    },
  });
}

export function useDeleteTimelineDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<DeleteResponse>(`/api/timeline-docs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelineDocs'] });
      toast.success('Timeline berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus timeline');
    },
  });
}