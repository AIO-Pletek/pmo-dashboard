'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  FolderKanban,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface PublicProject {
  id: string;
  name: string;
  category: string;
  status: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  priority: string;
  customer: { name: string; company: string } | null;
  picInternalName: string;
  picInternalDivision: { name: string } | null;
  picInternalName2: string;
  picInternalDivision2: { name: string } | null;
  pendingType: string;
  timelines: Array<{
    id: string;
    taskName: string;
    status: string;
    progress: number;
    assignee: string;
    startDate: string | null;
    endDate: string | null;
  }>;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const CATEGORY_LABELS: Record<string, string> = {
  ONGOING_CUSTOMER: 'On-going Customer',
  POC_CUSTOMER: 'POC Customer',
  INTERNAL: 'Internal Project',
};

const TIMELINE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DELAYED: 'Delayed',
};

function getStatusClass(status: string) {
  switch (status) {
    case 'IN_PROGRESS': return 'bg-emerald-100 text-emerald-700';
    case 'COMPLETED': return 'bg-green-100 text-green-700';
    case 'ON_HOLD': return 'bg-amber-100 text-amber-700';
    case 'CANCELLED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getProgressColor(progress: number) {
  if (progress >= 80) return '[&>div]:bg-green-500';
  if (progress >= 50) return '[&>div]:bg-emerald-500';
  if (progress >= 25) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

function getTimelineStatusClass(status: string) {
  switch (status) {
    case 'COMPLETED': return 'bg-green-100 text-green-700';
    case 'IN_PROGRESS': return 'bg-emerald-100 text-emerald-700';
    case 'DELAYED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
});

function PublicProjectView() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['publicProject', token],
    queryFn: async () => {
      const res = await fetch(`/api/public/projects/${token}`);
      if (!res.ok) throw new Error('Project not found');
      const json = await res.json();
      return json.data as PublicProject;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <Card className="max-w-md mx-4">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">Link Not Found</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This project link may have expired or been revoked. Please contact your project manager for an updated link.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const project = data;
  const totalTimeline = project.timelines.length;
  const completedTimeline = project.timelines.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 shadow-lg">
              <FolderKanban className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn('text-[10px]', getStatusClass(project.status))}>
                  {STATUS_LABELS[project.status] || project.status}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {CATEGORY_LABELS[project.category] || project.category}
                </Badge>
                {project.pendingType !== 'NONE' && (
                  <Badge className="bg-orange-100 text-orange-700 text-[10px]">
                    Pending: {project.pendingType}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-2xl font-bold text-emerald-600">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className={cn('h-3', getProgressColor(project.progress))} />
              <p className="text-xs text-muted-foreground mt-2">
                {completedTimeline} of {totalTimeline} tasks completed
              </p>
            </CardContent>
          </Card>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {project.customer && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium truncate">{project.customer.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{project.customer.company}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Timeline</p>
                  <p className="text-sm font-medium">
                    {project.startDate ? format(new Date(project.startDate), 'MMM dd') : '—'}
                    {' → '}
                    {project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">{format(new Date(project.updatedAt), 'MMM dd, yyyy')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PIC Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{project.picInternalName || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.picInternalDivision?.name || 'PIC Internal'}
                    </p>
                  </div>
                </div>
                {project.picInternalName2 && (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                      <User className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{project.picInternalName2}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.picInternalDivision2?.name || 'PIC Internal 2'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                Timeline ({completedTimeline}/{totalTimeline} done)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.timelines.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center">
                  No tasks have been added yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {project.timelines.map((tl) => (
                    <div
                      key={tl.id}
                      className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        tl.status === 'COMPLETED' ? 'bg-green-500' :
                        tl.status === 'IN_PROGRESS' ? 'bg-emerald-500' :
                        tl.status === 'DELAYED' ? 'bg-red-500' : 'bg-gray-300'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn('text-sm font-medium', tl.status === 'COMPLETED' && 'line-through')}>
                            {tl.taskName}
                          </p>
                          <Badge className={cn('text-[9px]', getTimelineStatusClass(tl.status))}>
                            {TIMELINE_STATUS_LABELS[tl.status] || tl.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {tl.assignee && (
                            <span className="text-xs text-muted-foreground">{tl.assignee}</span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Progress value={tl.progress} className="h-1.5 w-16" />
                            <span className="text-[10px] text-muted-foreground">{tl.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
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

          {/* Footer */}
          <div className="text-center pb-8">
            <p className="text-xs text-muted-foreground">
              PMO Dashboard • Live project progress tracking
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function PublicProjectPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <PublicProjectView />
    </QueryClientProvider>
  );
}
