'use client';

import { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/pmo/sidebar';
import { DashboardOverview } from '@/components/pmo/dashboard-overview';
import { CustomerManagement } from '@/components/pmo/customer-management';
import { ProjectManagement } from '@/components/pmo/project-management';
import { ProjectDetail } from '@/components/pmo/project-detail';
import { ReportManagement } from '@/components/pmo/report-management';
import { ExcelUpload } from '@/components/pmo/excel-upload';
import { DivisionPanel } from '@/components/pmo/division-panel';
import type { ViewType } from '@/components/pmo/types';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PMOApp() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const navigate = (view: ViewType) => {
    setCurrentView(view);
    if (view !== 'project-detail') {
      setSelectedProjectId(null);
    }
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project-detail');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardOverview
            onNavigateToProjects={() => navigate('projects')}
            onProjectClick={handleProjectClick}
          />
        );
      case 'customers':
        return <CustomerManagement />;
      case 'projects':
        return <ProjectManagement onProjectClick={handleProjectClick} />;
      case 'project-detail':
        return selectedProjectId ? (
          <ProjectDetail
            projectId={selectedProjectId}
            onBack={() => navigate('projects')}
          />
        ) : null;
      case 'reports':
        return <ReportManagement />;
      case 'upload':
        return <ExcelUpload />;
      case 'divisions':
        return <DivisionPanel onProjectClick={handleProjectClick} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar currentView={currentView} onNavigate={navigate} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {renderContent()}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t bg-card px-6 py-3">
          <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} PMO Dashboard. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Project Management Office
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <PMOApp />
    </QueryClientProvider>
  );
}