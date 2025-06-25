'use client';

import { useState } from 'react';
import { FilterState } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  Filter, 
  CalendarIcon, 
  X, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  totalJobs: number;
  filteredJobs: number;
}

const statusOptions = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-orange-500' },
  { value: 'ghosted', label: 'Ghosted', color: 'bg-gray-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'offered', label: 'Offered', color: 'bg-green-500' },
];

const sortOptions = [
  { value: 'dateApplied', label: 'Date Applied' },
  { value: 'companyName', label: 'Company Name' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'status', label: 'Status' },
];

export function FilterBar({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  totalJobs, 
  filteredJobs 
}: FilterBarProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const hasActiveFilters = 
    filters.search || 
    filters.status.length > 0 || 
    filters.dateRange.from || 
    filters.dateRange.to;

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    onFiltersChange({
      ...filters,
      status: newStatus,
    });
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    onFiltersChange({
      ...filters,
      sortBy,
    });
  };

  const toggleSortOrder = () => {
    onFiltersChange({
      ...filters,
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        from: range.from || null,
        to: range.to || null,
      },
    });
  };

  const clearDateRange = () => {
    onFiltersChange({
      ...filters,
      dateRange: { from: null, to: null },
    });
  };

  return (
    <div className="border-b border-border bg-card/30 backdrop-blur-sm">
      <div className="p-4 space-y-4">
        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Status
                  {filters.status.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {filters.status.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={filters.status.includes(option.value)}
                    onCheckedChange={() => handleStatusToggle(option.value)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${option.color}`} />
                      <span>{option.label}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date Range Filter */}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Date Range
                  {(filters.dateRange.from || filters.dateRange.to) && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      1
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Select Date Range</h4>
                    {(filters.dateRange.from || filters.dateRange.to) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDateRange}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {(filters.dateRange.from || filters.dateRange.to) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {filters.dateRange.from && format(filters.dateRange.from, 'MMM dd, yyyy')}
                      {filters.dateRange.from && filters.dateRange.to && ' - '}
                      {filters.dateRange.to && format(filters.dateRange.to, 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
                <Calendar
                  mode="range"
                  selected={{
                    from: filters.dateRange.from || undefined,
                    to: filters.dateRange.to || undefined,
                  }}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>

            {/* Sort Controls */}
            <div className="flex items-center space-x-1">
              <Select value={filters.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="px-2"
              >
                {filters.sortOrder === 'asc' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            
            {filters.status.map((status) => {
              const statusOption = statusOptions.find(opt => opt.value === status);
              return (
                <Badge key={status} variant="secondary" className="gap-1">
                  <div className={`w-2 h-2 rounded-full ${statusOption?.color}`} />
                  {statusOption?.label}
                  <button
                    onClick={() => handleStatusToggle(status)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            
            {(filters.dateRange.from || filters.dateRange.to) && (
              <Badge variant="secondary" className="gap-1">
                <CalendarIcon className="h-3 w-3" />
                {filters.dateRange.from && format(filters.dateRange.from, 'MMM dd')}
                {filters.dateRange.from && filters.dateRange.to && ' - '}
                {filters.dateRange.to && format(filters.dateRange.to, 'MMM dd')}
                <button
                  onClick={clearDateRange}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            {filteredJobs !== totalJobs ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>
                  Showing {filteredJobs} of {totalJobs} applications
                </span>
              </>
            ) : (
              <span>Showing all {totalJobs} applications</span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <span>Sorted by {sortOptions.find(opt => opt.value === filters.sortBy)?.label}</span>
            <span>({filters.sortOrder === 'asc' ? 'ascending' : 'descending'})</span>
          </div>
        </div>
      </div>
    </div>
  );
}