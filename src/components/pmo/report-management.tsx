'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, FileBarChart, Pencil, Trash2, Eye, FileText, Loader2, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  useReports,
  useProjects,
  useCreateReport,
  useUpdateReport,
  useDeleteReport,
} from './use-pmo-data';
import {
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_TYPES,
  REPORT_STATUSES,
  CATEGORY_LABELS,
  type ReportType,
  type ReportStatus,
  type Report,
} from './types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function getReportStatusClass(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
    case 'SUBMITTED':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

export function ReportManagement() {
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [form, setForm] = useState({
    title: '',
    projectId: '',
    type: 'WEEKLY' as ReportType,
    content: '',
    status: 'DRAFT' as ReportStatus,
  });

  const { data, isLoading } = useReports({
    projectId: projectFilter !== 'all' ? projectFilter : undefined,
    type: typeFilter !== 'all' ? (typeFilter as ReportType) : undefined,
    status: statusFilter !== 'all' ? (statusFilter as ReportStatus) : undefined,
  });
  const { data: projectsData } = useProjects();
  const createReport = useCreateReport();
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();
  const queryClient = useQueryClient();

  const reports = data?.data || [];
  const projects = projectsData?.data || [];

  // Compiled report state
  const [isCompileOpen, setIsCompileOpen] = useState(false);
  const [compileTitle, setCompileTitle] = useState('');
  const [compileType, setCompileType] = useState<ReportType>('MILESTONE');
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [compiling, setCompiling] = useState(false);

  const openCreate = () => {
    setEditingReport(null);
    setForm({
      title: '',
      projectId: projectFilter !== 'all' ? projectFilter : '',
      type: 'WEEKLY',
      content: '',
      status: 'DRAFT',
    });
    setIsFormOpen(true);
  };

  const openEdit = (report: Report) => {
    setEditingReport(report);
    setForm({
      title: report.title,
      projectId: report.projectId,
      type: report.type,
      content: report.content,
      status: report.status,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.projectId) return;
    if (editingReport) {
      updateReport.mutate({ id: editingReport.id, ...form });
    } else {
      createReport.mutate(form);
    }
    setIsFormOpen(false);
  };

  const toggleProjectSelect = (id: string) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProjectIds.size === projects.length) {
      setSelectedProjectIds(new Set());
    } else {
      setSelectedProjectIds(new Set(projects.map((p) => p.id)));
    }
  };

  const openCompile = () => {
    setCompileTitle('');
    setCompileType('MILESTONE');
    setSelectedProjectIds(new Set());
    setIsCompileOpen(true);
  };

  const handleCompile = async () => {
    if (!compileTitle.trim() || selectedProjectIds.size === 0) return;
    setCompiling(true);
    try {
      const res = await fetch('/api/reports/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: compileTitle.trim(),
          projectIds: Array.from(selectedProjectIds),
          type: compileType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to compile report');
        return;
      }
      toast.success(`Compiled report created for ${data.data.compiledCount} projects`);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setIsCompileOpen(false);
    } catch {
      toast.error('Connection error');
    } finally {
      setCompiling(false);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (projectFilter !== 'all') params.set('projectId', projectFilter);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const qs = params.toString();
    window.open(`/api/reports/export${qs ? `?${qs}` : ''}`, '_blank');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">View and manage all project reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={openCompile} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <FileText className="mr-2 h-4 w-4" />
            Generate Compiled Report
          </Button>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Report
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-wrap items-center gap-2">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(REPORT_TYPES).map(([key, val]) => (
              <SelectItem key={key} value={val}>
                {REPORT_TYPE_LABELS[val]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(REPORT_STATUSES).map(([key, val]) => (
              <SelectItem key={key} value={val}>
                {REPORT_STATUS_LABELS[val]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div variants={item}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileBarChart className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">No reports found</p>
                  <p className="text-xs text-muted-foreground">
                    {typeFilter !== 'all' || statusFilter !== 'all' || projectFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Click "Add Report" to get started'}
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {report.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[150px] truncate">
                        {report.project?.name || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {REPORT_TYPE_LABELS[report.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px]', getReportStatusClass(report.status))}
                        >
                          {REPORT_STATUS_LABELS[report.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {report.createdAt ? format(new Date(report.createdAt), 'MMM dd, yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewReport(report)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(report)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(report)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </motion.div>

      {/* View Report Dialog */}
      <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewReport?.title}</DialogTitle>
          </DialogHeader>
          {viewReport && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{REPORT_TYPE_LABELS[viewReport.type]}</Badge>
                <Badge
                  variant="secondary"
                  className={getReportStatusClass(viewReport.status)}
                >
                  {REPORT_STATUS_LABELS[viewReport.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {viewReport.createdAt ? format(new Date(viewReport.createdAt), 'MMM dd, yyyy') : '—'}
                </span>
              </div>
              {viewReport.project && (
                <p className="text-sm text-muted-foreground">
                  Project: <span className="font-medium text-foreground">{viewReport.project.name}</span>
                </p>
              )}
              {viewReport.content ? (
                <div className="rounded-lg border p-4">
                  <p className="text-sm whitespace-pre-wrap">{viewReport.content}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No content</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReport ? 'Edit Report' : 'Add Report'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rpt-title">Title *</Label>
              <Input
                id="rpt-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Weekly Status Report"
              />
            </div>
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                value={form.projectId}
                onValueChange={(val) => setForm({ ...form, projectId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) =>
                    setForm({ ...form, type: val as ReportType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REPORT_TYPES).map(([key, val]) => (
                      <SelectItem key={key} value={val}>
                        {REPORT_TYPE_LABELS[val]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) =>
                    setForm({ ...form, status: val as ReportStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REPORT_STATUSES).map(([key, val]) => (
                      <SelectItem key={key} value={val}>
                        {REPORT_STATUS_LABELS[val]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpt-content">Content</Label>
              <Textarea
                id="rpt-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Report content..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title.trim() || !form.projectId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingReport ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteTarget) {
                  deleteReport.mutate({ id: deleteTarget.id, projectId: deleteTarget.projectId });
                  setDeleteTarget(null);
                }
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compile Report Dialog */}
      <Dialog open={isCompileOpen} onOpenChange={setIsCompileOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Generate Compiled Report
            </DialogTitle>
            <DialogDescription>
              Compile data from multiple projects into one comprehensive report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="compile-title">Report Title *</Label>
              <Input
                id="compile-title"
                value={compileTitle}
                onChange={(e) => setCompileTitle(e.target.value)}
                placeholder="e.g. Monthly All Projects Report"
              />
            </div>
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={compileType} onValueChange={(val) => setCompileType(val as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_TYPES).map(([key, val]) => (
                    <SelectItem key={key} value={val}>
                      {REPORT_TYPE_LABELS[val]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Projects *</Label>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  {selectedProjectIds.size === projects.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <Card className="border">
                <ScrollArea className="h-48">
                  <div className="p-3 space-y-1">
                    {projects.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No projects available
                      </p>
                    ) : (
                      projects.map((p) => (
                        <label
                          key={p.id}
                          className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors',
                            selectedProjectIds.has(p.id)
                              ? 'bg-emerald-50 dark:bg-emerald-950/30'
                              : 'hover:bg-muted'
                          )}
                        >
                          <Checkbox
                            checked={selectedProjectIds.has(p.id)}
                            onCheckedChange={() => toggleProjectSelect(p.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.customer?.name || 'No customer'} • {p.status}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Card>
              <p className="text-xs text-muted-foreground">
                {selectedProjectIds.size} project{selectedProjectIds.size !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" onClick={() => setIsCompileOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompile}
              disabled={!compileTitle.trim() || selectedProjectIds.size === 0 || compiling}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {compiling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Compiling...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}