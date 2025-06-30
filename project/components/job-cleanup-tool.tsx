import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CleanupJob {
  id: string;
  company: string;
  position: string;
  emailFrom: string;
  emailSubject: string;
  quality: number;
}

interface CleanupAnalysis {
  totalJobs: number;
  emailImports: number;
  toCleanup: number;
  suspicious: number;
  good: number;
}

export function JobCleanupTool() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [analysis, setAnalysis] = useState<CleanupAnalysis | null>(null);
  const [jobsToCleanup, setJobsToCleanup] = useState<CleanupJob[]>([]);
  const [suspiciousJobs, setSuspiciousJobs] = useState<CleanupJob[]>([]);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const testAPI = async () => {
    try {
      setError(null);
      console.log('Testing cleanup API...');
      
      const response = await fetch('/api/jobs/cleanup', {
        method: 'GET'
      });
      
      const data = await response.json();
      console.log('API test results:', data);
      setDiagnostics(data);
      
      if (!data.success) {
        setError(`API test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('API test error:', error);
      setError(`API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const analyzeJobs = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Starting job analysis for user:', user.uid);
      
      const response = await fetch('/api/jobs/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          mode: 'analyze'
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Analysis results:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      setAnalysis(data.analysis);
      setJobsToCleanup(data.jobsToCleanup || []);
      setSuspiciousJobs(data.suspiciousJobs || []);
      
    } catch (error) {
      console.error('Error analyzing jobs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze jobs';
      setError(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cleanupJobs = async () => {
    if (!user) return;
    
    setIsCleaning(true);
    setError(null);
    
    try {
      const response = await fetch('/api/jobs/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          mode: 'cleanup'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cleanup jobs');
      }

      const data = await response.json();
      setCleanupResult(`Successfully cleaned up ${data.deleted} problematic job imports`);
      
      // Reset analysis to show updated state
      setAnalysis(null);
      setJobsToCleanup([]);
      setSuspiciousJobs([]);
    } catch (error) {
      console.error('Error cleaning up jobs:', error);
      setError(error instanceof Error ? error.message : 'Failed to cleanup jobs');
    } finally {
      setIsCleaning(false);
    }
  };

  const getQualityBadge = (quality: number) => {
    if (quality < 3) return <Badge variant="destructive">Poor</Badge>;
    if (quality < 6) return <Badge variant="secondary">Suspicious</Badge>;
    return <Badge variant="default">Good</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Job Import Cleanup Tool
          </CardTitle>
          <CardDescription>
            Remove job board notification emails that were incorrectly imported as job applications.
            This tool uses the improved filtering logic to identify and clean up false positives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {cleanupResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{cleanupResult}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={testAPI} 
              variant="outline"
              size="sm"
            >
              <Search className="h-4 w-4 mr-2" />
              Test API
            </Button>
            
            <Button 
              onClick={analyzeJobs} 
              disabled={isAnalyzing || !user}
              variant="outline"
            >
              <Search className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Job Imports'}
            </Button>

            {analysis && analysis.toCleanup > 0 && (
              <Button 
                onClick={cleanupJobs} 
                disabled={isCleaning || !user}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isCleaning ? 'Cleaning...' : `Clean Up ${analysis.toCleanup} Jobs`}
              </Button>
            )}
          </div>

          {diagnostics && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">API Diagnostics</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </div>
          )}

          {analysis && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis.totalJobs}</div>
                <div className="text-sm text-muted-foreground">Total Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis.emailImports}</div>
                <div className="text-sm text-muted-foreground">Email Imports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analysis.toCleanup}</div>
                <div className="text-sm text-muted-foreground">To Clean Up</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{analysis.suspicious}</div>
                <div className="text-sm text-muted-foreground">Suspicious</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analysis.good}</div>
                <div className="text-sm text-muted-foreground">Good Imports</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {jobsToCleanup.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Jobs to Clean Up ({jobsToCleanup.length})</CardTitle>
            <CardDescription>
              These job imports appear to be from job board notifications and will be deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {jobsToCleanup.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{job.company} - {job.position}</div>
                    <div className="text-sm text-muted-foreground">From: {job.emailFrom}</div>
                    <div className="text-sm text-muted-foreground">Subject: {job.emailSubject}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getQualityBadge(job.quality)}
                    <span className="text-sm text-muted-foreground">Score: {job.quality}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {suspiciousJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Suspicious Jobs ({suspiciousJobs.length})</CardTitle>
            <CardDescription>
              These jobs have moderate quality scores. Review them manually to decide if they should be kept.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {suspiciousJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{job.company} - {job.position}</div>
                    <div className="text-sm text-muted-foreground">From: {job.emailFrom}</div>
                    <div className="text-sm text-muted-foreground">Subject: {job.emailSubject}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getQualityBadge(job.quality)}
                    <span className="text-sm text-muted-foreground">Score: {job.quality}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && analysis.toCleanup === 0 && analysis.suspicious === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Great! No problematic job imports were found. Your email imports appear to be clean.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
