'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

export function StorageDebug() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testStorageConnection = async () => {
    if (!user?.uid) {
      setTestResult('❌ No user authenticated');
      return;
    }

    setIsLoading(true);
    setTestResult('Testing Firebase Storage connection...');

    try {
      // Test 1: Create a reference
      setTestResult(prev => prev + '\n📁 Creating storage reference...');
      const testRef = ref(storage, `test/${user.uid}/test.txt`);
      setTestResult(prev => prev + `\n✅ Reference created: ${testRef.fullPath}`);

      // Test 2: Create a tiny test file
      setTestResult(prev => prev + '\n📝 Creating test file...');
      const testData = new Blob(['Hello Firebase Storage!'], { type: 'text/plain' });
      const testFile = new File([testData], 'test.txt', { type: 'text/plain' });
      setTestResult(prev => prev + `\n✅ Test file created: ${testFile.size} bytes`);

      // Test 3: Upload without any metadata
      setTestResult(prev => prev + '\n⬆️ Uploading test file (no metadata)...');
      const snapshot = await uploadBytes(testRef, testFile);
      setTestResult(prev => prev + `\n✅ Upload successful: ${snapshot.ref.fullPath}`);

      // Test 4: Get download URL
      setTestResult(prev => prev + '\n🔗 Getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      setTestResult(prev => prev + `\n✅ Download URL obtained: ${downloadURL.substring(0, 50)}...`);

      setTestResult(prev => prev + '\n\n🎉 All storage tests passed!');
      setTestResult(prev => prev + '\n\n💡 Firebase Storage is working correctly.');
      setTestResult(prev => prev + '\nThe issue may be with large files or specific file types.');

    } catch (error) {
      console.error('Storage test error:', error);
      setTestResult(prev => prev + `\n❌ Storage test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (error instanceof Error) {
        if (error.message.includes('storage/unauthorized')) {
          setTestResult(prev => prev + '\n\n🔧 Solution: Deploy Storage rules in Firebase Console');
        } else if (error.message.includes('storage/retry-limit-exceeded')) {
          setTestResult(prev => prev + '\n\n🔧 Solution: Check internet connection or try again later');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testWithActualFile = async () => {
    if (!user?.uid) {
      setTestResult('❌ No user authenticated');
      return;
    }

    // Create a file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt,.jpg,.png';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsLoading(true);
      setTestResult(`Testing upload with actual file: ${file.name} (${Math.round(file.size / 1024)}KB)`);

      try {
        // Use the most basic upload possible
        const timestamp = Date.now();
        const testRef = ref(storage, `debug/${user.uid}/${timestamp}_${file.name}`);
        
        setTestResult(prev => prev + '\n⬆️ Uploading actual file...');
        const snapshot = await uploadBytes(testRef, file);
        
        setTestResult(prev => prev + '\n🔗 Getting download URL...');
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        setTestResult(prev => prev + `\n✅ SUCCESS! File uploaded: ${downloadURL.substring(0, 50)}...`);
        
        toast({
          title: "Upload Success!",
          description: `${file.name} uploaded successfully`,
        });

      } catch (error) {
        console.error('Actual file upload error:', error);
        setTestResult(prev => prev + `\n❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    input.click();
  };

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Storage Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please sign in to test storage.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Firebase Storage Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={testStorageConnection}
            disabled={isLoading}
            variant="outline"
          >
            Test Storage Connection
          </Button>
          
          <Button 
            onClick={testWithActualFile}
            disabled={isLoading}
            variant="outline"
          >
            Test With Your File
          </Button>
        </div>

        {testResult && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Debug Results:</h4>
            <pre className="whitespace-pre-wrap text-sm font-mono text-gray-700">
              {testResult}
            </pre>
          </div>
        )}

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <p><strong>What this tests:</strong></p>
          <ul className="list-disc ml-4 mt-1">
            <li>Firebase Storage connection and authentication</li>
            <li>Basic file upload capability</li>
            <li>Storage rules permissions</li>
            <li>Network connectivity to Firebase</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
