'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  FolderKanban,
  Calendar,
  DollarSign,
  ChevronDown,
  ArrowRight,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  useProjects,
  useCustomers,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useDivisions,
} from './use-pmo-data';
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PENDING_TYPE_LABELS,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  PRIORITIES,
  PENDING_TYPES,
  type Project,
  type ProjectCategory,
  type ProjectStatus,
  type Priority,
  type PendingType,
  type Customer,
} from './types';

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

function formatRupiah(budget: number): string {
  return rupiahFormatter.format(budget);
}

function formatDateRange(startDate: string | null, endDate: string | null): string | null {
  if (!startDate && !endDate) return null;
  const start = startDate ? format(new Date(startDate), 'MMM d') : '—';
  const end = endDate ? format(new Date(endDate), 'MMM d, yyyy') : '—';
  return `${start} - ${end}`;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Badge helpers
function getStatusClass(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
    case 'ON_HOLD':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

function getCategoryClass(category: string) {
  switch (category) {
    case 'ONGOING_CUSTOMER':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    case 'POC_CUSTOMER':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300';
    case 'INTERNAL':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
    default:
      return '';
  }
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case 'LOW':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    case 'MEDIUM':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300';
    case 'HIGH':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
    case 'CRITICAL':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
    default:
      return '';
  }
}

function getPriorityBorderColor(priority: string) {
  switch (priority) {
    case 'LOW':
      return 'border-l-gray-300 dark:border-l-gray-600';
    case 'MEDIUM':
      return 'border-l-teal-400 dark:border-l-teal-600';
    case 'HIGH':
      return 'border-l-orange-400 dark:border-l-orange-600';
    case 'CRITICAL':
      return 'border-l-red-500 dark:border-l-red-600';
    default:
      return 'border-l-gray-300 dark:border-l-gray-600';
  }
}

function getPendingTypeClass(pendingType: string) {
  switch (pendingType) {
    case 'INTERNAL':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
    case 'EXTERNAL':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

function getProgressColor(progress: number) {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-emerald-500';
  if (progress >= 25) return 'bg-amber-500';
  return 'bg-gray-400';
}

// Form initial state
const emptyForm = {
  name: '',
  customerId: '',
  category: 'ONGOING_CUSTOMER' as ProjectCategory,
  status: 'PLANNING' as ProjectStatus,
  description: '',
  startDate: '',
  endDate: '',
  progress: 0,
  budget: 0,
  priority: 'MEDIUM' as Priority,
  notes: '',
  picInternalName: '',
  picInternalDivisionId: '' as string,
  picExternalName: '',
  pendingType: 'NONE' as PendingType,
  pendingNote: '',
};

interface ProjectManagementProps {
  onProjectClick: (projectId: string) => void;
}

export function ProjectManagement({ onProjectClick }: ProjectManagementProps) {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [statusPopoverId, setStatusPopoverId] = useState<string | null>(null);

  const { data, isLoading } = useProjects({
    category: categoryFilter !== 'all' ? (categoryFilter as ProjectCategory) : undefined,
    status: statusFilter !== 'all' ? (statusFilter as ProjectStatus) : undefined,
  });
  const { data: customersData } = useCustomers();
  const { data: divisionsData } = useDivisions();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const projects = data?.data || [];
  const customers = customersData?.data || [];
  const divisions = divisionsData?.data || [];

  const openCreate = () => {
    setEditingProject(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      customerId: project.customerId,
      category: project.category,
      status: project.status,
      description: project.description,
      startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
      endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
      progress: project.progress,
      budget: project.budget,
      priority: project.priority,
      notes: project.notes,
      picInternalName: project.picInternalName || '',
      picInternalDivisionId: project.picInternalDivisionId || '',
      picExternalName: project.picExternalName || '',
      pendingType: project.pendingType || 'NONE',
      pendingNote: project.pendingNote || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.customerId) return;

    const payload = {
      ...form,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      picInternalDivisionId: form.picInternalDivisionId || null,
    };

    if (editingProject) {
      updateProject.mutate({ id: editingProject.id, ...payload });
    } else {
      createProject.mutate(payload);
    }
    setIsFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteProject.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleQuickStatusChange = (projectId: string, newStatus: ProjectStatus) => {
    updateProject.mutate({ id: projectId, status: newStatus });
    setStatusPopoverId(null);
  };

  // Quick Status Change Popover
  function StatusChangePopover({
    project,
  }: {
    project: Project & { customer?: Customer };
  }) {
    const isOpen = statusPopoverId === project.id;
    return (
      <Popover open={isOpen} onOpenChange={(open) => setStatusPopoverId(open ? project.id : null)}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronDown className="h-3 w-3" />
            Status
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="end" onClick={(e) => e.stopPropagation()}>
          <Command>
            <CommandInput placeholder="Search status..." />
            <CommandList className="max-h-64">
              <CommandEmpty>No status found.</CommandEmpty>
              <CommandGroup>
                {Object.entries(PROJECT_STATUSES).map(([, val]) => (
                  <CommandItem
                    key={val}
                    value={val}
                    onSelect={() => handleQuickStatusChange(project.id, val as ProjectStatus)}
                    className={cn(
                      'gap-2',
                      project.status === val && 'bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        val === 'PLANNING' && 'bg-gray-400',
                        val === 'IN_PROGRESS' && 'bg-emerald-500',
                        val === 'ON_HOLD' && 'bg-amber-500',
                        val === 'COMPLETED' && 'bg-green-500',
                        val === 'CANCELLED' && 'bg-red-500'
                      )}
                    />
                    {STATUS_LABELS[val]}
                    {project.status === val && (
                      <span className="ml-auto text-xs text-muted-foreground">Current</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Project Card
  function ProjectCard({ project }: { project: Project & { customer?: Customer } }) {
    const dateRange = formatDateRange(project.startDate, project.endDate);

    return (
      <motion.div
        variants={item}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={cn(
            'cursor-pointer transition-shadow hover:shadow-md border-l-4',
            getPriorityBorderColor(project.priority)
          )}
          onClick={() => onProjectClick(project.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm font-semibold leading-tight truncate">
                  {project.name}
                </CardTitle>
                <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-400 truncate">
                  {project.customer?.company || 'Unknown Customer'}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Badge
                  variant="secondary"
                  className={cn('text-[10px] font-medium', getCategoryClass(project.category))}
                >
                  {CATEGORY_LABELS[project.category]}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className={cn('text-[10px] font-medium', getStatusClass(project.status))}
              >
                {STATUS_LABELS[project.status]}
              </Badge>
              <Badge
                variant="secondary"
                className={cn('text-[10px] font-medium', getPriorityClass(project.priority))}
              >
                {PRIORITY_LABELS[project.priority]}
              </Badge>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-all', getProgressColor(project.progress))}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Budget */}
            {project.budget > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                <span>{formatRupiah(project.budget)}</span>
              </div>
            )}

            {/* Date Range */}
            {dateRange && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{dateRange}</span>
              </div>
            )}

            {/* PIC Info */}
            {project.picInternalName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>
                  PIC: {project.picInternalName}
                  {project.picInternalDivision?.name && (
                    <span className="text-emerald-600 dark:text-emerald-400"> ({project.picInternalDivision.name})</span>
                  )}
                </span>
              </div>
            )}

            {/* Pending Badge */}
            {project.pendingType && project.pendingType !== 'NONE' && (
              <Badge
                variant="secondary"
                className={cn('text-[10px] font-medium', getPendingTypeClass(project.pendingType))}
              >
                {PENDING_TYPE_LABELS[project.pendingType]}
              </Badge>
            )}

            {/* Actions */}
            <div
              className="flex items-center gap-1 pt-1 border-t"
              onClick={(e) => e.stopPropagation()}
            >
              <StatusChangePopover project={project} />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => openEdit(project)}
              >
                <Pencil className="mr-1 h-3 w-3" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(project)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage and track all projects
          </p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Filter by customer..." className="pl-9" disabled />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            Use customer filter below
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[170px] h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(PROJECT_CATEGORIES).map(([key, val]) => (
                <SelectItem key={key} value={val}>
                  {CATEGORY_LABELS[val]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(PROJECT_STATUSES).map(([key, val]) => (
                <SelectItem key={key} value={val}>
                  {STATUS_LABELS[val]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-md border p-0.5">
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('table')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={item}>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
              <FolderKanban className="h-10 w-10 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold">No projects yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first project to get started
              </p>
            </div>
            <Button
              onClick={openCreate}
              variant="outline"
              className="mt-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first project
            </Button>
          </div>
        ) : viewMode === 'card' ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </motion.div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Priority</TableHead>
                    <TableHead className="hidden md:table-cell">Budget</TableHead>
                    <TableHead className="hidden lg:table-cell">Date Range</TableHead>
                    <TableHead className="hidden xl:table-cell">Progress</TableHead>
                    <TableHead className="hidden lg:table-cell">PIC</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onProjectClick(project.id)}
                    >
                      <TableCell className="font-medium max-w-[180px] truncate">
                        {project.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[140px] truncate">
                        {project.customer?.company || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px]', getCategoryClass(project.category))}
                        >
                          {CATEGORY_LABELS[project.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px]', getStatusClass(project.status))}
                        >
                          {STATUS_LABELS[project.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px]', getPriorityClass(project.priority))}
                        >
                          {PRIORITY_LABELS[project.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                        {project.budget > 0 ? formatRupiah(project.budget) : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm whitespace-nowrap">
                        {formatDateRange(project.startDate, project.endDate) || '—'}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                getProgressColor(project.progress)
                              )}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {project.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {project.picInternalName || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <StatusChangePopover project={project} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(project)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(project)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Edit Project' : 'Add Project'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="proj-name">Project Name *</Label>
                <Input
                  id="proj-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="New Website Redesign"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-customer">Customer *</Label>
                <Select
                  value={form.customerId}
                  onValueChange={(val) => setForm({ ...form, customerId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — {c.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) =>
                    setForm({ ...form, category: val as ProjectCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROJECT_CATEGORIES).map(([key, val]) => (
                      <SelectItem key={key} value={val}>
                        {CATEGORY_LABELS[val]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) =>
                    setForm({ ...form, status: val as ProjectStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROJECT_STATUSES).map(([key, val]) => (
                      <SelectItem key={key} value={val}>
                        {STATUS_LABELS[val]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(val) =>
                    setForm({ ...form, priority: val as Priority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITIES).map(([key, val]) => (
                      <SelectItem key={key} value={val}>
                        {PRIORITY_LABELS[val]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-start">Start Date</Label>
                <Input
                  id="proj-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-end">End Date</Label>
                <Input
                  id="proj-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-budget">Budget</Label>
                <Input
                  id="proj-budget"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.budget || ''}
                  onChange={(e) =>
                    setForm({ ...form, budget: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-progress">Progress (%)</Label>
                <Input
                  id="proj-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea
                id="proj-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Project description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-notes">Notes</Label>
              <Textarea
                id="proj-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            {/* PIC & Pending Section */}
            <div className="pt-2">
              <p className="text-sm font-semibold text-foreground mb-3">PIC & Pending</p>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proj-pic-internal">PIC Internal (Nama)</Label>
                  <Input
                    id="proj-pic-internal"
                    value={form.picInternalName}
                    onChange={(e) => setForm({ ...form, picInternalName: e.target.value })}
                    placeholder="Nama PIC internal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-division">Divisi Internal</Label>
                  <Select
                    value={form.picInternalDivisionId}
                    onValueChange={(val) => setForm({ ...form, picInternalDivisionId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih divisi..." />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-pic-external">PIC Eksternal / Customer</Label>
                  <Input
                    id="proj-pic-external"
                    value={form.picExternalName}
                    onChange={(e) => setForm({ ...form, picExternalName: e.target.value })}
                    placeholder="Nama PIC eksternal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-pending-type">Status Pending</Label>
                  <Select
                    value={form.pendingType}
                    onValueChange={(val) =>
                      setForm({ ...form, pendingType: val as PendingType, pendingNote: val === 'NONE' ? '' : form.pendingNote })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PENDING_TYPES).map(([key, val]) => (
                        <SelectItem key={key} value={val}>
                          {PENDING_TYPE_LABELS[val]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.pendingType !== 'NONE' && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="proj-pending-note">Catatan Pending</Label>
                  <Textarea
                    id="proj-pending-note"
                    value={form.pendingNote}
                    onChange={(e) => setForm({ ...form, pendingNote: e.target.value })}
                    placeholder="Jelaskan detail pending..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.customerId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingProject ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This
              action cannot be undone and will also delete all associated timelines,
              reports, and uploaded files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}