// ==========================================
// PMO Dashboard - TypeScript Interfaces
// ==========================================

// Enums as const objects for type safety
export const PROJECT_CATEGORIES = {
  ONGOING_CUSTOMER: 'ONGOING_CUSTOMER',
  POC_CUSTOMER: 'POC_CUSTOMER',
} as const;

export const PROJECT_STATUSES = {
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const TIMELINE_STATUSES = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DELAYED: 'DELAYED',
} as const;

export const REPORT_TYPES = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  MILESTONE: 'MILESTONE',
  FINAL: 'FINAL',
} as const;

export const REPORT_STATUSES = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
} as const;

export const PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const PENDING_TYPES = {
  NONE: 'NONE',
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL',
} as const;

// Union types
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[keyof typeof PROJECT_CATEGORIES];
export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];
export type TimelineStatus = (typeof TIMELINE_STATUSES)[keyof typeof TIMELINE_STATUSES];
export type ReportType = (typeof REPORT_TYPES)[keyof typeof REPORT_TYPES];
export type ReportStatus = (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES];
export type Priority = (typeof PRIORITIES)[keyof typeof PRIORITIES];
export type PendingType = (typeof PENDING_TYPES)[keyof typeof PENDING_TYPES];

// Data Models
export interface Customer {
  id: string;
  name: string;
  company: string;
  industry: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  customerId: string;
  category: ProjectCategory;
  status: ProjectStatus;
  description: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  budget: number;
  priority: Priority;
  notes: string;
  picInternalName: string;
  picInternalDivisionId: string | null;
  picExternalName: string;
  pendingType: PendingType;
  pendingNote: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  picInternalDivision?: Division | null;
}

export interface Timeline {
  id: string;
  projectId: string;
  taskName: string;
  startDate: string | null;
  endDate: string | null;
  status: TimelineStatus;
  progress: number;
  assignee: string;
  notes: string;
  taskOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  projectId: string;
  title: string;
  type: ReportType;
  content: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  project?: Project;
}

export interface ExcelFile {
  id: string;
  projectId: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
  data?: Record<string, unknown>[];
}

// Division types
export interface Division {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface DivisionWithCounts extends Division {
  totalProjects: number;
  projectsByStatus: Record<string, number>;
  projectsByCategory: Record<string, number>;
  projectsByPendingType: Record<string, number>;
  pendingProjects: (Project & { customer: Customer })[];
}

export interface DivisionOverview {
  divisions: DivisionWithCounts[];
  summary: {
    totalDivisions: number;
    totalPendingInternal: number;
    totalPendingExternal: number;
    totalPendingNone: number;
    projectsWithoutDivision: number;
  };
}

// Dashboard types
export interface DashboardData {
  totalCustomers: number;
  totalProjects: number;
  projectsByCategory: Record<string, number>;
  projectsByStatus: Record<string, number>;
  recentProjects: (Project & { customer: Customer })[];
  upcomingDeadlines: (Project & { customer: Customer })[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface DeleteResponse {
  success: boolean;
}

// Filter types
export interface ProjectFilters {
  customerId?: string;
  category?: ProjectCategory | '';
  status?: ProjectStatus | '';
  search?: string;
}

export interface ReportFilters {
  projectId?: string;
  type?: ReportType | '';
  status?: ReportStatus | '';
}

// View type for SPA navigation
export type ViewType = 'dashboard' | 'customers' | 'projects' | 'project-detail' | 'reports' | 'upload' | 'divisions' | 'users' | 'profile';

// Label maps for display
export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  ONGOING_CUSTOMER: 'On-going Customer',
  POC_CUSTOMER: 'POC Customer',
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const TIMELINE_STATUS_LABELS: Record<TimelineStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DELAYED: 'Delayed',
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  MILESTONE: 'Milestone',
  FINAL: 'Final',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const PENDING_TYPE_LABELS: Record<PendingType, string> = {
  NONE: 'No Pending',
  INTERNAL: 'Pending Internal',
  EXTERNAL: 'Pending External',
};

// ==========================================
// Auth types
// ==========================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  divisionId: string | null;
  twoFactorEnabled: boolean;
  division?: { id: string; name: string } | null;
}

export interface LoginResponse {
  requires2FA: boolean;
  tempToken?: string;
  user?: AuthUser;
  token?: string;
}

export type AuthView = 'login' | 'forgot-password' | 'reset-password' | '2fa';

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  USER: 'User',
};