'use client';

import { useState } from 'react';
import { JobApplication } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { 
  MoreHorizontal, 
  ExternalLink, 
  Trash2, 
  Building2,
  Calendar,
  StickyNote
} from 'lucide-react';
import { format } from 'date-fns';

interface JobTableProps {
  jobs: JobApplication[];
  onUpdateStatus: (id: string, status: JobApplication['status']) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  applied: { color: 'bg-blue-500', label: 'Applied' },
  interviewing: { color: 'bg-orange-500', label: 'Interviewing' },
  ghosted: { color: 'bg-gray-500', label: 'Ghosted' },
  rejected: { color: 'bg-red-500', label: 'Rejected' },
  offered: { color: 'bg-green-500', label: 'Offered' },
};

export function JobTable({ jobs, onUpdateStatus, onDelete }: JobTableProps) {
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

  const StatusBadge = ({ status }: { status: JobApplication['status'] }) => (
    <Badge 
      variant="secondary" 
      className={`${statusConfig[status].color} text-white hover:${statusConfig[status].color}/80`}
    >
      {statusConfig[status].label}
    </Badge>
  );

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied Date</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} className="group hover:bg-muted/50 transition-colors">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{job.companyName}</div>
                    {job.jobLink && (
                      <a 
                        href={job.jobLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                      >
                        View Job <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="font-medium">{job.jobTitle}</div>
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="cursor-pointer">
                      <StatusBadge status={job.status} />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => onUpdateStatus(job.id, status as JobApplication['status'])}
                      >
                        <div className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
                        {config.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(job.dateApplied), 'MMM dd, yyyy')}
                </div>
              </TableCell>
              
              <TableCell>
                {job.notes ? (
                  <div className="max-w-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedNotes(
                        expandedNotes === job.id ? null : job.id
                      )}
                      className="p-0 h-auto text-left justify-start"
                    >
                      <StickyNote className="h-4 w-4 mr-1" />
                      <span className="truncate">
                        {expandedNotes === job.id ? job.notes : 
                         job.notes.length > 30 ? `${job.notes.substring(0, 30)}...` : job.notes}
                      </span>
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No notes</span>
                )}
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onDelete(job.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}