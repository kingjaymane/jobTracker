'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Scan, 
  Settings, 
  Calendar, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Users,
  AlertCircle
} from 'lucide-react';
import { useEmailIntegration } from '@/contexts/EmailIntegrationContext';
import { format } from 'date-fns';

interface EmailIntegrationDashboardProps {
  className?: string;
  onJobsUpdated?: () => Promise<void>;
}

export function EmailIntegrationDashboard({ className, onJobsUpdated }: EmailIntegrationDashboardProps) {
  const {
    isEmailConnected,
    isScanning,
    lastScanDate,
    scanStats,
    connectEmail,
    disconnectEmail,
    scanEmails,
    autoScanEnabled,
    setAutoScanEnabled,
  } = useEmailIntegration();

  // Wrapper function to handle scanning and refreshing the job list
  const handleScanEmails = async () => {
    try {
      await scanEmails();
      // After scanning is complete, refresh the job list on the main page
      if (onJobsUpdated) {
        console.log('Refreshing job list after email scan...');
        await onJobsUpdated();
      }
    } catch (error) {
      console.error('Error during email scan:', error);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Email Integration</h2>
            <p className="text-muted-foreground">
              Automatically track job applications from your email inbox
            </p>
          </div>
          <Badge 
            variant={isEmailConnected ? 'default' : 'secondary'}
            className="flex items-center gap-2"
          >
            <Mail className="h-3 w-3" />
            {isEmailConnected ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>

        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Email Connection
            </CardTitle>
            <CardDescription>
              Connect your Gmail account to automatically scan for job applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEmailConnected ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Connect Your Email</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Automatically scan your Gmail inbox for job application emails
                  </p>
                  <Button onClick={connectEmail} className="mt-4">
                    Connect Gmail
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Gmail connected successfully</span>
                  </div>
                  <Button variant="outline" onClick={disconnectEmail}>
                    Disconnect
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-scan">Automatic Scanning</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically scan for new job emails every hour
                    </p>
                  </div>
                  <Switch
                    id="auto-scan"
                    checked={autoScanEnabled}
                    onCheckedChange={setAutoScanEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Manual Scan</p>
                    <p className="text-sm text-muted-foreground">
                      Scan your inbox now for job-related emails
                    </p>
                  </div>
                  <Button 
                    onClick={handleScanEmails} 
                    disabled={isScanning}
                    className="flex items-center gap-2"
                  >
                    <Scan className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
                    {isScanning ? 'Scanning...' : 'Scan Now'}
                  </Button>
                </div>

                {lastScanDate && (
                  <div className="text-sm text-muted-foreground">
                    Last scan: {format(lastScanDate, 'PPp')}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        {isEmailConnected && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Emails Scanned</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanStats.totalEmails}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Job Emails Found</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanStats.jobEmailsFound}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Jobs Added</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanStats.newJobsAdded}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scanStats.totalEmails > 0 
                    ? Math.round((scanStats.jobEmailsFound / scanStats.totalEmails) * 100)
                    : 0
                  }%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>How Email Integration Works</CardTitle>
            <CardDescription>
              Automatic job application tracking from your email inbox
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">✅ Offers</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Detects job offers and congratulatory emails
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium">❌ Rejections</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Identifies rejection emails and updates status
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">🕒 Interviews</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Finds interview invitations and scheduling emails
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">⏳ No Response</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tracks applications with no response (ghosted)
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h4 className="font-medium">What gets automatically tracked:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Company name and job title extraction</li>
                <li>• Application confirmation emails</li>
                <li>• Interview scheduling and updates</li>
                <li>• Offer letters and compensation details</li>
                <li>• Rejection notifications</li>
                <li>• Follow-up reminders for stale applications</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
