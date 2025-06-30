'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase,
  TrendingUp, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Target,
  BarChart3
} from 'lucide-react';
import { JobApplication } from '@/app/page';
import { format, subDays, isAfter } from 'date-fns';

interface JobDashboardProps {
  jobs: JobApplication[];
}

export function JobDashboard({ jobs }: JobDashboardProps) {
  const stats = useMemo(() => {
    const total = jobs.length;
    const applied = jobs.filter(job => job.status === 'applied').length;
    const interviewing = jobs.filter(job => job.status === 'interviewing').length;
    const offered = jobs.filter(job => job.status === 'offered').length;
    const rejected = jobs.filter(job => job.status === 'rejected').length;
    const ghosted = jobs.filter(job => job.status === 'ghosted').length;

    // Calculate this week's applications
    const oneWeekAgo = subDays(new Date(), 7);
    const thisWeek = jobs.filter(job => 
      isAfter(new Date(job.dateApplied), oneWeekAgo)
    ).length;

    // Calculate this month's applications
    const oneMonthAgo = subDays(new Date(), 30);
    const thisMonth = jobs.filter(job => 
      isAfter(new Date(job.dateApplied), oneMonthAgo)
    ).length;

    // Auto-imported vs manual
    const autoImported = jobs.filter(job => job.autoImported).length;
    const manual = total - autoImported;

    // Success rate (offers / total applications)
    const successRate = total > 0 ? (offered / total) * 100 : 0;

    // Response rate (not ghosted / total)
    const responseRate = total > 0 ? ((total - ghosted) / total) * 100 : 0;

    return {
      total,
      applied,
      interviewing,
      offered,
      rejected,
      ghosted,
      thisWeek,
      thisMonth,
      autoImported,
      manual,
      successRate,
      responseRate
    };
  }, [jobs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'offered': return 'bg-green-500';
      case 'interviewing': return 'bg-blue-500';
      case 'applied': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'ghosted': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              📊 Applications Sent: {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              New applications sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Offers received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Companies responded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Application Status Breakdown</CardTitle>
          <CardDescription>
            Current status of all your job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { status: 'offered', count: stats.offered, label: '✅ Offers', color: 'bg-green-500' },
              { status: 'interviewing', count: stats.interviewing, label: '🕒 Interviewing', color: 'bg-blue-500' },
              { status: 'applied', count: stats.applied, label: '📝 Applied', color: 'bg-yellow-500' },
              { status: 'rejected', count: stats.rejected, label: '❌ Rejected', color: 'bg-red-500' },
              { status: 'ghosted', count: stats.ghosted, label: '⏳ Ghosted', color: 'bg-gray-500' }
            ].map(({ status, count, label, color }) => (
              <div key={status} className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                  <Progress 
                    value={stats.total > 0 ? (count / stats.total) * 100 : 0} 
                    className="h-2 mt-1"
                  />
                </div>
                <div className="text-sm text-muted-foreground w-12 text-right">
                  {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Integration Stats */}
      {stats.autoImported > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Email Integration Impact</CardTitle>
            <CardDescription>
              Applications tracked through email scanning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto-Imported</span>
                  <Badge variant="secondary">{stats.autoImported}</Badge>
                </div>
                <Progress 
                  value={stats.total > 0 ? (stats.autoImported / stats.total) * 100 : 0} 
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Manual Entry</span>
                  <Badge variant="outline">{stats.manual}</Badge>
                </div>
                <Progress 
                  value={stats.total > 0 ? (stats.manual / stats.total) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
          <CardDescription>
            Recent activity and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.thisWeek}</div>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.thisMonth}</div>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
                <p className="text-sm text-muted-foreground">All Time</p>
              </div>
            </div>
            
            {jobs.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Latest application: {format(new Date(Math.max(...jobs.map(j => new Date(j.dateApplied).getTime()))), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
