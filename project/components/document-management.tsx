'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Share, 
  Star,
  Calendar,
  BarChart3,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Folder,
  File,
  Image,
  BookOpen,
  Award,
  Briefcase,
  Users,
  Mail,
  Clock
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { JobApplication } from '@/app/page';
import { documentService, Document as FirebaseDocument } from '@/lib/document-service';
import { useAuth } from '@/contexts/AuthContext';

interface Document {
  id: string;
  name: string;
  type: 'resume' | 'cover-letter' | 'portfolio' | 'certificate' | 'reference' | 'other';
  fileType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  content?: string;
  url?: string;
  isStarred: boolean;
  version: number;
  templates?: string[];
  jobApplications?: string[]; // Associated job application IDs
  views: number;
  downloads: number;
}

interface DocumentManagementProps {
  jobs: JobApplication[];
}

export function DocumentManagement({ jobs }: DocumentManagementProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDocumentData, setNewDocumentData] = useState({
    name: '',
    type: 'resume' as Document['type'],
    tags: [] as string[],
    content: ''
  });

  // Function to render document preview based on file type
  const renderDocumentPreview = (document: Document) => {
    const fileType = document.fileType.toLowerCase();
    
    if (fileType === 'pdf') {
      return (
        <div className="w-full h-[400px] flex items-center justify-center">
          {document.url ? (
            <iframe 
              src={document.url}
              className="w-full h-full border-0 rounded"
              title={`Preview of ${document.name}`}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4" />
              <p>PDF preview not available</p>
              <p className="text-sm">Click download to view the file</p>
            </div>
          )}
        </div>
      );
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return (
        <div className="w-full h-[400px] flex items-center justify-center">
          {document.url ? (
            <NextImage 
              src={document.url}
              alt={document.name}
              width={400}
              height={400}
              className="max-w-full max-h-full object-contain rounded"
              unoptimized={true}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4" />
              <p>Image preview not available</p>
            </div>
          )}
        </div>
      );
    }
    
    if (['txt', 'md', 'json', 'csv'].includes(fileType)) {
      return (
        <div className="w-full h-[400px] overflow-auto">
          {document.content ? (
            <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-background border rounded">
              {document.content}
            </pre>
          ) : document.url && document.url.startsWith('data:text/') ? (
            <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-background border rounded">
              {/* Decode base64 text content */}
              {(() => {
                try {
                  const base64Data = document.url.split(',')[1];
                  return atob(base64Data);
                } catch (error) {
                  return 'Unable to preview text content';
                }
              })()}
            </pre>
          ) : (
            <div className="text-center text-muted-foreground p-8">
              <FileText className="h-16 w-16 mx-auto mb-4" />
              <p>Text preview not available</p>
            </div>
          )}
        </div>
      );
    }
    
    if (['doc', 'docx'].includes(fileType)) {
      return (
        <div className="w-full h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <FileText className="h-16 w-16 mx-auto text-blue-500" />
            <div>
              <p className="font-medium">Microsoft Word Document</p>
              <p className="text-sm text-muted-foreground">
                Preview not available in browser
              </p>
              {document.url && (
                <Button 
                  className="mt-2" 
                  onClick={() => {
                    // Create a blob URL for download
                    try {
                      const base64Data = document.url!.split(',')[1];
                      const binaryData = atob(base64Data);
                      const bytes = new Uint8Array(binaryData.length);
                      for (let i = 0; i < binaryData.length; i++) {
                        bytes[i] = binaryData.charCodeAt(i);
                      }
                      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                      const url = URL.createObjectURL(blob);
                      const a = window.document.createElement('a');
                      a.href = url;
                      a.download = document.name;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Error downloading document:', error);
                    }
                  }}
                >
                  Download to View
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Default preview for other file types
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground space-y-4">
          <FileText className="h-16 w-16 mx-auto" />
          <div>
            <p className="font-medium">{document.fileType.toUpperCase()} File</p>
            <p className="text-sm">Preview not available for this file type</p>
            {document.url && (
              <Button 
                className="mt-2" 
                onClick={() => {
                  // Create a blob URL for download
                  try {
                    const base64Data = document.url!.split(',')[1];
                    const binaryData = atob(base64Data);
                    const bytes = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                      bytes[i] = binaryData.charCodeAt(i);
                    }
                    const mimeType = document.url!.split(';')[0].split(':')[1];
                    const blob = new Blob([bytes], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = window.document.createElement('a');
                    a.href = url;
                    a.download = document.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading file:', error);
                  }
                }}
              >
                Download File
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const loadDocuments = useCallback(async () => {
    if (!user?.uid) {
      return;
    }
    
    setLoading(true);
    try {
      const userDocs = await documentService.getUserDocuments(user.uid);
      
      const formattedDocs: Document[] = userDocs
        .filter(doc => doc.id) // Ensure we have an ID
        .map(doc => ({
          id: doc.id!,
          name: doc.name,
          type: doc.type,
          fileType: doc.fileType,
          size: doc.size,
          content: doc.content,
          url: doc.url,
          isStarred: doc.isStarred,
          version: doc.version,
          tags: doc.tags,
          jobApplications: doc.jobApplications || [],
          views: doc.views,
          downloads: doc.downloads,
          createdAt: doc.createdAt.toDate().toISOString(),
          updatedAt: doc.updatedAt.toDate().toISOString(),
        }));
      
      setDocuments(formattedDocs);
      return { success: true };
    } catch (error) {
      console.error('Error loading documents:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Load documents on component mount and when user changes
  useEffect(() => {
    if (user?.uid) {
      loadDocuments().then((result) => {
        if (result && !result.success && result.error) {
          toast({
            title: "Error",
            description: `Failed to load documents: ${result.error instanceof Error ? result.error.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only depend on user.uid, not loadDocuments

  // Template Library
  const resumeTemplates = [
    { id: 'modern', name: 'Modern Professional', category: 'Professional' },
    { id: 'creative', name: 'Creative Designer', category: 'Creative' },
    { id: 'technical', name: 'Software Engineer', category: 'Technical' },
    { id: 'executive', name: 'Executive Leader', category: 'Executive' }
  ];

  const coverLetterTemplates = [
    { id: 'standard', name: 'Standard Business', category: 'Professional' },
    { id: 'startup', name: 'Startup Culture', category: 'Casual' },
    { id: 'tech', name: 'Tech Company', category: 'Technical' },
    { id: 'creative', name: 'Creative Role', category: 'Creative' }
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  // Add file upload functionality
  const handleFileUpload = async (file: File) => {
    if (!user?.uid) {
      return;
    }

    if (uploadingFile) {
      return;
    }
    
    setUploadingFile(true);
    
    try {
      // Try the main upload method first
      let downloadURL: string;
      
      try {
        downloadURL = await documentService.uploadFile(file, user.uid, file.name);
      } catch (uploadError) {
        // Fallback to simple upload method
        downloadURL = await documentService.uploadFileAsBase64(file, user.uid);
      }
      
      // Read file content for text files
      let content = '';
      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        try {
          content = await file.text();
        } catch (contentError) {
          // Continue without content if reading fails
        }
      }
      
      // Create document record
      const docData = {
        name: newDocumentData.name || file.name.replace(/\.[^/.]+$/, ""),
        type: newDocumentData.type,
        fileType: file.name.split('.').pop() || 'unknown',
        size: file.size,
        content,
        url: downloadURL,
        userId: user.uid,
        isStarred: false,
        version: 1,
        tags: newDocumentData.tags,
        views: 0,
        downloads: 0,
        jobApplications: []
      };
      
      const docId = await documentService.createDocument(user.uid, docData);
      
      // Reload documents
      loadDocuments();
      
      toast({
        title: "Document Uploaded",
        description: "Document has been uploaded successfully.",
      });
      
      // Reset form
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setNewDocumentData({ name: '', type: 'resume', tags: [], content: '' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 500KB for Firebase free plan)
      const maxSize = 500 * 1024; // 500KB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `Firebase free plan limitation: Please select a file smaller than 500KB. Current file: ${Math.round(file.size / 1024)}KB`,
          variant: "destructive",
        });
        return;
      }

      // Show info for files larger than 100KB
      if (file.size > 100 * 1024) {
        toast({
          title: "File Size Info",
          description: `File size: ${Math.round(file.size / 1024)}KB. Using database storage (Firebase free plan).`,
          variant: "default",
        });
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif'
      ];
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt|png|jpg|jpeg|gif)$/i)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF, DOC, DOCX, TXT, or image files only.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Auto-populate document name if not already set
      if (!newDocumentData.name) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
        setNewDocumentData(prev => ({ 
          ...prev, 
          name: nameWithoutExtension,
          type: getDocumentType(file.name)
        }));
      }
    }
  };

  const handleUploadClick = async () => {
    if (uploadingFile) {
      return;
    }

    if (!newDocumentData.name.trim()) {
      toast({
        title: "Missing Document Name",
        description: "Please enter a name for the document.",
        variant: "destructive",
      });
      return;
    }

    // Check if we're in edit mode (selectedDocument exists and no new file)
    if (selectedDocument && !selectedFile) {
      // We're just updating document metadata (name, type, tags, content)
      await handleDocumentUpdate();
    } else if (selectedFile) {
      // We're uploading a new file or replacing an existing one
      await handleFileUpload(selectedFile);
    } else {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
  };

  const handleDocumentUpdate = async () => {
    if (!selectedDocument || !user?.uid) return;

    try {
      setUploadingFile(true);
      
      // Update document metadata
      const updates = {
        name: newDocumentData.name,
        type: newDocumentData.type,
        tags: newDocumentData.tags,
        content: newDocumentData.content,
      };

      await documentService.updateDocument(selectedDocument.id, updates);
      
      // Reload documents to reflect changes
      await loadDocuments();
      
      // Close dialog and reset form
      setIsUploadDialogOpen(false);
      setSelectedDocument(null);
      setNewDocumentData({ name: '', type: 'resume', tags: [], content: '' });
      
      toast({
        title: "Document Updated",
        description: `${newDocumentData.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const getDocumentType = (filename: string): Document['type'] => {
    const name = filename.toLowerCase();
    if (name.includes('resume') || name.includes('cv')) return 'resume';
    if (name.includes('cover') || name.includes('letter')) return 'cover-letter';
    if (name.includes('portfolio')) return 'portfolio';
    if (name.includes('certificate') || name.includes('cert')) return 'certificate';
    if (name.includes('reference') || name.includes('recommendation')) return 'reference';
    return 'other';
  };

  const toggleDocumentStar = (docId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, isStarred: !doc.isStarred } : doc
    ));
  };

  const deleteDocument = async (docId: string) => {
    if (!user?.uid) return;
    
    try {
      await documentService.deleteDocument(docId);
      loadDocuments(); // Reload documents without awaiting
      toast({
        title: "Document Deleted",
        description: "Document has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
    setDocumentToDelete(null);
  };

  const duplicateDocument = (doc: Document) => {
    const newDoc: Document = {
      ...doc,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: `${doc.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      views: 0,
      downloads: 0
    };
    setDocuments(prev => [...prev, newDoc]);
    toast({
      title: "Document Duplicated",
      description: `${doc.name} has been duplicated.`,
    });
  };

  const downloadDocument = (doc: Document) => {
    if (!doc.url) {
      toast({
        title: "Error",
        description: "No file data available for download.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Handle base64 downloads
      if (doc.url.startsWith('data:')) {
        const base64Data = doc.url.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        
        const mimeType = doc.url.split(';')[0].split(':')[1];
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = window.document.createElement('a');
        a.href = url;
        a.download = doc.name;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Increment download count if the service supports it
        try {
          documentService.incrementDownloads(doc.id);
        } catch (error) {
          // Ignore if increment fails
        }
        
        toast({
          title: "Download Started",
          description: `${doc.name} is being downloaded.`,
        });
      } else {
        // Handle regular URL downloads (legacy)
        window.open(doc.url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareDocument = (doc: Document) => {
    if (navigator.share) {
      // Use native share API if available
      navigator.share({
        title: doc.name,
        text: `Check out this document: ${doc.name}`,
        url: window.location.href, // Share current page URL
      }).catch((error) => {
        console.error('Error sharing:', error);
        copyShareLink(doc);
      });
    } else {
      copyShareLink(doc);
    }
  };

  const copyShareLink = (doc: Document) => {
    // Create a shareable link (in a real app, this would be a proper sharing URL)
    const shareText = `Document: ${doc.name}\nType: ${doc.type}\nSize: ${formatFileSize(doc.size)}\nUploaded: ${new Date(doc.createdAt).toLocaleDateString()}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        toast({
          title: "Link Copied",
          description: "Document information copied to clipboard.",
        });
      }).catch(() => {
        fallbackCopyToClipboard(shareText);
      });
    } else {
      fallbackCopyToClipboard(shareText);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = window.document.createElement('textarea');
    textArea.value = text;
    window.document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      window.document.execCommand('copy');
      toast({
        title: "Information Copied",
        description: "Document information copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
    window.document.body.removeChild(textArea);
  };

  const editDocument = (doc: Document) => {
    // Set up edit mode with document data
    setNewDocumentData({
      name: doc.name,
      type: doc.type,
      tags: doc.tags,
      content: doc.content || ''
    });
    setSelectedDocument(doc); // This indicates we're in edit mode
    setIsUploadDialogOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'resume': return <FileText className="h-5 w-5" />;
      case 'cover-letter': return <Mail className="h-5 w-5" />;
      case 'portfolio': return <Briefcase className="h-5 w-5" />;
      case 'certificate': return <Award className="h-5 w-5" />;
      case 'reference': return <Users className="h-5 w-5" />;
      default: return <File className="h-5 w-5" />;
    }
  };

  const getDocumentTypeColor = (type: Document['type']) => {
    switch (type) {
      case 'resume': return 'bg-blue-100 text-blue-800';
      case 'cover-letter': return 'bg-green-100 text-green-800';
      case 'portfolio': return 'bg-purple-100 text-purple-800';
      case 'certificate': return 'bg-yellow-100 text-yellow-800';
      case 'reference': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateDocument = (type: string, templateId: string) => {
    toast({
      title: "Feature Coming Soon",
      description: `Document generation for ${type} will be available soon.`,
    });
  };

  const checkATSScore = (documentId: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "ATS score checking will be available soon.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            <Folder className="h-8 w-8 text-green-600" />
            Document Management
          </h1>
          <p className="text-muted-foreground">
            Organize and optimize your job search documents
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient-success">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedDocument ? 'Edit Document' : 'Upload Document'}</DialogTitle>
                <DialogDescription>
                  {selectedDocument ? 'Update your document information and properties.' : 'Upload resumes, cover letters, portfolios, and other job search documents.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doc-name">Document Name</Label>
                  <Input
                    id="doc-name"
                    value={newDocumentData.name}
                    onChange={(e) => setNewDocumentData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter document name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="doc-type">Document Type</Label>
                  <Select
                    value={newDocumentData.type}
                    onValueChange={(value: Document['type']) => 
                      setNewDocumentData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resume">Resume</SelectItem>
                      <SelectItem value="cover-letter">Cover Letter</SelectItem>
                      <SelectItem value="portfolio">Portfolio</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="reference">Reference</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="doc-tags">Tags (comma-separated)</Label>
                  <Input
                    id="doc-tags"
                    value={newDocumentData.tags.join(', ')}
                    onChange={(e) => setNewDocumentData(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                    }))}
                    placeholder="e.g., software engineer, senior, react"
                  />
                </div>
                
                <div>
                  <Label htmlFor="file-upload">
                    {selectedDocument ? 'Replace File (Optional)' : 'Select File'}
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedDocument ? 
                      'Leave empty to keep existing file. Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, ZIP' :
                      'Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, ZIP'
                    }
                  </p>
                  {selectedFile && (
                    <div className="mt-2 p-2 bg-muted rounded-md">
                      <p className="text-sm font-medium">Selected file:</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                      </p>
                    </div>
                  )}
                  {selectedDocument && !selectedFile && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Current file:</p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        {selectedDocument.name} ({formatFileSize(selectedDocument.size)})
                      </p>
                    </div>
                  )}
                </div>
                
                {uploadingFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Uploading document...
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleUploadClick}
                    disabled={uploadingFile || !newDocumentData.name.trim() || (!selectedDocument && !selectedFile)}
                    className="flex-1 btn-gradient-success"
                  >
                    {uploadingFile ? 
                      (selectedDocument ? 'Updating...' : 'Uploading...') : 
                      (selectedDocument ? 'Update Document' : 'Upload Document')
                    }
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsUploadDialogOpen(false);
                      setSelectedFile(null);
                      setSelectedDocument(null);
                      setUploadingFile(false);
                      setNewDocumentData({ name: '', type: 'resume', tags: [], content: '' });
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <TabsTrigger value="documents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">My Documents</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">Templates</TabsTrigger>
          <TabsTrigger value="collaboration" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">Collaboration</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">Analytics</TabsTrigger>
          <TabsTrigger value="ai-tools" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">AI Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    <SelectItem value="resume">Resumes</SelectItem>
                    <SelectItem value="cover-letter">Cover Letters</SelectItem>
                    <SelectItem value="portfolio">Portfolios</SelectItem>
                    <SelectItem value="certificate">Certificates</SelectItem>
                    <SelectItem value="reference">References</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <div className="grid grid-cols-2 gap-1 h-4 w-4">
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                    </div>
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <div className="space-y-1 h-4 w-4">
                      <div className="bg-current h-1 rounded"></div>
                      <div className="bg-current h-1 rounded"></div>
                      <div className="bg-current h-1 rounded"></div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Grid/List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground">Loading documents...</p>
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No documents found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Upload your first document to get started'
                    }
                  </p>
                </div>
                {!searchTerm && filterType === 'all' && (
                  <Button 
                    onClick={() => setIsUploadDialogOpen(true)}
                    className="btn-gradient-success"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
              "space-y-2"
            }>
              {filteredDocuments.map((doc) => (
              <Card key={doc.id} className={`card-gradient-documents border-green-200 ${viewMode === 'grid' ? 'hover:shadow-lg transition-all duration-300' : ''}`}>
                <CardContent className={viewMode === 'grid' ? "p-6" : "p-4"}>
                  {viewMode === 'grid' ? (
                    // Grid View
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-primary">
                            {getDocumentIcon(doc.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{doc.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getDocumentTypeColor(doc.type)}`}>
                                {doc.type.replace('-', ' ')}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {doc.fileType.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleDocumentStar(doc.id)}
                          >
                            <Star className={`h-4 w-4 ${doc.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setSelectedDocument(doc)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => editDocument(doc)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateDocument(doc)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => shareDocument(doc)}>
                                <Share className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadDocument(doc)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => setDocumentToDelete(doc.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className={`text-xs ${getDocumentTypeColor(doc.type)}`}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Size: {formatFileSize(doc.size)}</p>
                          <p>Modified: {new Date(doc.updatedAt).toLocaleDateString()}</p>
                          <p>Views: {doc.views} • Downloads: {doc.downloads}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // List View
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="text-primary">
                          {getDocumentIcon(doc.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{doc.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{doc.type.replace('-', ' ')}</span>
                            <span>{formatFileSize(doc.size)}</span>
                            <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doc.isStarred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                        <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => editDocument(doc)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateDocument(doc)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadDocument(doc)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setDocumentToDelete(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resume Templates</CardTitle>
                <CardDescription>Professional resume templates for different industries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumeTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.category}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => generateDocument('resume', template.id)}
                    >
                      Use Template
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cover Letter Templates</CardTitle>
                <CardDescription>Tailored cover letter templates for various company cultures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {coverLetterTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.category}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => generateDocument('cover-letter', template.id)}
                    >
                      Use Template
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Share Documents</CardTitle>
                <CardDescription>
                  Share your documents with mentors, career coaches, or peers for feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Document</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose document to share" />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Share With (Email)</Label>
                  <Input placeholder="mentor@example.com" />
                </div>
                <div>
                  <Label>Permission Level</Label>
                  <Select defaultValue="comment">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View Only</SelectItem>
                      <SelectItem value="comment">Can Comment</SelectItem>
                      <SelectItem value="edit">Can Edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Message (Optional)</Label>
                  <Textarea placeholder="Please review my resume and provide feedback..." />
                </div>
                <Button className="w-full">
                  <Share className="h-4 w-4 mr-2" />
                  Send Share Invite
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback & Comments</CardTitle>
                <CardDescription>Recent feedback on your shared documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">Sarah Johnson</span>
                      <span className="text-xs text-muted-foreground">2 hours ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      On: Software Engineer Resume
                    </p>
                    <p className="text-sm">
                      &quot;Great technical skills section! Consider adding more quantifiable achievements in your experience section.&quot;
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">Mike Chen</span>
                      <span className="text-xs text-muted-foreground">1 day ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      On: TechCorp Cover Letter
                    </p>
                    <p className="text-sm">
                      &quot;The opening paragraph is strong. Maybe add more specific examples of your React experience.&quot;
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Document Versions</CardTitle>
                <CardDescription>Track changes and manage document versions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-primary">
                          {getDocumentIcon(doc.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{doc.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Version {doc.version} • Last modified {new Date(doc.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">View History</Button>
                        <Button size="sm" variant="outline">Compare</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.reduce((sum, doc) => sum + doc.views, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +23% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.reduce((sum, doc) => sum + doc.downloads, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12 this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CardContent>
                  <div className="text-2xl font-bold">73%</div>
                  <p className="text-xs text-muted-foreground">
                    Response rate with documents
                  </p>
                </CardContent>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Document Performance</CardTitle>
              <CardDescription>How your documents are performing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-primary">
                        {getDocumentIcon(doc.type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {doc.type.replace('-', ' ')} • Version {doc.version}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{doc.views} views</div>
                      <div className="text-muted-foreground">{doc.downloads} downloads</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Resume Optimizer</CardTitle>
                <CardDescription>
                  Optimize your resume for specific job applications using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Job Application</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a job to optimize for" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.jobTitle} at {job.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Select Resume</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose resume to optimize" />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.filter(doc => doc.type === 'resume').map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>                  <Button 
                    className="w-full btn-gradient-warning" 
                    onClick={() => generateDocument('resume', 'modern')}
                    disabled={isGeneratingDocument}
                  >
                    {isGeneratingDocument ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Optimize Resume
                      </>
                    )}
                  </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Cover Letter Generator</CardTitle>
                <CardDescription>
                  Generate personalized cover letters for job applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Target Job</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job application" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.jobTitle} at {job.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tone</Label>
                  <Select defaultValue="professional">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>                  <Button 
                    className="w-full"
                    onClick={() => generateDocument('cover-letter', 'professional')}
                    disabled={isGeneratingDocument}
                  >
                    {isGeneratingDocument ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Cover Letter
                      </>
                    )}
                  </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ATS Score Checker</CardTitle>
                <CardDescription>
                  Check how well your resume scores with Applicant Tracking Systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Document</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose document to analyze" />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>                  <Button 
                    className="w-full btn-gradient-secondary"
                    onClick={() => {
                      const resumeDoc = documents.find(doc => doc.type === 'resume');
                      if (resumeDoc) checkATSScore(resumeDoc.id);
                    }}
                    disabled={isOptimizing}
                  >
                    {isOptimizing ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analyze ATS Score
                      </>
                    )}
                  </Button>
                  {optimizationResults && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">ATS Score</span>
                        <span className={`text-lg font-bold ${
                          optimizationResults.atsScore >= 80 ? 'text-green-600' : 
                          optimizationResults.atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {optimizationResults.atsScore}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            optimizationResults.atsScore >= 80 ? 'bg-green-600' : 
                            optimizationResults.atsScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${optimizationResults.atsScore}%` }}
                        ></div>
                      </div>
                      <div className="mt-3">
                        <h4 className="font-medium text-sm mb-2">Suggestions:</h4>
                        <ul className="space-y-1">
                          {optimizationResults.suggestions.slice(0, 2).map((suggestion: string, index: number) => (
                            <li key={index} className="text-xs text-muted-foreground">
                              • {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interview Prep Assistant</CardTitle>
                <CardDescription>
                  Generate interview questions and talking points based on job descriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Job Application</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select upcoming interview" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.filter(job => job.status === 'interviewing').map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.jobTitle} at {job.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interview Type</Label>
                  <Select defaultValue="behavioral">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="case-study">Case Study</SelectItem>
                      <SelectItem value="cultural">Cultural Fit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Generate Prep Materials
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Preview Dialog */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                {getDocumentIcon(selectedDocument.type)}
                {selectedDocument.name}
              </DialogTitle>
              <DialogDescription>
                {selectedDocument.type.replace('-', ' ')} • {selectedDocument.fileType.toUpperCase()} • 
                {formatFileSize(selectedDocument.size)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedDocument.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className={getDocumentTypeColor(selectedDocument.type)}>
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="border rounded-lg bg-muted/50 min-h-[400px] max-h-[50vh] overflow-auto">
                {renderDocumentPreview(selectedDocument)}
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground flex-shrink-0">
                <span>Created: {new Date(selectedDocument.createdAt).toLocaleDateString()}</span>
                <span>Modified: {new Date(selectedDocument.updatedAt).toLocaleDateString()}</span>
                <span>Version: {selectedDocument.version}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => documentToDelete && deleteDocument(documentToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
