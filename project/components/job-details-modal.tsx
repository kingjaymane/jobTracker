'use client';

import { useState, useEffect } from 'react';
import { JobApplication } from '@/app/page';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2, 
  Calendar, 
  Mail, 
  ExternalLink, 
  StickyNote,
  User,
  Clock,
  Tag,
  Globe,
  Edit,
  Loader2,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { deleteJobApplication } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

interface JobDetailsModalProps {
  job: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (job: JobApplication) => void;
  onDelete?: () => void; // Callback to refresh job list after deletion
}

interface EmailContent {
  subject: string;
  from: string;
  date: string;
  body: string;
  loading: boolean;
  error?: string;
}

const statusConfig = {
  applied: { color: 'bg-blue-500', label: 'Applied', textColor: 'text-blue-600' },
  interviewing: { color: 'bg-orange-500', label: 'Interviewing', textColor: 'text-orange-600' },
  ghosted: { color: 'bg-gray-500', label: 'Ghosted', textColor: 'text-gray-600' },
  rejected: { color: 'bg-red-500', label: 'Rejected', textColor: 'text-red-600' },
  offered: { color: 'bg-green-500', label: 'Offered', textColor: 'text-green-600' },
};

// Helper function to strip HTML tags and decode HTML entities
const stripHtml = (html: string) => {
  // Create a temporary div to parse HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Helper function to format email body for display
const formatEmailBody = (body: string) => {
  // Strip HTML tags
  let cleanBody = stripHtml(body);
  
  // Remove excessive whitespace and newlines
  cleanBody = cleanBody.replace(/\s+/g, ' ').trim();
  
  // Limit length for display
  if (cleanBody.length > 1000) {
    cleanBody = cleanBody.substring(0, 1000) + '...';
  }
  
  return cleanBody;
};

export function JobDetailsModal({ job, isOpen, onClose, onEdit, onDelete }: JobDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailContent, setEmailContent] = useState<EmailContent>({
    subject: '',
    from: '',
    date: '',
    body: '',
    loading: false
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch email content when modal opens for auto-imported jobs
  useEffect(() => {
    const fetchEmailContent = async () => {
      if (!job?.emailMessageId) return;

      setEmailContent(prev => ({ ...prev, loading: true, error: undefined }));

      try {
        // Get stored credentials for the API call
        const storedCredentials = localStorage.getItem(`email_credentials_${user?.uid}`);
        const credentials = storedCredentials ? JSON.parse(storedCredentials) : null;
        
        const response = await fetch('/api/email/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messageId: job.emailMessageId,
            credentials: credentials
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch email content');
        }

        const data = await response.json();
        setEmailContent({
          subject: data.subject || job.emailSubject || 'No subject',
          from: data.from || job.emailFrom || 'Unknown sender',
          date: data.date || '',
          body: data.body || 'Email content not available',
          loading: false
        });
      } catch (error) {
        console.error('Error fetching email content:', error);
        setEmailContent(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load email content',
          subject: job.emailSubject || 'No subject',
          from: job.emailFrom || 'Unknown sender',
          body: 'Could not load email content. You can view the original email in Gmail.'
        }));
      }
    };

    if (isOpen && job?.emailMessageId && job?.autoImported) {
      fetchEmailContent();
    } else {
      // Reset email content when modal closes or job changes
      setEmailContent({
        subject: '',
        from: '',
        date: '',
        body: '',
        loading: false
      });
    }
  }, [isOpen, job?.emailMessageId, job?.autoImported, job?.emailSubject, job?.emailFrom, user?.uid]);

  // Handle job deletion
  const handleDelete = async () => {
    if (!job?.id || !user?.uid) return;
    
    setIsDeleting(true);
    try {
      await deleteJobApplication(job.id, user.uid);
      toast({
        title: "Job deleted",
        description: `${job.jobTitle} at ${job.companyName} has been deleted.`,
      });
      onClose();
      onDelete?.(); // Refresh job list
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete the job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };



  if (!job) return null;

  const getGmailUrl = (messageId: string, threadId?: string) => {
    if (threadId) {
      return `https://mail.google.com/mail/u/0/#inbox/${threadId}`;
    }
    return `https://mail.google.com/mail/u/0/#inbox/${messageId}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <div className="text-xl font-bold">{job.jobTitle}</div>
                <div className="text-sm text-muted-foreground">{job.companyName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`${statusConfig[job.status].color} text-white`}
              >
                {statusConfig[job.status].label}
              </Badge>
              {job.autoImported && (
                <Badge variant="outline" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  Auto-imported
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Applied on {format(new Date(job.dateApplied), 'MMMM dd, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Job Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="h-5 w-5" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Company</label>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{job.companyName}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Position</label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{job.jobTitle}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge 
                      variant="secondary" 
                      className={`${statusConfig[job.status].color} text-white w-fit`}
                    >
                      {statusConfig[job.status].label}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Date Applied</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(job.dateApplied), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>

                {job.jobLink && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Job Posting</label>
                    <a
                      href={job.jobLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      View Job Posting
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {job.resume && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Resume Used</label>
                    <div className="text-sm">{job.resume}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {job.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <StickyNote className="h-5 w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">{job.notes}</div>
                </CardContent>
              </Card>
            )}

            {/* Email Information (for auto-imported jobs) */}
            {job.autoImported && job.emailMessageId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5" />
                    Email Information
                    {emailContent.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {emailContent.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading email content...</span>
                    </div>
                  ) : emailContent.error ? (
                    <div className="text-red-600 text-sm">{emailContent.error}</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">Subject</label>
                          <div className="text-sm font-medium">{emailContent.subject}</div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">From</label>
                          <div className="text-sm">{emailContent.from}</div>
                        </div>
                        {emailContent.date && (
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Date</label>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3" />
                              {format(new Date(emailContent.date), 'MMM dd, yyyy at h:mm a')}
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Email Content</label>
                        <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {formatEmailBody(emailContent.body)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={getGmailUrl(job.emailMessageId, job.emailThreadId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <Mail className="h-4 w-4" />
                            Open in Gmail
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting ? 'Deleting...' : 'Delete Job'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Job Application</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the job application for <strong>{job.jobTitle}</strong> at <strong>{job.companyName}</strong>? 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onEdit(job)} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Job
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
