'use client';

import { useState } from 'react';
import { JobApplication } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
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
  StickyNote,
  Edit,
  Mail
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface JobTableProps {
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
  applied: { color: 'bg-blue-500', label: 'Applied' },
  interviewing: { color: 'bg-orange-500', label: 'Interviewing' },
  ghosted: { color: 'bg-gray-500', label: 'Ghosted' },
  rejected: { color: 'bg-red-500', label: 'Rejected' },
  offered: { color: 'bg-green-500', label: 'Offered' },
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

export function JobTable({ 
  jobs, 
  onUpdateStatus, 
  onDelete, 
  onEdit, 
  onJobClick,
  isSelectionMode = false,
  selectedJobIds = new Set(),
  onJobSelect,
  onSelectAll
}: JobTableProps) {
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
            {isSelectionMode && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedJobIds.size === jobs.length && jobs.length > 0}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all jobs"
                />
              </TableHead>
            )}
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
            <TableRow 
              key={job.id} 
              className={cn(
                "group hover:bg-muted/50 transition-colors cursor-pointer",
                isSelectionMode && selectedJobIds.has(job.id) && "bg-primary/5 border-l-4 border-l-primary"
              )}
              onClick={(e) => {
                // Prevent row click when clicking on checkbox or action buttons
                if (isSelectionMode && e.target instanceof HTMLElement) {
                  if (e.target.closest('[data-checkbox]') || e.target.closest('[data-action-button]')) {
                    return;
                  }
                }
                onJobClick?.(job);
              }}
            >
              {isSelectionMode && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    data-checkbox
                    checked={selectedJobIds.has(job.id)}
                    onCheckedChange={(checked) => onJobSelect?.(job.id, !!checked)}
                    aria-label={`Select ${job.companyName} - ${job.jobTitle}`}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{job.companyName}</span>
                      {job.isNew && (
                        <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold animate-pulse">
                          NEW
                        </Badge>
                      )}
                      {job.autoImported && (
                        <Badge variant="secondary" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          Auto-imported
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {job.jobLink && (
                        <a 
                          href={job.jobLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          View Job <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {job.emailMessageId && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <a 
                                href={getGmailUrl(job.emailMessageId, job.emailThreadId)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                title={`View email: ${job.emailSubject || 'Email'}`}
                              >
                                View Email <Mail className="h-3 w-3" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">View email in Gmail</span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="font-medium">{job.jobTitle}</div>
                  {job.isNew && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  )}
                </div>
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
                <div className="flex items-center gap-2" data-action-button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(job);
                    }}
                    title="Edit job"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(job)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}