'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Users,
  FolderKanban,
  TrendingUp,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useDashboard } from './use-pmo-data';
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  type ProjectStatus,
  type ProjectCategory,
} from './types';
import { cn } from '@/lib/utils';

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Colors
const STATUS_COLORS: Record<string, string> = {
  PLANNING: '#9ca3af',
  IN_PROGRESS: '#10b981',
  ON_HOLD: '#f59e0b',
  COMPLETED: '#22c55e',
  CANCELLED: '#ef4444',
};

const PIE_COLORS = ['#10b981', '#8b5cf6'];

// KPI Card
function KpiCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <motion.div variants={item}>
      <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                color
              )}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getStatusBadgeVariant(status: string) {
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

function getCategoryBadgeVariant(category: string) {
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

interface DashboardOverviewProps {
  onNavigateToProjects: () => void;
  onProjectClick: (projectId: string) => void;
}

export function DashboardOverview({
  onNavigateToProjects,
  onProjectClick,
}: DashboardOverviewProps) {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const completedCount =
    data.projectsByStatus['COMPLETED'] || 0;
  const totalProjects = data.totalProjects || 1;
  const completionRate = Math.round((completedCount / totalProjects) * 100);

  // Bar chart data
  const barData = Object.entries(data.projectsByStatus || {}).map(
    ([status, count]) => ({
      name: STATUS_LABELS[status as ProjectStatus] || status,
      value: count as number,
      fill: STATUS_COLORS[status] || '#9ca3af',
    })
  );

  // Pie chart data
  const pieData = Object.entries(data.projectsByCategory || {}).map(
    ([category, count]) => ({
      name: CATEGORY_LABELS[category as ProjectCategory] || category,
      value: count as number,
    })
  );

  // Upcoming deadlines
  const upcomingDeadlines = (data.upcomingDeadlines || []).slice(0, 5);

  // Recent projects
  const recentProjects = (data.recentProjects || []).slice(0, 5);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your project portfolio
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Customers"
          value={data.totalCustomers}
          icon={Users}
          color="bg-emerald-600"
        />
        <KpiCard
          title="Active Projects"
          value={data.totalProjects}
          icon={FolderKanban}
          color="bg-teal-600"
          subtitle={`${data.projectsByStatus['IN_PROGRESS'] || 0} in progress`}
        />
        <KpiCard
          title="POC Projects"
          value={data.projectsByCategory['POC_CUSTOMER'] || 0}
          icon={TrendingUp}
          color="bg-violet-600"
        />
        <KpiCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={CheckCircle2}
          color="bg-green-600"
          subtitle={`${completedCount} of ${totalProjects} completed`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Bar Chart - Projects by Status */}
        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Projects by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--card-foreground)',
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                  No project data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart - Projects by Category */}
        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Projects by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--card-foreground)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                  No project data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Projects */}
        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Recent Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentProjects.map((project) => (
                      <TableRow
                        key={project.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onProjectClick(project.id)}
                      >
                        <TableCell className="font-medium max-w-[160px] truncate">
                          {project.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[120px] truncate">
                          {project.customer?.company || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs font-medium',
                              getStatusBadgeVariant(project.status)
                            )}
                          >
                            {STATUS_LABELS[project.status] || project.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {project.progress}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                  No recent projects
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-amber-500" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {upcomingDeadlines.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => onProjectClick(project.id)}
                      className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {project.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {project.customer?.company}
                        </p>
                      </div>
                      <div className="ml-3 flex flex-col items-end gap-1">
                        {project.endDate && (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            {format(new Date(project.endDate), 'MMM dd, yyyy')}
                          </span>
                        )}
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px]',
                            getCategoryBadgeVariant(project.category)
                          )}
                        >
                          {CATEGORY_LABELS[project.category]}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                  No upcoming deadlines
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}