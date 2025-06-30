'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import { JobTable } from '@/components/job-table';
import { KanbanBoard } from '@/components/kanban-board';
import { AddJobModal } from '@/components/add-job-modal';
import { EditJobModal } from '@/components/edit-job-modal';
import { JobDetailsModal } from '@/components/job-details-modal';
import { Header } from '@/components/header';
import { FilterBar } from '@/components/filter-bar';
import { JobDashboard } from '@/components/job-dashboard';
import { EmailIntegrationDashboard } from '@/components/email-integration-dashboard';
import { JobCleanupTool } from '@/components/job-cleanup-tool';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  getJobApplications,
  addJobApplication,
  updateJobApplication,
  updateJobStatus as updateJobStatusInDb,
  deleteJobApplication,
} from '@/lib/firestore';

export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  jobLink?: string;
  status: 'applied' | 'interviewing' | 'ghosted' | 'rejected' | 'offered';
  dateApplied: string;
  notes?: string;
  companyLogo?: string;
  resume?: string;
  // Email integration fields
  emailMessageId?: string;
  emailThreadId?: string;
  emailSubject?: string;
  emailFrom?: string;
  autoImported?: boolean;
  confidence?: number;
  extractedInfo?: any;
  source?: string;
}

export interface FilterState {
  search: string;
  status: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sortBy: 'dateApplied' | 'companyName' | 'jobTitle' | 'status';
  sortOrder: 'asc' | 'desc';
}

const sampleJobs: JobApplication[] = [
  {
    id: '1',
    companyName: 'Google',
    jobTitle: 'Senior Frontend Developer',
    status: 'interviewing',
    dateApplied: '2024-01-15',
    notes: 'Had initial screening call, waiting for technical interview',
    jobLink: 'https://careers.google.com',
  },
  {
    id: '2',
    companyName: 'Meta',
    jobTitle: 'Product Manager',
    status: 'applied',
    dateApplied: '2024-01-20',
    notes: 'Applied through LinkedIn',
    jobLink: 'https://careers.meta.com',
  },
  {
    id: '3',
    companyName: 'Apple',
    jobTitle: 'iOS Developer',
    status: 'offered',
    dateApplied: '2024-01-10',
    notes: 'Final offer received, considering options',
    jobLink: 'https://jobs.apple.com',
  },
  {
    id: '4',
    companyName: 'Netflix',
    jobTitle: 'Data Scientist',
    status: 'rejected',
    dateApplied: '2024-01-05',
    notes: 'Not moving forward after final interview',
    jobLink: 'https://jobs.netflix.com',
  },
  {
    id: '5',
    companyName: 'Spotify',
    jobTitle: 'UX Designer',
    status: 'ghosted',
    dateApplied: '2024-01-12',
    notes: 'No response after follow-up emails',
    jobLink: 'https://lifeatspotify.com',
  },
  {
    id: '6',
    companyName: 'Amazon',
    jobTitle: 'Software Engineer',
    status: 'applied',
    dateApplied: '2024-01-25',
    notes: 'Applied for SDE II position',
    jobLink: 'https://amazon.jobs',
  },
  {
    id: '7',
    companyName: 'Microsoft',
    jobTitle: 'Cloud Solutions Architect',
    status: 'interviewing',
    dateApplied: '2024-01-08',
    notes: 'Completed first round, scheduled for panel interview',
    jobLink: 'https://careers.microsoft.com',
  },
  {
    id: '8',
    companyName: 'Tesla',
    jobTitle: 'Frontend Engineer',
    status: 'rejected',
    dateApplied: '2024-01-03',
    notes: 'Position filled internally',
    jobLink: 'https://tesla.com/careers',
  },
];

export default function Home() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    dateRange: { from: null, to: null },
    sortBy: 'dateApplied',
    sortOrder: 'desc',
  });

  // Function to reload jobs from Firestore (can be called after email scan)
  const loadJobs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading jobs for user:', user.uid);
      const jobsData = await getJobApplications(user.uid);
      console.log('Loaded jobs:', jobsData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      // For now, start with empty array instead of sample data to test the database
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load jobs from Firestore when user is available
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Refresh jobs function that can be called externally
  const refreshJobs = async () => {
    console.log('Refreshing jobs after email scan...');
    await loadJobs();
  };

  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(job =>
        job.companyName.toLowerCase().includes(searchLower) ||
        job.jobTitle.toLowerCase().includes(searchLower) ||
        job.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(job => filters.status.includes(job.status));
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.dateApplied);
        const fromDate = filters.dateRange.from;
        const toDate = filters.dateRange.to;
        
        if (fromDate && toDate) {
          return jobDate >= fromDate && jobDate <= toDate;
        } else if (fromDate) {
          return jobDate >= fromDate;
        } else if (toDate) {
          return jobDate <= toDate;
        }
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy];
      let bValue: any = b[filters.sortBy];

      if (filters.sortBy === 'dateApplied') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return filters.sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return filters.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [jobs, filters]);

  const addJob = async (job: Omit<JobApplication, 'id'>) => {
    if (!user) return;
    
    try {
      const newJobId = await addJobApplication(job, user.uid);
      const newJob: JobApplication = {
        ...job,
        id: newJobId,
      };
      setJobs([newJob, ...jobs]);
    } catch (error) {
      console.error('Error adding job:', error);
      // You might want to show a toast notification here
    }
  };

  const updateJobStatus = async (id: string, status: JobApplication['status']) => {
    if (!user) return;
    
    try {
      await updateJobStatusInDb(id, status, user.uid);
      setJobs(jobs.map(job => 
        job.id === id ? { ...job, status } : job
      ));
    } catch (error) {
      console.error('Error updating job status:', error);
      // You might want to show a toast notification here
    }
  };

  const deleteJob = async (id: string) => {
    if (!user) return;
    
    try {
      await deleteJobApplication(id, user.uid);
      setJobs(jobs.filter(job => job.id !== id));
    } catch (error) {
      console.error('Error deleting job:', error);
      // You might want to show a toast notification here
    }
  };

  const editJob = async (id: string, updates: Partial<JobApplication>) => {
    if (!user) return;
    
    try {
      await updateJobApplication(id, updates, user.uid);
      setJobs(jobs.map(job => 
        job.id === id ? { ...job, ...updates } : job
      ));
    } catch (error) {
      console.error('Error updating job:', error);
      // You might want to show a toast notification here
    }
  };

  const handleEditJob = (job: JobApplication) => {
    setEditingJob(job);
    setIsEditModalOpen(true);
  };

  const handleViewJobDetails = (job: JobApplication) => {
    setSelectedJob(job);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedJob(null);
    setIsDetailsModalOpen(false);
  };

  const handleEditFromDetails = (job: JobApplication) => {
    setIsDetailsModalOpen(false);
    setEditingJob(job);
    setIsEditModalOpen(true);
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      status: [],
      dateRange: { from: null, to: null },
      sortBy: 'dateApplied',
      sortOrder: 'desc',
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar 
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            onAddJob={() => setIsAddModalOpen(true)}
            activeView={currentView}
            onViewChange={setCurrentView}
          />
          
          <main className={cn(
            "flex-1 transition-all duration-300",
            sidebarCollapsed ? "ml-16" : "ml-64"
          )}>
            {currentView === 'dashboard' && (
              <>
                <Header 
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onAddJob={() => setIsAddModalOpen(true)}
                  jobsCount={filteredAndSortedJobs.length}
                  totalJobsCount={jobs.length}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
                
                <FilterBar
                  filters={filters}
                  onFiltersChange={setFilters}
                  onClearFilters={clearAllFilters}
                  totalJobs={jobs.length}
                  filteredJobs={filteredAndSortedJobs.length}
                />
                
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <JobDashboard jobs={jobs} />
                      
                      {viewMode === 'table' ? (
                        <JobTable 
                          jobs={filteredAndSortedJobs}
                          onUpdateStatus={updateJobStatus}
                          onDelete={deleteJob}
                          onEdit={handleEditJob}
                          onJobClick={handleViewJobDetails}
                        />
                      ) : (
                        <KanbanBoard 
                          jobs={filteredAndSortedJobs}
                          onUpdateStatus={updateJobStatus}
                          onDelete={deleteJob}
                          onEdit={handleEditJob}
                          onJobClick={handleViewJobDetails}
                        />
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {currentView === 'email' && (
              <div className="p-6">
                <EmailIntegrationDashboard onJobsUpdated={refreshJobs} />
              </div>
            )}

            {currentView === 'calendar' && (
              <div className="p-6">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-semibold mb-4">Calendar View</h2>
                  <p className="text-muted-foreground">Calendar integration coming soon!</p>
                </div>
              </div>
            )}

            {currentView === 'settings' && (
              <div className="p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Settings</h2>
                    <p className="text-muted-foreground mb-6">
                      Manage your JobTracker preferences and data cleanup tools.
                    </p>
                  </div>
                  
                  <JobCleanupTool />
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-2">More Settings</h3>
                    <p className="text-muted-foreground">Additional settings panels coming soon!</p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        <AddJobModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSubmit={addJob}
        />

        <EditJobModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSubmit={editJob}
          job={editingJob}
        />

        <JobDetailsModal
          job={selectedJob}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          onEdit={handleEditFromDetails}
        />
      </div>
    </ProtectedRoute>
  );
}