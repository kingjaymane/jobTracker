'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { clientEmailService, EmailAuthCredentials, JobApplicationEmail } from '../lib/client-email';
import { addJobApplication, getJobApplications } from '../lib/firestore';
import { formatDateForStorage } from '../lib/utils';
import { toast } from '../hooks/use-toast';

interface EmailIntegrationContextType {
  isEmailConnected: boolean;
  isScanning: boolean;
  lastScanDate: Date | null;
  scanStats: {
    totalEmails: number;
    jobEmailsFound: number;
    newJobsAdded: number;
  };
  connectEmail: () => Promise<void>;
  disconnectEmail: () => Promise<void>;
  scanEmails: () => Promise<void>;
  autoScanEnabled: boolean;
  setAutoScanEnabled: (enabled: boolean) => void;
}

const EmailIntegrationContext = createContext<EmailIntegrationContextType | undefined>(undefined);

interface EmailIntegrationProviderProps {
  children: ReactNode;
}

export function EmailIntegrationProvider({ children }: EmailIntegrationProviderProps) {
  const { user } = useAuth();
  const [isEmailConnected, setIsEmailConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanDate, setLastScanDate] = useState<Date | null>(null);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [scanStats, setScanStats] = useState({
    totalEmails: 0,
    jobEmailsFound: 0,
    newJobsAdded: 0
  });

  const loadEmailSettings = useCallback(async () => {
    try {
      const credentials = localStorage.getItem(`email_credentials_${user?.uid}`);
      const lastScan = localStorage.getItem(`last_scan_${user?.uid}`);
      const autoScan = localStorage.getItem(`auto_scan_${user?.uid}`);

      if (credentials) {
        const parsedCredentials = JSON.parse(credentials);
        // Store credentials for later use - no need to "set" them on client side
        setIsEmailConnected(true);
      }

      if (lastScan) {
        setLastScanDate(new Date(lastScan));
      }

      if (autoScan) {
        setAutoScanEnabled(JSON.parse(autoScan));
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user) {
      loadEmailSettings();
    }
  }, [user, loadEmailSettings]);

  const connectEmail = async () => {
    try {
      const authUrl = await clientEmailService.getAuthUrl();
      
      // Open popup for OAuth
      const popup = window.open(
        authUrl,
        'gmail-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        console.error('Failed to open popup - likely blocked by browser');
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
        return;
      }

      // Listen for the OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data.type === 'GMAIL_AUTH_SUCCESS') {
          const { code } = event.data;
          
          popup?.close();
          
          try {
            const credentials = await clientEmailService.getTokenFromCode(code);
            console.log('Token exchange successful:', {
              access_token: credentials.access_token ? 'present' : 'missing',
              refresh_token: credentials.refresh_token ? 'present' : 'missing'
            });
            
            // Store credentials securely
            localStorage.setItem(
              `email_credentials_${user?.uid}`,
              JSON.stringify(credentials)
            );
            
            setIsEmailConnected(true);
            
            toast({
              title: "Email Connected",
              description: "Gmail integration setup successfully!",
            });
          } catch (error) {
            console.error('Error exchanging code for tokens:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast({
              title: "Connection Failed",
              description: `Failed to connect to Gmail: ${errorMessage}`,
              variant: "destructive",
            });
          }
        } else if (event.data.type === 'GMAIL_AUTH_ERROR') {
          const { error } = event.data;
          popup?.close();
          console.error('OAuth error from popup:', error);
          
          let userFriendlyMessage = 'Failed to connect to Gmail.';
          if (error === 'access_denied') {
            userFriendlyMessage = 'Access denied. Please make sure you grant permission to access your Gmail.';
          } else if (error.includes('redirect_uri_mismatch')) {
            userFriendlyMessage = 'Configuration error. Please check the redirect URI setup.';
          }
          
          toast({
            title: "Connection Failed",
            description: userFriendlyMessage,
            variant: "destructive",
          });
        } else {
          console.log('Unknown message type received:', event.data);
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Cleanup listener when popup closes
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
        }
      }, 1000);

    } catch (error) {
      console.error('=== Email Connection Error ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Full error:', error);
      
      let errorMessage = 'Unknown error occurred';
      let description = 'Please check the console for more details.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('API route not found')) {
          description = 'The server may not be running or configured correctly. Please restart the development server.';
        } else if (error.message.includes('not valid JSON')) {
          description = 'The API returned HTML instead of JSON. Check if the server is running and environment variables are set.';
        } else if (error.message.includes('Failed to fetch')) {
          description = 'Network error. Make sure the development server is running on port 3000.';
        }
      }
      
      toast({
        title: "Gmail Connection Failed",
        description: `${errorMessage}. ${description}`,
        variant: "destructive",
      });
    }
  };

  const disconnectEmail = async () => {
    try {
      localStorage.removeItem(`email_credentials_${user?.uid}`);
      localStorage.removeItem(`last_scan_${user?.uid}`);
      localStorage.removeItem(`auto_scan_${user?.uid}`);
      
      setIsEmailConnected(false);
      setLastScanDate(null);
      setAutoScanEnabled(false);
      setScanStats({ totalEmails: 0, jobEmailsFound: 0, newJobsAdded: 0 });
      
      toast({
        title: "Email Disconnected",
        description: "Gmail integration has been disabled.",
      });
    } catch (error) {
      console.error('Error disconnecting email:', error);
    }
  };

  const scanEmails = async () => {
    if (!user || !isEmailConnected || isScanning) return;

    setIsScanning(true);
    
    try {
      toast({
        title: "Scanning Emails",
        description: "Analyzing your inbox for job applications...",
      });

      // Get stored credentials
      const credentialsString = localStorage.getItem(`email_credentials_${user.uid}`);
      if (!credentialsString) {
        throw new Error('No email credentials found');
      }
      
      const credentials = JSON.parse(credentialsString);
      
      // Scan emails using the API
      const scanResult = await clientEmailService.scanEmails(credentials);
      
      let newJobsAdded = 0;
      
      // Add new job applications to Firestore
      for (const jobApp of scanResult.jobApplications) {
        try {
          // Check if we've already processed this email
          const existingJobs = await getJobApplications(user.uid);
          const alreadyExists = existingJobs.some((job: any) => 
            job.emailMessageId === jobApp.messageId
          );
          
          if (!alreadyExists) {
            await addJobApplication({
              companyName: jobApp.company,
              jobTitle: jobApp.jobTitle,
              status: jobApp.status,
              dateApplied: formatDateForStorage(jobApp.date),
              source: 'Email Auto-Import',
              notes: `Auto-imported from email: ${jobApp.emailSubject}\nFrom: ${jobApp.emailFrom}\nConfidence: ${Math.round(jobApp.confidence * 100)}%`,
              emailMessageId: jobApp.messageId,
              emailThreadId: jobApp.threadId,
              emailSubject: jobApp.emailSubject,
              emailFrom: jobApp.emailFrom,
              autoImported: true,
              confidence: jobApp.confidence,
              isNew: true // Mark as new for visual indicator
            }, user.uid);
            
            newJobsAdded++;
          }
        } catch (error) {
          console.error('Error adding job from email:', error);
        }
      }
      
      // Update statistics
      setScanStats({
        totalEmails: scanResult.totalEmails,
        jobEmailsFound: scanResult.jobEmailsFound,
        newJobsAdded
      });
      
      setLastScanDate(new Date());
      localStorage.setItem(`last_scan_${user.uid}`, new Date().toISOString());
      
      toast({
        title: "Scan Complete",
        description: `Found ${scanResult.jobEmailsFound} job-related emails, added ${newJobsAdded} new applications.`,
      });
      
    } catch (error) {
      console.error('Error scanning emails:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to scan emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const updateAutoScanEnabled = (enabled: boolean) => {
    setAutoScanEnabled(enabled);
    if (user) {
      localStorage.setItem(`auto_scan_${user.uid}`, JSON.stringify(enabled));
    }
  };

  const value = {
    isEmailConnected,
    isScanning,
    lastScanDate,
    scanStats,
    connectEmail,
    disconnectEmail,
    scanEmails,
    autoScanEnabled,
    setAutoScanEnabled: updateAutoScanEnabled,
  };

  return (
    <EmailIntegrationContext.Provider value={value}>
      {children}
    </EmailIntegrationContext.Provider>
  );
}

export function useEmailIntegration() {
  const context = useContext(EmailIntegrationContext);
  if (context === undefined) {
    throw new Error('useEmailIntegration must be used within an EmailIntegrationProvider');
  }
  return context;
}
