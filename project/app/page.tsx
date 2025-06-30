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
import { BulkActionsToolbar } from '@/components/bulk-actions-toolbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { CheckSquare, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  isNew?: boolean; // Flag for newly imported jobs
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
  const { toast } = useToast();
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

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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

  // Clear selection when view mode changes or filters change
  useEffect(() => {
    // Clear selection when switching away from supported views  
    // (Currently both table and kanban support selection mode)
    setSelectedJobIds(new Set());
  }, [viewMode]);

  useEffect(() => {
    // Clear selection when filters change to avoid selecting jobs that are no longer visible
    setSelectedJobIds(new Set());
  }, [filters]);

  // Auto-clear "new" flags after 24 hours
  useEffect(() => {
    const clearOldNewFlags = async () => {
      if (!user) return;
      
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const jobsToUpdate = jobs.filter(job => 
        job.isNew && 
        job.autoImported && 
        new Date(job.dateApplied) < oneDayAgo
      );
      
      if (jobsToUpdate.length > 0) {
        try {
          // Update jobs in batches
          for (const job of jobsToUpdate) {
            await updateJobApplication(job.id, { isNew: false }, user.uid);
          }
          
          // Update local state
          setJobs(jobs.map(job => 
            jobsToUpdate.some(updateJob => updateJob.id === job.id) 
              ? { ...job, isNew: false }
              : job
          ));
        } catch (error) {
          console.error('Error auto-clearing new flags:', error);
        }
      }
    };
    
    // Run on component mount and then every hour
    clearOldNewFlags();
    const interval = setInterval(clearOldNewFlags, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(interval);
  }, [jobs, user]);

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

  // Bulk selection handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedJobIds(new Set());
  };

  const handleJobSelect = (jobId: string, selected: boolean) => {
    const newSelected = new Set(selectedJobIds);
    if (selected) {
      newSelected.add(jobId);
    } else {
      newSelected.delete(jobId);
    }
    setSelectedJobIds(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allJobIds = new Set(filteredAndSortedJobs.map(job => job.id));
      setSelectedJobIds(allJobIds);
    } else {
      setSelectedJobIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedJobIds.size === 0) return;
    
    setIsBulkDeleting(true);
    try {
      // Delete all selected jobs
      const deletePromises = Array.from(selectedJobIds).map(id => 
        deleteJobApplication(id, user.uid)
      );
      await Promise.all(deletePromises);
      
      // Update local state
      setJobs(jobs.filter(job => !selectedJobIds.has(job.id)));
      setSelectedJobIds(new Set());
      setIsSelectionMode(false);
      
      // Show success toast
      toast({
        title: "Jobs deleted",
        description: `Successfully deleted ${selectedJobIds.size} job${selectedJobIds.size === 1 ? '' : 's'}.`,
      });
    } catch (error) {
      console.error('Error bulk deleting jobs:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedJobIds(new Set());
  };

  // Mark all new jobs as viewed
  const markAllNewAsViewed = async () => {
    if (!user) return;
    
    const newJobs = jobs.filter(job => job.isNew);
    if (newJobs.length === 0) return;
    
    try {
      // Update jobs in batches
      for (const job of newJobs) {
        await updateJobApplication(job.id, { isNew: false }, user.uid);
      }
      
      // Update local state
      setJobs(jobs.map(job => ({ ...job, isNew: false })));
      
      toast({
        title: "Jobs marked as viewed",
        description: `Marked ${newJobs.length} job${newJobs.length === 1 ? '' : 's'} as viewed.`,
      });
    } catch (error) {
      console.error('Error marking jobs as viewed:', error);
      toast({
        title: "Error",
        description: "Failed to mark jobs as viewed. Please try again.",
        variant: "destructive",
      });
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

  const handleViewJobDetails = async (job: JobApplication) => {
    setSelectedJob(job);
    setIsDetailsModalOpen(true);
    
    // Mark job as viewed if it was new
    if (job.isNew && user) {
      try {
        await updateJobApplication(job.id, { isNew: false }, user.uid);
        // Update local state
        setJobs(jobs.map(j => j.id === job.id ? { ...j, isNew: false } : j));
      } catch (error) {
        console.error('Error marking job as viewed:', error);
      }
    }
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
                      
                      {/* Bulk Selection Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {!isSelectionMode ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={toggleSelectionMode}
                              className="flex items-center gap-2"
                            >
                              <CheckSquare className="h-4 w-4" />
                              Select Jobs
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelSelection}
                              className="flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Cancel Selection
                            </Button>
                          )}
                        </div>
                        
                        {/* Mark All New as Viewed */}
                        {!isSelectionMode && jobs.some(job => job.isNew) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllNewAsViewed}
                            className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                          >
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            Mark All New as Viewed ({jobs.filter(job => job.isNew).length})
                          </Button>
                        )}
                      </div>

                      {/* Bulk Actions Toolbar */}
                      {isSelectionMode && (
                        <BulkActionsToolbar
                          selectedCount={selectedJobIds.size}
                          onBulkDelete={handleBulkDelete}
                          onCancel={cancelSelection}
                          isDeleting={isBulkDeleting}
                        />
                      )}
                      
                      {viewMode === 'table' ? (
                        <JobTable 
                          jobs={filteredAndSortedJobs}
                          onUpdateStatus={updateJobStatus}
                          onDelete={deleteJob}
                          onEdit={handleEditJob}
                          onJobClick={handleViewJobDetails}
                          isSelectionMode={isSelectionMode}
                          selectedJobIds={selectedJobIds}
                          onJobSelect={handleJobSelect}
                          onSelectAll={handleSelectAll}
                        />
                      ) : (
                        <KanbanBoard 
                          jobs={filteredAndSortedJobs}
                          onUpdateStatus={updateJobStatus}
                          onDelete={deleteJob}
                          onEdit={handleEditJob}
                          onJobClick={handleViewJobDetails}
                          isSelectionMode={isSelectionMode}
                          selectedJobIds={selectedJobIds}
                          onJobSelect={handleJobSelect}
                          onSelectAll={handleSelectAll}
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
          onDelete={loadJobs}
        />
      </div>
    </ProtectedRoute>
  );
}