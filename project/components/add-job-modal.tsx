'use client';

import { useState } from 'react';
import { JobApplication } from '@/app/page';
import { formatDateForStorage } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (job: Omit<JobApplication, 'id'>) => void;
}

export function AddJobModal({ open, onOpenChange, onSubmit }: AddJobModalProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobLink: '',
    status: 'applied' as JobApplication['status'],
    dateApplied: new Date(),
    notes: '',
    resume: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        companyName: formData.companyName.trim(),
        jobTitle: formData.jobTitle.trim(),
        jobLink: formData.jobLink.trim() || undefined,
        status: formData.status,
        dateApplied: formatDateForStorage(formData.dateApplied),
        notes: formData.notes.trim() || undefined,
        resume: formData.resume.trim() || undefined,
      });
      
      // Reset form
      setFormData({
        companyName: '',
        jobTitle: '',
        jobLink: '',
        status: 'applied',
        dateApplied: new Date(),
        notes: '',
        resume: '',
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Job Application</DialogTitle>
          <DialogDescription>
            Track a new job application by filling out the details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="e.g. Google"
                className={errors.companyName ? 'border-destructive' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="e.g. Frontend Developer"
                className={errors.jobTitle ? 'border-destructive' : ''}
              />
              {errors.jobTitle && (
                <p className="text-sm text-destructive">{errors.jobTitle}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="jobLink">Job Link</Label>
            <Input
              id="jobLink"
              type="url"
              value={formData.jobLink}
              onChange={(e) => handleInputChange('jobLink', e.target.value)}
              placeholder="https://company.com/careers/job-id"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value as JobApplication['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="ghosted">Ghosted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Date Applied</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dateApplied && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateApplied ? (
                      format(formData.dateApplied, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dateApplied}
                    onSelect={(date) => handleInputChange('dateApplied', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resume">Resume Version</Label>
            <Input
              id="resume"
              value={formData.resume}
              onChange={(e) => handleInputChange('resume', e.target.value)}
              placeholder="e.g. Resume_v2.pdf"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes about this application..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Job Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}