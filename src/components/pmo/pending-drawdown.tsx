'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  User,
  Building2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './use-pmo-data';
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  PENDING_TYPE_LABELS,
  type ProjectCategory,
} from './types';

interface PendingProject {
  id: string;
  name: string;
  category: string;
  status: string;
  pendingType: string;
  pendingNote: string;
  customerName: string;
  picInternalName?: string;
  progress: number;
  updatedAt: string;
}

interface UserBreakdown {
  userName: string;
  divisionId: string | null;
  divisionName: string | null;
  internal: number;
  external: number;
  projects: PendingProject[];
}

interface DivisionBreakdown {
  divisionId: string;
  divisionName: string;
  internal: number;
  external: number;
  projects: PendingProject[];
}

interface PendingBreakdownData {
  summary: {
    totalPending: number;
    totalInternal: number;
    totalExternal: number;
  };
  byUser: UserBreakdown[];
  byDivision: DivisionBreakdown[];
}

function usePendingBreakdown() {
  return useQuery({
    queryKey: ['pendingBreakdown'],
    queryFn: () =>
      apiFetch<{ data: PendingBreakdownData }>('/api/dashboard/pending-breakdown'),
  });
}

function getStatusClass(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    case 'ON_HOLD':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

function UserCard({
  user,
  onProjectClick,
}: {
  user: UserBreakdown;
  onProjectClick: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = user.internal + user.external;

  return (
    <Card className={cn('transition-shadow hover:shadow-md', total > 3 && 'border-l-4 border-l-red-400')}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">{user.userName}</CardTitle>
              {user.divisionName && (
                <p className="text-xs text-muted-foreground">{user.divisionName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {user.internal > 0 && (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[10px]">
                  {user.internal} Internal
                </Badge>
              )}
              {user.external > 0 && (
                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 text-[10px]">
                  {user.external} External
                </Badge>
              )}
            </div>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2 pt-0">
          {user.projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onProjectClick(p.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <Badge className={cn('text-[9px]', getStatusClass(p.status))}>
                    {STATUS_LABELS[p.status as keyof typeof STATUS_LABELS] || p.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{p.customerName}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(p.updatedAt), 'MMM dd')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <Badge className={cn(
                  'text-[9px]',
                  p.pendingType === 'INTERNAL'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-orange-100 text-orange-700'
                )}>
                  {PENDING_TYPE_LABELS[p.pendingType as keyof typeof PENDING_TYPE_LABELS] || p.pendingType}
                </Badge>
                <span className="text-[11px] font-medium w-8 text-right">{p.progress}%</span>
              </div>
            </div>
          ))}
          {user.projects.length === 0 && (
            <p className="text-sm text-muted-foreground italic py-2">No pending projects</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function PendingDrawdown({
  onProjectClick,
}: {
  onProjectClick: (projectId: string) => void;
}) {
  const { data, isLoading } = usePendingBreakdown();
  const [tab, setTab] = useState('user');

  const breakdown = data?.data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Pending Drawdown
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Breakdown pending project berdasarkan PIC dan Divisi
        </p>
      </div>

      {/* Summary KPI */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : breakdown ? (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{breakdown.summary.totalPending}</p>
                <p className="text-xs text-muted-foreground">Total Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{breakdown.summary.totalInternal}</p>
                <p className="text-xs text-muted-foreground">Pending Internal</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{breakdown.summary.totalExternal}</p>
                <p className="text-xs text-muted-foreground">Pending External</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Tabs: By User / By Division */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="user" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            By User
          </TabsTrigger>
          <TabsTrigger value="division" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            By Division
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="mt-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : breakdown?.byUser.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">No pending items</p>
                <p className="text-xs text-muted-foreground">
                  All projects are clear — no pending issues assigned
                </p>
              </CardContent>
            </Card>
          ) : (
            breakdown?.byUser.map((user) => (
              <UserCard key={user.userName} user={user} onProjectClick={onProjectClick} />
            ))
          )}
        </TabsContent>

        <TabsContent value="division" className="mt-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : breakdown?.byDivision.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">No pending items</p>
                <p className="text-xs text-muted-foreground">
                  All divisions are clear — no pending items
                </p>
              </CardContent>
            </Card>
          ) : (
            breakdown?.byDivision.map((div) => (
              <UserCard
                key={div.divisionId}
                user={{
                  userName: div.divisionName,
                  divisionId: div.divisionId,
                  divisionName: null,
                  internal: div.internal,
                  external: div.external,
                  projects: div.projects,
                }}
                onProjectClick={onProjectClick}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
