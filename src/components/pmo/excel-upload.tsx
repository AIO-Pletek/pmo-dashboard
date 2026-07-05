'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  X,
  FileUp,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  useExcelFiles,
  useProjects,
  useUploadExcel,
  useDeleteExcelFile,
} from './use-pmo-data';
import type { ExcelFile } from './types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function ExcelUpload() {
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProjectId, setUploadProjectId] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[] | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useExcelFiles(
    projectFilter !== 'all' ? projectFilter : undefined
  );
  const { data: projectsData } = useProjects();
  const uploadExcel = useUploadExcel();
  const deleteExcelFile = useDeleteExcelFile();

  const files = data?.data || [];
  const projects = projectsData?.data || [];

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      return;
    }

    setSelectedFile(file);
    setPreviewData(null);

    // Parse the file locally for preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const arrayBuffer = e.target?.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        setPreviewData(jsonData.slice(0, 10)); // Show first 10 rows
        setPreviewFileName(file.name);
      } catch {
        // If parsing fails, just show the file info
        setPreviewData(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadProjectId) return;
    uploadExcel.mutate(
      { file: selectedFile, projectId: uploadProjectId },
      {
        onSuccess: (result) => {
          // Show full preview if data is returned
          if (result?.data?.data) {
            setPreviewData(result.data.data);
            setPreviewFileName(result.data.fileName);
          } else {
            setSelectedFile(null);
            setPreviewData(null);
            setPreviewFileName('');
          }
        },
      }
    );
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setPreviewFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const previewColumns = previewData && previewData.length > 0 ? Object.keys(previewData[0]) : [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold tracking-tight">Upload Excel</h2>
        <p className="text-muted-foreground">
          Upload and preview Excel files for your projects
        </p>
      </motion.div>

      {/* Upload Area */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Upload File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project selector */}
            <div className="max-w-xs">
              <Select value={uploadProjectId} onValueChange={setUploadProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project..." />
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

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer',
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : selectedFile
                    ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {selectedFile ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Click or drag to replace
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-3 h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drag & drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports .xlsx, .xls, .csv files
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Upload button */}
            {selectedFile && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={!uploadProjectId || uploadExcel.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  {uploadExcel.isPending ? 'Uploading...' : 'Upload File'}
                </Button>
                <Button variant="outline" onClick={clearFile}>
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Preview Table */}
      <AnimatePresence>
        {previewData && previewData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Preview: {previewFileName}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewData(null)}>
                    <X className="mr-1 h-3.5 w-3.5" />
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        {previewColumns.map((col) => (
                          <TableHead key={col} className="whitespace-nowrap">
                            {String(col)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          {previewColumns.map((col) => (
                            <TableCell
                              key={col}
                              className="max-w-[200px] truncate text-sm"
                            >
                              {String(row[col] ?? '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {previewData.length >= 10 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Showing first 10 rows
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files List */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Uploaded Files</h3>
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
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 rounded-lg border border-dashed">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {file.uploadedAt ? format(new Date(file.uploadedAt), 'MMM dd, yyyy HH:mm') : '—'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    onClick={() =>
                      deleteExcelFile.mutate({
                        id: file.id,
                        projectId: file.projectId,
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}