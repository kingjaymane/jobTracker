'use client';

import { JobApplication } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  StickyNote
} from 'lucide-react';
import { format } from 'date-fns';

interface KanbanBoardProps {
  jobs: JobApplication[];
  onUpdateStatus: (id: string, status: JobApplication['status']) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  applied: { color: 'bg-blue-500', label: 'Applied', textColor: 'text-blue-600' },
  interviewing: { color: 'bg-orange-500', label: 'Interviewing', textColor: 'text-orange-600' },
  ghosted: { color: 'bg-gray-500', label: 'Ghosted', textColor: 'text-gray-600' },
  rejected: { color: 'bg-red-500', label: 'Rejected', textColor: 'text-red-600' },
  offered: { color: 'bg-green-500', label: 'Offered', textColor: 'text-green-600' },
};

export function KanbanBoard({ jobs, onUpdateStatus, onDelete }: KanbanBoardProps) {
  const columns = Object.keys(statusConfig) as JobApplication['status'][];

  const getJobsForStatus = (status: JobApplication['status']) => {
    return jobs.filter(job => job.status === status);
  };

  const JobCard = ({ job }: { job: JobApplication }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{job.companyName}</h4>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
        
        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{job.jobTitle}</h3>
        
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
      </CardContent>
    </Card>
  );

  return (
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
                  <Badge variant="secondary" className="text-xs">
                    {jobsInColumn.length}
                  </Badge>
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
  );
}