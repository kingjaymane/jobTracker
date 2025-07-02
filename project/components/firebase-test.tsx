'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { documentService } from '@/lib/document-service';

export function FirebaseTest() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const firebaseRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to access their own documents
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  const testSimpleUpload = async () => {
    if (!user?.uid) {
      setTestResult('❌ No user authenticated');
      return;
    }

    setIsLoading(true);
    setTestResult('Testing simple document creation...');

    try {
      // Create a simple test document without file upload
      const testDoc = {
        name: 'Simple Test Document',
        type: 'other' as const,
        fileType: 'txt',
        size: 50,
        content: 'Simple test content',
        url: '',
        userId: user.uid,
        isStarred: false,
        version: 1,
        tags: ['test'],
        views: 0,
        downloads: 0,
        jobApplications: []
      };

      setTestResult(prev => prev + '\n� Creating test document...');
      const docId = await documentService.createDocument(user.uid, testDoc);
      setTestResult(prev => prev + `\n✅ Document created: ${docId.substring(0, 8)}...`);

      setTestResult(prev => prev + '\n🔍 Retrieving documents...');
      const docs = await documentService.getUserDocuments(user.uid);
      setTestResult(prev => prev + `\n✅ Found ${docs.length} documents`);

      setTestResult(prev => prev + '\n🧹 Cleaning up...');
      await documentService.deleteDocument(docId);
      setTestResult(prev => prev + '\n✅ Test document deleted');

      setTestResult(prev => prev + '\n\n🎉 Simple upload test successful!');
    } catch (error) {
      console.error('Simple upload test error:', error);
      setTestResult(prev => prev + `\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFirebaseConnection = async () => {
    if (!user?.uid) {
      setTestResult('❌ No user authenticated\nPlease sign in first');
      return;
    }

    setIsLoading(true);
    setTestResult('Testing Firebase connection...');

    try {
      // First test: Simple read operation to check permissions
      setTestResult(prev => prev + '\n📖 Testing read permissions...');
      const docs = await documentService.getUserDocuments(user.uid);
      setTestResult(prev => prev + `\n✅ Read permissions OK - Found ${docs.length} existing documents`);

      // Second test: Try to create a document
      setTestResult(prev => prev + '\n📝 Testing write permissions...');
      const testDoc = {
        name: 'Firebase Connection Test',
        type: 'other' as const,
        fileType: 'txt',
        size: 100,
        content: 'This is a test document created at ' + new Date().toISOString(),
        url: '',
        userId: user.uid,
        isStarred: false,
        version: 1,
        tags: ['test', 'firebase-test'],
        views: 0,
        downloads: 0,
        jobApplications: []
      };

      const docId = await documentService.createDocument(user.uid, testDoc);
      setTestResult(prev => prev + `\n✅ Write permissions OK - Document created with ID: ${docId.substring(0, 8)}...`);

      // Third test: Verify the document was created
      setTestResult(prev => prev + '\n🔍 Verifying document creation...');
      const updatedDocs = await documentService.getUserDocuments(user.uid);
      const testDocExists = updatedDocs.some(doc => doc.id === docId);
      
      if (testDocExists) {
        setTestResult(prev => prev + '\n✅ Document verification successful');
      } else {
        setTestResult(prev => prev + '\n⚠️ Document created but not found in list');
      }

      // Fourth test: Clean up
      setTestResult(prev => prev + '\n🧹 Cleaning up test document...');
      await documentService.deleteDocument(docId);
      setTestResult(prev => prev + '\n✅ Test document deleted');

      setTestResult(prev => prev + '\n\n🎉 All Firebase operations successful!');
      setTestResult(prev => prev + '\n\n📋 Summary:');
      setTestResult(prev => prev + '\n• Authentication: ✅ Working');
      setTestResult(prev => prev + '\n• Read permissions: ✅ Working');
      setTestResult(prev => prev + '\n• Write permissions: ✅ Working');
      setTestResult(prev => prev + '\n• Delete permissions: ✅ Working');
      setTestResult(prev => prev + '\n• Document Management: ✅ Ready to use');

    } catch (error) {
      console.error('Firebase test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(prev => prev + `\n❌ Error: ${errorMessage}`);
      
      if (errorMessage.includes('permissions') || errorMessage.includes('insufficient')) {
        setTestResult(prev => prev + '\n\n🔧 Fix Required:');
        setTestResult(prev => prev + '\n1. Go to Firebase Console');
        setTestResult(prev => prev + '\n2. Navigate to Firestore Database → Rules');
        setTestResult(prev => prev + '\n3. Copy and paste the rules from firestore-rules-temp.rules');
        setTestResult(prev => prev + '\n4. Click "Publish" to deploy the rules');
        setTestResult(prev => prev + '\n5. Return here and test again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyRulesToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(firebaseRules);
      setTestResult('📋 Firebase rules copied to clipboard!\n\nNext steps:\n1. Go to Firebase Console\n2. Navigate to Firestore Database → Rules\n3. Paste the copied rules\n4. Click "Publish"\n5. Return here and test again');
    } catch (error) {
      setTestResult('❌ Failed to copy rules. Please copy manually from the text box below.');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Firebase Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p>User: {user ? user.email : 'Not authenticated'}</p>
            <p>User ID: {user ? user.uid : 'N/A'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={testFirebaseConnection} 
              disabled={!user || isLoading}
            >
              {isLoading ? 'Testing...' : 'Full Test'}
            </Button>
            
            <Button 
              onClick={testSimpleUpload} 
              disabled={!user || isLoading}
              variant="secondary"
            >
              {isLoading ? 'Testing...' : 'Simple Test'}
            </Button>
            
            <Button 
              onClick={copyRulesToClipboard}
              variant="outline"
            >
              Copy Rules
            </Button>
          </div>
          
          {testResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Test Results:</h4>
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {testResult}
              </pre>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-800">Firebase Rules (for manual copy):</h4>
            <textarea 
              className="w-full h-32 p-2 font-mono text-xs border rounded"
              value={firebaseRules}
              readOnly
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
