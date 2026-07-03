'use client';

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileBarChart,
  UploadCloud,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ViewType } from './types';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const navItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'customers', label: 'Customers', icon: Users },
  { view: 'projects', label: 'Projects', icon: FolderKanban },
  { view: 'reports', label: 'Reports', icon: FileBarChart },
  { view: 'upload', label: 'Upload Excel', icon: UploadCloud },
];

function SidebarContent({
  currentView,
  onNavigate,
}: SidebarProps & { onMobileClose?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
          <FolderKanban className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-foreground">
            PMO Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">Project Management</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'text-muted-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : ''
                )}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600" />
              )}
            </button>
          );
        })}
      </nav>

      <Separator />

      {/* Bottom info */}
      <div className="px-4 py-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-foreground">PMO Office</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Project Management & Oversight
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-card">
        <SidebarContent currentView={currentView} onNavigate={onNavigate} />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <div className="flex lg:hidden items-center gap-2 px-4 py-3 border-b bg-card">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent currentView={currentView} onNavigate={onNavigate} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600">
            <FolderKanban className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-sm font-bold text-foreground">PMO Dashboard</h1>
        </div>
      </div>
    </>
  );
}