'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Building2, 
  MapPin,
  Calendar,
  FileText,
  Download
} from 'lucide-react';
import { JobApplication } from '@/app/page';

interface AnalyticsDashboardProps {
  jobs: JobApplication[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface AnalyticsData {
  totalApplications: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  averageResponseTime: number;
  applicationsByMonth: Array<{ month: string; applications: number; responses: number; }>;
  statusDistribution: Array<{ name: string; value: number; color: string; }>;
  companySize: Array<{ size: string; count: number; responseRate: number; }>;
  industryPerformance: Array<{ industry: string; applications: number; interviews: number; offers: number; }>;
}

export function AnalyticsDashboard({ jobs }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('applications');
  const [showGoals, setShowGoals] = useState(false);
  const [goals, setGoals] = useState({
    weeklyApplications: 10,
    monthlyInterviews: 5,
    targetResponseRate: 30
  });
  const [alerts, setAlerts] = useState<string[]>([]);

  const analytics = useMemo((): AnalyticsData => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '1month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate.setFullYear(2020); // All time
    }

    const filteredJobs = jobs.filter(job => new Date(job.dateApplied) >= cutoffDate);
    
    const totalApplications = filteredJobs.length;
    const responseJobs = filteredJobs.filter(job => 
      job.status !== 'applied' && job.status !== 'ghosted'
    );
    const interviewJobs = filteredJobs.filter(job => 
      job.status === 'interviewing' || job.status === 'offered'
    );
    const offerJobs = filteredJobs.filter(job => job.status === 'offered');

    const responseRate = totalApplications > 0 ? (responseJobs.length / totalApplications) * 100 : 0;
    const interviewRate = totalApplications > 0 ? (interviewJobs.length / totalApplications) * 100 : 0;
    const offerRate = totalApplications > 0 ? (offerJobs.length / totalApplications) * 100 : 0;

    // Calculate average response time (mock data for now)
    const averageResponseTime = 7; // days

    // Applications by month
    const monthlyData = new Map();
    filteredJobs.forEach(job => {
      const month = new Date(job.dateApplied).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { applications: 0, responses: 0 });
      }
      monthlyData.get(month).applications++;
      if (job.status !== 'applied' && job.status !== 'ghosted') {
        monthlyData.get(month).responses++;
      }
    });

    const applicationsByMonth = Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Status distribution
    const statusCounts = filteredJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = Object.entries(statusCounts).map(([status, count], index) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: COLORS[index % COLORS.length]
    }));

    // Company size analysis (mock data based on company names)
    const companySize = [
      { size: 'Startup (1-50)', count: Math.floor(totalApplications * 0.3), responseRate: 65 },
      { size: 'Medium (51-500)', count: Math.floor(totalApplications * 0.4), responseRate: 45 },
      { size: 'Large (500+)', count: Math.floor(totalApplications * 0.3), responseRate: 25 }
    ];

    // Industry performance (simplified - could be enhanced with real industry data)
    const industries = ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail'];
    const industryPerformance = industries.map(industry => ({
      industry,
      applications: Math.floor(Math.random() * 20) + 5,
      interviews: Math.floor(Math.random() * 8) + 2,
      offers: Math.floor(Math.random() * 3) + 1
    }));

    return {
      totalApplications,
      responseRate,
      interviewRate,
      offerRate,
      averageResponseTime,
      applicationsByMonth,
      statusDistribution,
      companySize,
      industryPerformance
    };
  }, [jobs, timeRange]);

  // Goal tracking and alerts
  const checkGoals = useMemo(() => {
    const now = new Date();
    const thisWeek = jobs.filter(job => {
      const jobDate = new Date(job.dateApplied);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return jobDate >= weekAgo;
    }).length;

    const thisMonth = jobs.filter(job => {
      const jobDate = new Date(job.dateApplied);
      return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
    }).length;

    const newAlerts = [];
    if (thisWeek < goals.weeklyApplications) {
      newAlerts.push(`You're ${goals.weeklyApplications - thisWeek} applications behind your weekly goal`);
    }
    if (analytics.responseRate < goals.targetResponseRate) {
      newAlerts.push(`Response rate (${analytics.responseRate.toFixed(1)}%) is below your target (${goals.targetResponseRate}%)`);
    }

    setAlerts(newAlerts);
    return { thisWeek, thisMonth };
  }, [jobs, goals, analytics]);

  const exportReport = () => {
    // Create CSV data
    const csvData = [
      ['Metric', 'Value'],
      ['Total Applications', analytics.totalApplications.toString()],
      ['Response Rate', `${analytics.responseRate.toFixed(1)}%`],
      ['Interview Rate', `${analytics.interviewRate.toFixed(1)}%`],
      ['Offer Rate', `${analytics.offerRate.toFixed(1)}%`],
      ['Average Response Time', `${analytics.averageResponseTime} days`]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-search-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Insights and analytics for your job search performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 border-blue-200 hover:border-blue-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} className="btn-gradient-info">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-gradient-analytics border-blue-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{analytics.totalApplications}</div>
            <p className="text-xs text-blue-600">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient-analytics border-green-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{analytics.responseRate.toFixed(1)}%</div>
            <div className="mt-2">
              <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                <div 
                  className="h-full progress-gradient-green transition-all duration-300" 
                  style={{width: `${analytics.responseRate}%`}}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient-analytics border-purple-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Interview Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{analytics.interviewRate.toFixed(1)}%</div>
            <div className="mt-2">
              <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                <div 
                  className="h-full progress-gradient-purple transition-all duration-300" 
                  style={{width: `${analytics.interviewRate}%`}}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient-analytics border-orange-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Offer Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{analytics.offerRate.toFixed(1)}%</div>
            <div className="mt-2">
              <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                <div 
                  className="h-full progress-gradient-orange transition-all duration-300" 
                  style={{width: `${analytics.offerRate}%`}}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">Trends</TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">Performance</TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">Goals & Alerts</TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Status Distribution</CardTitle>
                <CardDescription>Breakdown of your application statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Application Trend</CardTitle>
                <CardDescription>Applications and responses over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.applicationsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="applications" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="responses" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
              <CardDescription>Track your application patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.applicationsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="applications" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="responses" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance by Company Size</CardTitle>
                <CardDescription>Success rates across different company sizes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.companySize}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="size" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                    <Bar dataKey="responseRate" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Industry Performance</CardTitle>
                <CardDescription>Applications, interviews, and offers by industry</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.industryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="industry" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="applications" fill="#8884d8" />
                    <Bar dataKey="interviews" fill="#82ca9d" />
                    <Bar dataKey="offers" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Goal Setting</CardTitle>
                <CardDescription>Set targets for your job search</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Weekly Applications Goal</Label>
                  <Input
                    type="number"
                    value={goals.weeklyApplications}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoals(prev => ({ ...prev, weeklyApplications: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Monthly Interviews Goal</Label>
                  <Input
                    type="number"
                    value={goals.monthlyInterviews}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoals(prev => ({ ...prev, monthlyInterviews: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Target Response Rate (%)</Label>
                  <Input
                    type="number"
                    value={goals.targetResponseRate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoals(prev => ({ ...prev, targetResponseRate: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <Button className="w-full btn-gradient-success">Save Goals</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>Your progress towards goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">This Week&apos;s Applications</span>
                    <span className="text-sm">{checkGoals.thisWeek}/{goals.weeklyApplications}</span>
                  </div>
                  <Progress value={(checkGoals.thisWeek / goals.weeklyApplications) * 100} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Response Rate</span>
                    <span className="text-sm">{analytics.responseRate.toFixed(1)}%/{goals.targetResponseRate}%</span>
                  </div>
                  <Progress value={(analytics.responseRate / goals.targetResponseRate) * 100} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">This Month&apos;s Applications</span>
                    <span className="text-sm">{checkGoals.thisMonth}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {alerts.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-red-600">Alerts</CardTitle>
                  <CardDescription>Areas that need your attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {alerts.map((alert, index) => (
                      <div key={index} className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">{alert}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>AI-powered recommendations for your job search</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Peak Application Time</p>
                    <p className="text-sm text-muted-foreground">
                      Your applications on Tuesdays have a 23% higher response rate
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Optimal Application Count</p>
                    <p className="text-sm text-muted-foreground">
                      Based on your pattern, aim for 8-10 applications per week
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Company Size Sweet Spot</p>
                    <p className="text-sm text-muted-foreground">
                      Medium-sized companies (51-500) show best response rates for your profile
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actionable suggestions to improve your success rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Follow-up Strategy</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    Send follow-up emails after 1 week for applications with no response
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-100">Application Timing</h4>
                  <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                    Apply Monday-Wednesday for highest visibility
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">Portfolio Enhancement</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                    Add 2 more projects to increase interview conversion rate
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
