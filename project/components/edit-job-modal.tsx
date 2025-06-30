'use client';

import { useState, useEffect } from 'react';
import { JobApplication } from '@/app/page';
import { parseDateFromStorage, formatDateForStorage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EditJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, updates: Partial<JobApplication>) => void;
  job: JobApplication | null;
}

export function EditJobModal({ open, onOpenChange, onSubmit, job }: EditJobModalProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobLink: '',
    status: 'applied' as JobApplication['status'],
    dateApplied: '',
    notes: '',
    companyLogo: '',
    resume: '',
  });

  // Populate form when job changes
  useEffect(() => {
    if (job) {
      setFormData({
        companyName: job.companyName || '',
        jobTitle: job.jobTitle || '',
        jobLink: job.jobLink || '',
        status: job.status || 'applied',
        dateApplied: job.dateApplied || '',
        notes: job.notes || '',
        companyLogo: job.companyLogo || '',
        resume: job.resume || '',
      });
    }
  }, [job]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    // Only include fields that have changed
    const updates: Partial<JobApplication> = {};
    
    if (formData.companyName !== job.companyName) updates.companyName = formData.companyName;
    if (formData.jobTitle !== job.jobTitle) updates.jobTitle = formData.jobTitle;
    if (formData.jobLink !== job.jobLink) updates.jobLink = formData.jobLink;
    if (formData.status !== job.status) updates.status = formData.status;
    if (formData.dateApplied !== job.dateApplied) updates.dateApplied = formData.dateApplied;
    if (formData.notes !== job.notes) updates.notes = formData.notes;
    if (formData.companyLogo !== job.companyLogo) updates.companyLogo = formData.companyLogo;
    if (formData.resume !== job.resume) updates.resume = formData.resume;

    onSubmit(job.id, updates);
    onOpenChange(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Job Application</DialogTitle>
          <DialogDescription>
            Update the details of your job application.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company Name</Label>
              <Input
                id="edit-company"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Job Title</Label>
              <Input
                id="edit-title"
                value={formData.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                placeholder="Enter job title"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-link">Job Link</Label>
            <Input
              id="edit-link"
              type="url"
              value={formData.jobLink}
              onChange={(e) => handleChange('jobLink', e.target.value)}
              placeholder="https://company.com/jobs/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="ghosted">Ghosted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Date Applied</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.dateApplied}
                onChange={(e) => handleChange('dateApplied', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any notes about this application..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-logo">Company Logo URL</Label>
              <Input
                id="edit-logo"
                type="url"
                value={formData.companyLogo}
                onChange={(e) => handleChange('companyLogo', e.target.value)}
                placeholder="https://company.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-resume">Resume URL</Label>
              <Input
                id="edit-resume"
                type="url"
                value={formData.resume}
                onChange={(e) => handleChange('resume', e.target.value)}
                placeholder="Link to resume used"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
