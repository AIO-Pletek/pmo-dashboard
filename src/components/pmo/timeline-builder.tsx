'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  FileSpreadsheet,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Edit3,
  Copy,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Layers,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useTimelineDocs,
  useCreateTimelineDoc,
  useUpdateTimelineDoc,
  useDeleteTimelineDoc,
} from './use-pmo-data';
import type {
  TimelineDocument,
  TimelinePhaseItem,
  TimelineTaskItem,
} from './types';

const emptyPhase = (): TimelinePhaseItem => ({
  name: '',
  tasks: [],
});

const emptyTask = (): TimelineTaskItem => ({
  description: '',
  assignedTo: '',
  progress: 0,
  days: 1,
});

// ==========================================
// Sub-components
// ==========================================

function TaskRow({
  task,
  index,
  onUpdate,
  onRemove,
}: {
  task: TimelineTaskItem;
  index: number;
  onUpdate: (i: number, t: TimelineTaskItem) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="group flex items-start gap-2 rounded-lg border bg-card p-3 transition-colors hover:border-emerald-200"
    >
      <div className="mt-2 flex shrink-0 items-center gap-1 text-muted-foreground">
        <GripVertical className="h-4 w-4 cursor-grab" />
        <span className="text-xs font-medium">{index + 1}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:gap-3">
        <div className="flex-1">
          <Label className="mb-1 text-xs text-muted-foreground">Deskripsi Task</Label>
          <Input
            placeholder="Nama task..."
            value={task.description}
            onChange={(e) =>
              onUpdate(index, { ...task, description: e.target.value })
            }
            className="h-9 text-sm"
          />
        </div>
        <div className="w-full sm:w-44">
          <Label className="mb-1 text-xs text-muted-foreground">PIC</Label>
          <Input
            placeholder="Assigned to..."
            value={task.assignedTo}
            onChange={(e) =>
              onUpdate(index, { ...task, assignedTo: e.target.value })
            }
            className="h-9 text-sm"
          />
        </div>
        <div className="w-full sm:w-20">
          <Label className="mb-1 text-xs text-muted-foreground">Hari</Label>
          <Input
            type="number"
            min={0}
            step={0.25}
            value={task.days}
            onChange={(e) =>
              onUpdate(index, { ...task, days: parseFloat(e.target.value) || 0 })
            }
            className="h-9 text-sm"
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="mt-5 h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        onClick={() => onRemove(index)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </motion.div>
  );
}

function PhaseSection({
  phase,
  phaseIndex,
  onUpdate,
  onRemove,
}: {
  phase: TimelinePhaseItem;
  phaseIndex: number;
  onUpdate: (i: number, p: TimelinePhaseItem) => void;
  onRemove: (i: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const totalDays = phase.tasks.reduce((s, t) => s + t.days, 0);

  const addTask = () => {
    const tasks = [...phase.tasks, emptyTask()];
    onUpdate(phaseIndex, { ...phase, tasks });
  };

  const updateTask = (taskIdx: number, task: TimelineTaskItem) => {
    const tasks = [...phase.tasks];
    tasks[taskIdx] = task;
    onUpdate(phaseIndex, { ...phase, tasks });
  };

  const removeTask = (taskIdx: number) => {
    const tasks = phase.tasks.filter((_, i) => i !== taskIdx);
    onUpdate(phaseIndex, { ...phase, tasks });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border bg-background shadow-sm"
    >
      {/* Phase Header */}
      <div className="flex items-center gap-2 rounded-t-xl bg-muted/50 px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <Layers className="h-4 w-4 text-emerald-600" />

        <Input
          value={phase.name}
          onChange={(e) =>
            onUpdate(phaseIndex, { ...phase, name: e.target.value })
          }
          placeholder="Nama Phase..."
          className="h-8 flex-1 border-0 bg-transparent text-sm font-semibold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        <Badge variant="secondary" className="text-xs">
          {phase.tasks.length} task
        </Badge>

        {totalDays > 0 && (
          <Badge
            variant="outline"
            className="border-emerald-200 text-xs text-emerald-700"
          >
            {totalDays} hari
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(phaseIndex)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Phase Tasks */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-4">
              {phase.tasks.length > 0 ? (
                <AnimatePresence>
                  {phase.tasks.map((task, tIdx) => (
                    <TaskRow
                      key={tIdx}
                      task={task}
                      index={tIdx}
                      onUpdate={updateTask}
                      onRemove={removeTask}
                    />
                  ))}
                </AnimatePresence>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Belum ada task. Klik &quot;+ Tambah Task&quot; untuk menambahkan.
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                onClick={addTask}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Task
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==========================================
// Builder Form
// ==========================================

function BuilderForm({
  initialData,
  onSave,
  onCancel,
  isSaving,
}: {
  initialData?: TimelineDocument;
  onSave: (data: {
    title: string;
    projectLead: string;
    startDate: string;
    totalWeeks: number;
    phases: TimelinePhaseItem[];
    notes: string;
  }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [projectLead, setProjectLead] = useState(initialData?.projectLead || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [totalWeeks, setTotalWeeks] = useState(initialData?.totalWeeks || 5);
  const [phases, setPhases] = useState<TimelinePhaseItem[]>(
    initialData?.phases?.length ? initialData.phases : [emptyPhase()]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  const addPhase = () => setPhases([...phases, emptyPhase()]);

  const updatePhase = (idx: number, phase: TimelinePhaseItem) => {
    const updated = [...phases];
    updated[idx] = phase;
    setPhases(updated);
  };

  const removePhase = (idx: number) => {
    setPhases(phases.filter((_, i) => i !== idx));
  };

  const duplicatePhase = (idx: number) => {
    const clone = JSON.parse(JSON.stringify(phases[idx])) as TimelinePhaseItem;
    clone.name = `${clone.name} (copy)`;
    const updated = [...phases];
    updated.splice(idx + 1, 0, clone);
    setPhases(updated);
  };

  const totalTasks = phases.reduce((s, p) => s + p.tasks.length, 0);
  const totalDays = phases.reduce(
    (s, p) => s + p.tasks.reduce((ts, t) => ts + t.days, 0),
    0
  );

  const handleSubmit = () => {
    if (!title.trim()) {
      return;
    }
    onSave({
      title: title.trim(),
      projectLead: projectLead.trim(),
      startDate,
      totalWeeks,
      phases: phases.filter((p) => p.name.trim()),
      notes: notes.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onCancel} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Timeline
      </Button>

      {/* Header Info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            {initialData ? 'Edit Timeline' : 'Buat Timeline Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="tl-title" className="mb-1.5">
                Judul Timeline <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tl-title"
                placeholder="e.g. Deploy Proxmox Private Cloud Timeline Yutaka Manufacturing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tl-lead" className="mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Project Lead
              </Label>
              <Input
                id="tl-lead"
                placeholder="Nama project lead..."
                value={projectLead}
                onChange={(e) => setProjectLead(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tl-date" className="mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Tanggal Mulai Project
              </Label>
              <Input
                id="tl-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tl-weeks" className="mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Total Minggu (Gantt)
              </Label>
              <Input
                id="tl-weeks"
                type="number"
                min={1}
                max={52}
                value={totalWeeks}
                onChange={(e) =>
                  setTotalWeeks(parseInt(e.target.value) || 5)
                }
              />
            </div>
            <div>
              <Label htmlFor="tl-notes" className="mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Catatan
              </Label>
              <Input
                id="tl-notes"
                placeholder="e.g. Bandwidth 1G"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Phase & Tasks</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {phases.length} phase
            </Badge>
            <Badge variant="outline" className="text-xs">
              {totalTasks} task
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-200 text-xs text-emerald-700"
            >
              {totalDays.toFixed(2)} hari total
            </Badge>
          </div>
        </div>

        <AnimatePresence>
          {phases.map((phase, pIdx) => (
            <div key={pIdx} className="relative">
              <PhaseSection
                phase={phase}
                phaseIndex={pIdx}
                onUpdate={updatePhase}
                onRemove={removePhase}
              />
              {/* Duplicate button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-2 top-1/2 z-10 h-7 w-7 -translate-y-1/2 rounded-full border bg-background text-muted-foreground shadow-sm hover:text-emerald-600"
                onClick={() => duplicatePhase(pIdx)}
                title="Duplikat phase"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </AnimatePresence>

        <Button
          variant="outline"
          className="w-full border-dashed py-5 text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
          onClick={addPhase}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Phase
        </Button>
      </div>

      {/* Save Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || isSaving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Simpan Perubahan' : 'Buat Timeline'}
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// Main Timeline Builder Component
// ==========================================

export function TimelineBuilder() {
  const { data, isLoading } = useTimelineDocs();
  const createDoc = useCreateTimelineDoc();
  const updateDoc = useUpdateTimelineDoc();
  const deleteDoc = useDeleteTimelineDoc();

  const docs = data?.data || [];
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingDoc, setEditingDoc] = useState<TimelineDocument | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async (formData: {
    title: string;
    projectLead: string;
    startDate: string;
    totalWeeks: number;
    phases: TimelinePhaseItem[];
    notes: string;
  }) => {
    await createDoc.mutateAsync(formData);
    setMode('list');
  };

  const handleUpdate = async (formData: {
    title: string;
    projectLead: string;
    startDate: string;
    totalWeeks: number;
    phases: TimelinePhaseItem[];
    notes: string;
  }) => {
    if (!editingDoc) return;
    await updateDoc.mutateAsync({ id: editingDoc.id, ...formData });
    setMode('list');
    setEditingDoc(undefined);
  };

  const handleEdit = (doc: TimelineDocument) => {
    setEditingDoc(doc);
    setMode('edit');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleExport = async (doc: TimelineDocument) => {
    try {
      const res = await fetch(`/api/timeline-docs/${doc.id}/export`);
      if (!res.ok) throw new Error('Export gagal');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Timeline ${doc.title.replace(/[^a-zA-Z0-9\s\-_()]/g, '').trim()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // fallback: open in new tab
      window.open(`/api/timeline-docs/${doc.id}/export`, '_blank');
    }
  };

  const handleDuplicate = async (doc: TimelineDocument) => {
    await createDoc.mutateAsync({
      title: `${doc.title} (copy)`,
      projectLead: doc.projectLead,
      startDate: doc.startDate,
      totalWeeks: doc.totalWeeks,
      phases: doc.phases,
      notes: doc.notes,
    });
  };

  // Builder Mode
  if (mode === 'create' || mode === 'edit') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <BuilderForm
          key={editingDoc?.id || 'new'}
          initialData={editingDoc}
          onSave={mode === 'create' ? handleCreate : handleUpdate}
          onCancel={() => {
            setMode('list');
            setEditingDoc(undefined);
          }}
          isSaving={createDoc.isPending || updateDoc.isPending}
        />
      </motion.div>
    );
  }

  // List Mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Timeline Builder
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat timeline project dengan format Gantt chart dan export ke Excel
          </p>
        </div>
        <Button
          onClick={() => setMode('create')}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Buat Timeline Baru
        </Button>
      </div>

      {/* Stats */}
      {docs.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: 'Total Timeline',
              value: docs.length,
              icon: FileSpreadsheet,
              color: 'text-emerald-600',
            },
            {
              label: 'Total Phase',
              value: docs.reduce(
                (s, d) => s + (d.phases?.length || 0),
                0
              ),
              icon: Layers,
              color: 'text-blue-600',
            },
            {
              label: 'Total Task',
              value: docs.reduce(
                (s, d) =>
                  s +
                  (d.phases?.reduce(
                    (ps, p) => ps + (p.tasks?.length || 0),
                    0
                  ) || 0),
                0
              ),
              icon: FileText,
              color: 'text-amber-600',
            },
            {
              label: 'Total Hari',
              value: docs
                .reduce(
                  (s, d) =>
                    s +
                    (d.phases?.reduce(
                      (ps, p) =>
                        ps +
                        (p.tasks?.reduce(
                          (ts, t) => ts + (t.days || 0),
                          0
                        ) || 0),
                      0
                    ) || 0),
                  0
                )
                .toFixed(1),
              icon: Clock,
              color: 'text-rose-600',
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${stat.color}`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && docs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Belum ada timeline
            </h3>
            <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
              Buat timeline project dengan phase dan task, lalu export ke format Excel
              Gantt chart.
            </p>
            <Button
              onClick={() => setMode('create')}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Buat Timeline Pertama
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Document List */}
      {!isLoading && docs.length > 0 && (
        <div className="grid gap-4">
          {docs.map((doc) => {
            const totalTasks = doc.phases?.reduce(
              (s, p) => s + (p.tasks?.length || 0),
              0
            );
            const totalDays = doc.phases?.reduce(
              (s, p) =>
                s +
                (p.tasks?.reduce((ts, t) => ts + (t.days || 0), 0) || 0),
              0
            );

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                          </div>
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {doc.title}
                          </h3>
                        </div>

                        <div className="ml-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {doc.projectLead && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {doc.projectLead}
                            </span>
                          )}
                          {doc.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {doc.startDate}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {doc.phases?.length || 0} phase
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {totalTasks} task
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {totalDays.toFixed(1)} hari
                          </span>
                          <span>{doc.totalWeeks} minggu</span>
                        </div>
                      </div>

                      <div className="ml-10 flex shrink-0 items-center gap-2 sm:ml-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => handleExport(doc)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Export
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => handleDuplicate(doc)}
                          title="Duplikat"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => handleEdit(doc)}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(doc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Phase preview */}
                    {doc.phases?.length > 0 && (
                      <>
                        <Separator />
                        <div className="flex flex-wrap gap-2 px-4 py-3">
                          {doc.phases.map((phase, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs"
                            >
                              {phase.name || `Phase ${i + 1}`}
                              <span className="ml-1 text-muted-foreground">
                                ({phase.tasks?.length || 0})
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}

                    {doc.notes && (
                      <>
                        <Separator />
                        <div className="px-4 py-2">
                          <p className="text-xs italic text-muted-foreground">
                            Note: {doc.notes}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Timeline</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus timeline ini? Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDoc.isPending}
            >
              {deleteDoc.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}