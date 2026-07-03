'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  FileText,
  Clock,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useProject,
  useTimelines,
  useCreateTimeline,
  useUpdateTimeline,
  useDeleteTimeline,
  useCreateReport,
  useDeleteReport,
  useReports,
} from './use-pmo-data';
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  TIMELINE_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_TYPES,
  REPORT_STATUSES,
  TIMELINE_STATUSES,
  type Timeline,
  type TimelineStatus,
  type ReportType,
  type ReportStatus,
} from './types';

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

function getTimelineStatusClass(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
    case 'DELAYED':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

function getProgressColor(progress: number) {
  if (progress >= 80) return '[&>div]:bg-green-500';
  if (progress >= 50) return '[&>div]:bg-emerald-500';
  if (progress >= 25) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-gray-400';
}

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Timeline state
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [editingTimeline, setEditingTimeline] = useState<Timeline | null>(null);
  const [deleteTimelineTarget, setDeleteTimelineTarget] = useState<Timeline | null>(null);
  const [timelineForm, setTimelineForm] = useState({
    taskName: '',
    startDate: '',
    endDate: '',
    status: 'NOT_STARTED' as TimelineStatus,
    progress: 0,
    assignee: '',
    notes: '',
    taskOrder: 0,
  });

  // Report state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: '',
    type: 'WEEKLY' as ReportType,
    content: '',
    status: 'DRAFT' as ReportStatus,
  });

  const { data: projectData, isLoading } = useProject(projectId);
  const { data: timelinesData } = useTimelines(projectId);
  const { data: reportsData } = useReports({ projectId });

  const createTimeline = useCreateTimeline();
  const updateTimeline = useUpdateTimeline();
  const deleteTimeline = useDeleteTimeline();
  const createReport = useCreateReport();
  const deleteReport = useDeleteReport();

  const project = projectData?.data;
  const timelines = timelinesData?.data || [];
  const reports = reportsData?.data || [];

  // Timeline handlers
  const openCreateTimeline = () => {
    setEditingTimeline(null);
    setTimelineForm({
      taskName: '',
      startDate: '',
      endDate: '',
      status: 'NOT_STARTED',
      progress: 0,
      assignee: '',
      notes: '',
      taskOrder: timelines.length,
    });
    setIsTimelineOpen(true);
  };

  const openEditTimeline = (tl: Timeline) => {
    setEditingTimeline(tl);
    setTimelineForm({
      taskName: tl.taskName,
      startDate: tl.startDate ? format(new Date(tl.startDate), 'yyyy-MM-dd') : '',
      endDate: tl.endDate ? format(new Date(tl.endDate), 'yyyy-MM-dd') : '',
      status: tl.status,
      progress: tl.progress,
      assignee: tl.assignee,
      notes: tl.notes,
      taskOrder: tl.taskOrder,
    });
    setIsTimelineOpen(true);
  };

  const handleTimelineSubmit = () => {
    if (!timelineForm.taskName.trim()) return;
    const payload = {
      ...timelineForm,
      projectId,
      startDate: timelineForm.startDate ? new Date(timelineForm.startDate).toISOString() : null,
      endDate: timelineForm.endDate ? new Date(timelineForm.endDate).toISOString() : null,
    };
    if (editingTimeline) {
      updateTimeline.mutate({ id: editingTimeline.id, ...payload });
    } else {
      createTimeline.mutate(payload);
    }
    setIsTimelineOpen(false);
  };

  // Report handlers
  const handleReportSubmit = () => {
    if (!reportForm.title.trim()) return;
    createReport.mutate({ ...reportForm, projectId });
    setIsReportOpen(false);
    setReportForm({ title: '', type: 'WEEKLY', content: '', status: 'DRAFT' });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const totalDays =
    project.startDate && project.endDate
      ? differenceInDays(new Date(project.endDate), new Date(project.startDate))
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Button>

      {/* Project Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 min-w-0">
              <h2 className="text-2xl font-bold tracking-tight truncate">{project.name}</h2>
              <p className="text-sm text-muted-foreground">
                {project.customer?.company} — {project.customer?.name}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn('font-medium', getCategoryClass(project.category))}
                >
                  {CATEGORY_LABELS[project.category]}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn('font-medium', getStatusClass(project.status))}
                >
                  {STATUS_LABELS[project.status]}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn('font-medium', getPriorityClass(project.priority))}
                >
                  {PRIORITY_LABELS[project.priority]}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground shrink-0">
              {project.budget > 0 && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium text-foreground">
                    {project.budget.toLocaleString()}
                  </span>
                </div>
              )}
              {totalDays !== null && totalDays > 0 && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{totalDays} days</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-semibold text-emerald-600">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className={cn('h-2.5', getProgressColor(project.progress))} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">
            Timeline
            {timelines.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px]">
                {timelines.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports">
            Reports
            {reports.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px]">
                {reports.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard
              icon={Calendar}
              label="Start Date"
              value={project.startDate ? format(new Date(project.startDate), 'MMM dd, yyyy') : 'Not set'}
            />
            <InfoCard
              icon={Calendar}
              label="End Date"
              value={project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : 'Not set'}
            />
            <InfoCard
              icon={User}
              label="Customer Contact"
              value={project.customer?.email || 'Not provided'}
            />
          </div>

          {project.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          )}

          {project.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Project Timeline</h3>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={openCreateTimeline}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>

          {timelines.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 rounded-lg border border-dashed">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No timeline entries yet. Add your first task.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {timelines
                .sort((a, b) => a.taskOrder - b.taskOrder)
                .map((tl) => {
                  const start = tl.startDate ? new Date(tl.startDate) : null;
                  const end = tl.endDate ? new Date(tl.endDate) : null;
                  const isComplete = tl.status === 'COMPLETED';

                  return (
                    <Card key={tl.id} className={cn('overflow-hidden', isComplete && 'opacity-70')}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Left bar indicator */}
                          <div
                            className={cn(
                              'mt-1 h-full w-1 shrink-0 rounded-full',
                              tl.status === 'IN_PROGRESS'
                                ? 'bg-emerald-500'
                                : tl.status === 'COMPLETED'
                                  ? 'bg-green-500'
                                  : tl.status === 'DELAYED'
                                    ? 'bg-red-500'
                                    : 'bg-gray-300'
                            )}
                            style={{ minHeight: '40px' }}
                          />

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={cn('text-sm font-medium', isComplete && 'line-through')}>
                                  {tl.taskName}
                                </p>
                                {tl.assignee && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <User className="h-3 w-3" />
                                    {tl.assignee}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge
                                  variant="secondary"
                                  className={cn('text-[10px]', getTimelineStatusClass(tl.status))}
                                >
                                  {TIMELINE_STATUS_LABELS[tl.status]}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openEditTimeline(tl)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteTimelineTarget(tl)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Date range bar */}
                            {(start || end) && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {start && <span>{format(start, 'MMM dd')}</span>}
                                {start && end && <span>→</span>}
                                {end && <span>{format(end, 'MMM dd, yyyy')}</span>}
                              </div>
                            )}

                            {/* Progress */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    tl.status === 'COMPLETED'
                                      ? 'bg-green-500'
                                      : tl.status === 'DELAYED'
                                        ? 'bg-red-500'
                                        : 'bg-emerald-500'
                                  )}
                                  style={{ width: `${tl.progress}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-muted-foreground w-8 text-right">
                                {tl.progress}%
                              </span>
                            </div>

                            {tl.notes && (
                              <p className="text-xs text-muted-foreground">{tl.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Project Reports</h3>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setReportForm({ title: '', type: 'WEEKLY', content: '', status: 'DRAFT' });
                setIsReportOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Report
            </Button>
          </div>

          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 rounded-lg border border-dashed">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No reports yet. Create your first report.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium truncate">{report.title}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {REPORT_TYPE_LABELS[report.type]}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px]',
                              report.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                : report.status === 'SUBMITTED'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            )}
                          >
                            {REPORT_STATUS_LABELS[report.status]}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {report.content && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {report.content}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                        onClick={() =>
                          deleteReport.mutate({ id: report.id, projectId })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Timeline Dialog */}
      <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTimeline ? 'Edit Timeline Entry' : 'Add Timeline Entry'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tl-name">Task Name *</Label>
              <Input
                id="tl-name"
                value={timelineForm.taskName}
                onChange={(e) => setTimelineForm({ ...timelineForm, taskName: e.target.value })}
                placeholder="Design phase"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tl-start">Start Date</Label>
                <Input
                  id="tl-start"
                  type="date"
                  value={timelineForm.startDate}
                  onChange={(e) => setTimelineForm({ ...timelineForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tl-end">End Date</Label>
                <Input
                  id="tl-end"
                  type="date"
                  value={timelineForm.endDate}
                  onChange={(e) => setTimelineForm({ ...timelineForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={timelineForm.status}
                  onValueChange={(val) =>
                    setTimelineForm({ ...timelineForm, status: val as TimelineStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIMELINE_STATUSES).map(([key, val]) => (
                      <SelectItem key={key} value={val}>
                        {TIMELINE_STATUS_LABELS[val]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tl-progress">Progress (%)</Label>
                <Input
                  id="tl-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={timelineForm.progress}
                  onChange={(e) =>
                    setTimelineForm({
                      ...timelineForm,
                      progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tl-assignee">Assignee</Label>
              <Input
                id="tl-assignee"
                value={timelineForm.assignee}
                onChange={(e) => setTimelineForm({ ...timelineForm, assignee: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tl-notes">Notes</Label>
              <Textarea
                id="tl-notes"
                value={timelineForm.notes}
                onChange={(e) => setTimelineForm({ ...timelineForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimelineOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTimelineSubmit}
              disabled={!timelineForm.taskName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingTimeline ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Report</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rpt-title">Title *</Label>
              <Input
                id="rpt-title"
                value={reportForm.title}
                onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                placeholder="Weekly Status Report"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={reportForm.type}
                  onValueChange={(val) =>
                    setReportForm({ ...reportForm, type: val as ReportType })
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
                  value={reportForm.status}
                  onValueChange={(val) =>
                    setReportForm({ ...reportForm, status: val as ReportStatus })
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
                value={reportForm.content}
                onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
                placeholder="Report content..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReportSubmit}
              disabled={!reportForm.title.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Timeline Confirmation */}
      <AlertDialog
        open={!!deleteTimelineTarget}
        onOpenChange={() => setDeleteTimelineTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timeline Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTimelineTarget?.taskName}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTimelineTarget) {
                  deleteTimeline.mutate({
                    id: deleteTimelineTarget.id,
                    projectId,
                  });
                  setDeleteTimelineTarget(null);
                }
              }}
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

// Small info card component
function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}