'use client';

import { useState } from 'react';
import { JobApplication } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  ExternalLink, 
  Trash2, 
  Building2,
  Calendar,
  StickyNote,
  Edit,
  Mail,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface KanbanBoardProps {
  jobs: JobApplication[];
  onUpdateStatus: (id: string, status: JobApplication['status']) => void;
  onDelete: (id: string) => void;
  onEdit: (job: JobApplication) => void;
  onJobClick?: (job: JobApplication) => void;
  isSelectionMode?: boolean;
  selectedJobIds?: Set<string>;
  onJobSelect?: (jobId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

const statusConfig = {
  applied: { color: 'bg-blue-500', label: 'Applied', textColor: 'text-blue-600' },
  interviewing: { color: 'bg-orange-500', label: 'Interviewing', textColor: 'text-orange-600' },
  ghosted: { color: 'bg-gray-500', label: 'Ghosted', textColor: 'text-gray-600' },
  rejected: { color: 'bg-red-500', label: 'Rejected', textColor: 'text-red-600' },
  offered: { color: 'bg-green-500', label: 'Offered', textColor: 'text-green-600' },
};

// Generate Gmail URL from message ID or thread ID
const getGmailUrl = (messageId: string, threadId?: string) => {
  // Try thread ID first if available, as it's more reliable for Gmail URLs
  if (threadId) {
    return `https://mail.google.com/mail/u/0/#inbox/${threadId}`;
  }
  // Fallback to message ID
  return `https://mail.google.com/mail/u/0/#inbox/${messageId}`;
};

export function KanbanBoard({ 
  jobs, 
  onUpdateStatus, 
  onDelete, 
  onEdit, 
  onJobClick,
  isSelectionMode = false,
  selectedJobIds = new Set(),
  onJobSelect,
  onSelectAll
}: KanbanBoardProps) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const columns = Object.keys(statusConfig) as JobApplication['status'][];

  const getJobsForStatus = (status: JobApplication['status']) => {
    const filteredJobs = jobs.filter(job => job.status === status);
    
    // Sort jobs by date - newest first (most recent additions at top)
    return filteredJobs.sort((a, b) => {
      const dateA = new Date(a.dateApplied || 0);
      const dateB = new Date(b.dateApplied || 0);
      
      if (sortOrder === 'newest') {
        return dateB.getTime() - dateA.getTime(); // Newest first
      } else {
        return dateA.getTime() - dateB.getTime(); // Oldest first
      }
    });
  };

  const JobCard = ({ job }: { job: JobApplication }) => (
    <Card 
      className={cn(
        "mb-3 hover:shadow-md transition-shadow cursor-pointer group",
        isSelectionMode && selectedJobIds.has(job.id) && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={(e) => {
        // Prevent card click when clicking on checkbox or action buttons
        if (isSelectionMode && e.target instanceof HTMLElement) {
          if (e.target.closest('[data-checkbox]') || e.target.closest('[data-action-button]')) {
            return;
          }
        }
        onJobClick?.(job);
      }}
    >
      <CardContent className="p-4">
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className="mb-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              data-checkbox
              checked={selectedJobIds.has(job.id)}
              onCheckedChange={(checked) => onJobSelect?.(job.id, !!checked)}
              aria-label={`Select ${job.companyName} - ${job.jobTitle}`}
            />
          </div>
        )}
        
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{job.companyName}</h4>
                {job.isNew && (
                  <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold animate-pulse">
                    NEW
                  </Badge>
                )}
                {job.autoImported && (
                  <Badge variant="secondary" className="text-xs">
                    <Mail className="h-3 w-3 mr-1" />
                    Auto
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                data-action-button
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(job)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {Object.entries(statusConfig)
                .filter(([status]) => status !== job.status)
                .map(([status, config]) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => onUpdateStatus(job.id, status as JobApplication['status'])}
                  >
                    <div className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
                    Move to {config.label}
                  </DropdownMenuItem>
                ))
              }
              <DropdownMenuItem
                onClick={() => onDelete(job.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-sm line-clamp-2">{job.jobTitle}</h3>
          {job.isNew && (
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse flex-shrink-0"></div>
          )}
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <Calendar className="h-3 w-3 mr-1" />
          {format(new Date(job.dateApplied), 'MMM dd')}
        </div>
        
        {job.notes && (
          <div className="flex items-start text-xs text-muted-foreground mb-2">
            <StickyNote className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{job.notes}</span>
          </div>
        )}
        
        {job.jobLink && (
          <a 
            href={job.jobLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View Job <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        )}

        {job.emailMessageId && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={getGmailUrl(job.emailMessageId, job.emailThreadId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Email <Mail className="h-3 w-3 ml-1" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Open original email in Gmail</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by date:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-2"
          >
            {sortOrder === 'newest' ? (
              <>
                <ArrowDown className="h-4 w-4" />
                Newest First
              </>
            ) : (
              <>
                <ArrowUp className="h-4 w-4" />
                Oldest First
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {columns.map((status) => {
        const jobsInColumn = getJobsForStatus(status);
        const config = statusConfig[status];
        
        return (
          <div key={status} className="flex flex-col">
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <span>{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelectionMode && jobsInColumn.length > 0 && (
                      <Checkbox
                        checked={jobsInColumn.every(job => selectedJobIds.has(job.id))}
                        onCheckedChange={(checked) => {
                          jobsInColumn.forEach(job => {
                            onJobSelect?.(job.id, !!checked);
                          });
                        }}
                        aria-label={`Select all jobs in ${config.label}`}
                        className="mr-1"
                      />
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {jobsInColumn.length}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
            
            <div className="flex-1 space-y-3">
              {jobsInColumn.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
              
              {jobsInColumn.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No jobs in this status
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}