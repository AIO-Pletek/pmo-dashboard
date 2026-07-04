'use client';

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileBarChart,
  UploadCloud,
  Menu,
  Building2,
  UserCog,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ViewType } from './types';
import { USER_ROLE_LABELS } from './types';
import { useAuth } from './auth-context';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isAdmin: boolean;
}

function SidebarContent({
  currentView,
  onNavigate,
  isAdmin,
  onMobileClose,
}: SidebarProps & { onMobileClose?: () => void }) {
  const { user, logout } = useAuth();

  const mainNavItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'customers', label: 'Customers', icon: Users },
    { view: 'projects', label: 'Projects', icon: FolderKanban },
    { view: 'divisions', label: 'Panel Divisi', icon: Building2 },
    { view: 'reports', label: 'Reports', icon: FileBarChart },
    { view: 'upload', label: 'Upload Excel', icon: UploadCloud },
  ];

  const bottomNavItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
    ...(isAdmin
      ? [{ view: 'users' as ViewType, label: 'Manajemen User', icon: UserCog }]
      : []),
    { view: 'profile', label: 'Profil Saya', icon: UserCircle },
  ];

  const handleNavigate = (view: ViewType) => {
    onNavigate(view);
    onMobileClose?.();
  };

  const handleLogout = async () => {
    await logout();
  };

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {mainNavItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => handleNavigate(item.view)}
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

        {/* Separator before bottom nav */}
        {bottomNavItems.length > 0 && <Separator className="my-2" />}

        {/* Bottom Navigation (User Management + Profile) */}
        {bottomNavItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => handleNavigate(item.view)}
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

      {/* User info + Logout */}
      <div className="px-4 py-4">
        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
                <Badge
                  variant="default"
                  className={cn(
                    'mt-0.5 text-[10px] px-1.5 py-0',
                    user.role === 'ADMIN'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : ''
                  )}
                >
                  {USER_ROLE_LABELS[user.role] || user.role}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ currentView, onNavigate, isAdmin }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-card">
        <SidebarContent
          currentView={currentView}
          onNavigate={onNavigate}
          isAdmin={isAdmin}
        />
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
            <SidebarContent
              currentView={currentView}
              onNavigate={onNavigate}
              isAdmin={isAdmin}
            />
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