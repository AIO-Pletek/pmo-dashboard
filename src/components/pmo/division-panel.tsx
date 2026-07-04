'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  useDivisionOverview,
  useCreateDivision,
  useUpdateDivision,
  useDeleteDivision,
} from './use-pmo-data';
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  PENDING_TYPE_LABELS,
  type Division,
  type DivisionWithCounts,
  type DivisionOverview,
} from './types';

// ==========================================
// Animation variants
// ==========================================

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ==========================================
// Helpers
// ==========================================

function getStatusColor(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-emerald-500';
    case 'COMPLETED':
      return 'bg-green-500';
    case 'ON_HOLD':
      return 'bg-amber-500';
    case 'CANCELLED':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
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

// ==========================================
// Props
// ==========================================

interface DivisionPanelProps {
  onProjectClick: (projectId: string) => void;
}

// ==========================================
// Sub-components (declared outside main component)
// ==========================================

function StatusMiniBar({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return null;

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      {entries.map(([status, count]) => (
        <div
          key={status}
          className={cn('h-full', getStatusColor(status))}
          style={{ width: `${(count / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

function KPICards({ summary }: { summary: NonNullable<DivisionOverview['summary']> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <motion.div variants={item}>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 bg-teal-600 p-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-teal-100">Total Divisi</p>
              <p className="text-2xl font-bold">{summary.totalDivisions}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 bg-orange-500 p-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-orange-100">Pending Internal</p>
              <p className="text-2xl font-bold">{summary.totalPendingInternal}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 bg-sky-500 p-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-sky-100">Pending Eksternal</p>
              <p className="text-2xl font-bold">{summary.totalPendingExternal}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
        <Building2 className="h-10 w-10 text-emerald-500" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold">Belum ada divisi</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat divisi pertama untuk mulai memantau project per divisi
        </p>
      </div>
      <Button
        onClick={onCreate}
        variant="outline"
        className="mt-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
      >
        <Plus className="mr-2 h-4 w-4" />
        Buat Divisi Pertama
      </Button>
    </div>
  );
}

// ==========================================
// Component
// ==========================================

export function DivisionPanel({ onProjectClick }: DivisionPanelProps) {
  const { data: overviewData, isLoading } = useDivisionOverview();
  const createDivision = useCreateDivision();
  const updateDivision = useUpdateDivision();
  const deleteDivision = useDeleteDivision();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DivisionWithCounts | null>(null);
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({ name: '', description: '' });

  const overview = overviewData?.data;
  const divisions = overview?.divisions || [];
  const summary = overview?.summary || {
    totalDivisions: 0,
    totalPendingInternal: 0,
    totalPendingExternal: 0,
    totalPendingNone: 0,
    projectsWithoutDivision: 0,
  };

  // Form handlers
  const openCreate = () => {
    setEditingDivision(null);
    setForm({ name: '', description: '' });
    setIsFormOpen(true);
  };

  const openEdit = (division: DivisionWithCounts) => {
    setEditingDivision(division);
    setForm({ name: division.name, description: division.description });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editingDivision) {
      updateDivision.mutate({ id: editingDivision.id, ...form });
    } else {
      createDivision.mutate(form);
    }
    setIsFormOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteDivision.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // KPI Cards (moved outside)

  // Division Card
  function DivisionCard({ division }: { division: DivisionWithCounts }) {
    const isExpanded = expandedDivisions.has(division.id);
    const hasPending = division.pendingProjects.length > 0;
    const internalPending = division.projectsByPendingType?.INTERNAL || 0;
    const externalPending = division.projectsByPendingType?.EXTERNAL || 0;
    const okCount = division.projectsByPendingType?.NONE || 0;

    return (
      <motion.div variants={item} whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold leading-tight truncate">
                    {division.name}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {division.totalProjects} project{division.totalProjects !== 1 ? 's' : ''}
                  </Badge>
                </div>
                {division.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {division.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openEdit(division)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(division)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Status bar */}
            <StatusMiniBar byStatus={division.projectsByStatus} />

            {/* Status legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              {Object.entries(division.projectsByStatus).map(([status, count]) =>
                count > 0 ? (
                  <span key={status} className="flex items-center gap-1">
                    <span className={cn('inline-block h-2 w-2 rounded-full', getStatusColor(status))} />
                    {STATUS_LABELS[status] || status}: {count}
                  </span>
                ) : null
              )}
            </div>

            {/* Pending breakdown */}
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-orange-600 dark:text-orange-400">Internal: {internalPending}</span>
              {' | '}
              <span className="font-medium text-sky-600 dark:text-sky-400">Eksternal: {externalPending}</span>
              {' | '}
              <span className="font-medium">OK: {okCount}</span>
            </div>

            {/* Pending projects collapsible */}
            {hasPending && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => toggleExpanded(division.id)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {division.pendingProjects.length} pending project{division.pendingProjects.length !== 1 ? 's' : ''}
                </Button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {division.pendingProjects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 cursor-pointer hover:bg-muted/60 transition-colors"
                            onClick={() => onProjectClick(project.id)}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{project.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                {project.customer?.company || 'Unknown Customer'}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                <Badge
                                  variant="secondary"
                                  className={cn('text-[9px]', getCategoryClass(project.category))}
                                >
                                  {CATEGORY_LABELS[project.category]}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className={cn('text-[9px]', getPendingTypeClass(project.pendingType))}
                                >
                                  {PENDING_TYPE_LABELS[project.pendingType]}
                                </Badge>
                              </div>
                              {project.pendingNote && (
                                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                                  {project.pendingNote}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Empty state (moved outside)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panel Divisi</h2>
          <p className="text-muted-foreground">
            Pantau project dan POC pending per divisi internal maupun eksternal
          </p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Divisi
        </Button>
      </motion.div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <KPICards summary={summary} />

          {/* Division Cards */}
          {divisions.length === 0 ? (
            <EmptyState onCreate={openCreate} />
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-4 sm:grid-cols-2"
            >
              {divisions.map((division) => (
                <DivisionCard key={division.id} division={division} />
              ))}
            </motion.div>
          )}

          {/* Projects Without Division */}
          {summary.projectsWithoutDivision > 0 && (
            <motion.div variants={item}>
              <Card className="border-amber-300 dark:border-amber-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Project Tanpa Divisi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      {summary.projectsWithoutDivision}
                    </span>{' '}
                    project belum memiliki divisi internal yang ditetapkan.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {/* Add/Edit Division Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDivision ? 'Edit Divisi' : 'Tambah Divisi'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="div-name">Nama Divisi *</Label>
              <Input
                id="div-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Divisi Teknologi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="div-desc">Deskripsi</Label>
              <Textarea
                id="div-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Deskripsi singkat tentang divisi ini..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingDivision ? 'Simpan' : 'Buat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Divisi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus divisi{' '}
              <strong>{deleteTarget?.name}</strong>? Project yang terkait dengan divisi ini
              tidak akan dihapus, namun kehilangan asosiasi divisi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}