'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export function AuthChecker() {
  const { user } = useAuth();
  const [authDetails, setAuthDetails] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setAuthDetails({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'N/A'
      });
    } else {
      setAuthDetails(null);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const checkAuthState = () => {
    console.log('Current auth state:', {
      user: user ? 'Present' : 'Not present',
      uid: user?.uid,
      email: user?.email
    });
  };

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">❌ Not Authenticated</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">You are not signed in. Please sign in to test document operations.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-green-200">
      <CardHeader>
        <CardTitle className="text-green-600">✅ Authentication Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <p><strong>User ID:</strong> {authDetails?.uid?.substring(0, 12)}...</p>
          <p><strong>Email:</strong> {authDetails?.email}</p>
          <p><strong>Name:</strong> {authDetails?.displayName}</p>
        </div>
        
        <div className="space-y-2">
          <Button
            onClick={checkAuthState}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Check Auth State (see console)
          </Button>
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Sign Out & Re-authenticate
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <p><strong>Next Step:</strong> If you see this green box, authentication is working. The permission error is likely due to Firebase rules not being deployed yet.</p>
        </div>
      </CardContent>
    </Card>
  );
}
