import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  getMetadata
} from 'firebase/storage';
import { db, storage } from './firebase';

export interface Document {
  id?: string;
  name: string;
  type: 'resume' | 'cover-letter' | 'portfolio' | 'certificate' | 'reference' | 'other';
  fileType: string;
  size: number;
  content: string;
  url?: string;
  isStarred: boolean;
  version: number;
  tags: string[];
  userId: string;
  jobApplications?: string[];
  views: number;
  downloads: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class DocumentService {
  private collectionName = 'documents';

  async createDocument(userId: string, documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...documentData,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async updateDocument(documentId: string, updates: Partial<Document>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    try {
      // Simple query first - just filter by userId without ordering
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Document));
      
      // Sort by updatedAt on client side to avoid index issues
      documents.sort((a, b) => {
        const aTime = a.updatedAt ? (a.updatedAt as Timestamp).toDate().getTime() : 0;
        const bTime = b.updatedAt ? (b.updatedAt as Timestamp).toDate().getTime() : 0;
        return bTime - aTime;
      });
      
      return documents;
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw error;
    }
  }

  async uploadFile(file: File, userId: string, path: string): Promise<string> {
    try {
      // For Firebase free plan - use base64 storage directly
      const maxSize = 500 * 1024; // 500KB limit for base64 storage
      if (file.size > maxSize) {
        throw new Error(`File size (${Math.round(file.size / 1024)}KB) exceeds maximum allowed size (500KB). Firebase free plan has Storage limitations.`);
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt|jpg|jpeg|png|gif)$/i)) {
        throw new Error('Unsupported file type. Please upload PDF, DOC, DOCX, TXT, or image files.');
      }

      // Use base64 storage instead of Firebase Storage (free plan compatible)
      return await this.uploadFileAsBase64(file, userId);
      
    } catch (error) {
      // Provide more specific error messages for free plan
      if (error instanceof Error) {
        if (error.message.includes('storage/retry-limit-exceeded')) {
          throw new Error('Firebase free plan Storage limitation. File stored in database instead. Please keep files under 500KB.');
        } else if (error.message.includes('storage/unauthorized')) {
          throw new Error('Firebase free plan does not allow custom Storage rules. Using database storage instead.');
        }
      }
      
      throw error;
    }
  }

  // Convert file to base64 and store directly in Firestore
  async uploadFileAsBase64(file: File, userId: string): Promise<string> {
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Return the base64 string as the "URL"
      return base64;
      
    } catch (error) {
      throw new Error('Failed to process file. Please try a different file.');
    }
  }

  async deleteFile(url: string): Promise<void> {
    // For base64 URLs, no file deletion needed (stored in Firestore)
    if (url.startsWith('data:')) {
      return;
    }
    
    // Legacy: handle actual Firebase Storage URLs if any exist
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (error) {
      // Ignore deletion errors for base64 data
    }
  }

  async incrementViews(documentId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      const currentDoc = await getDocs(query(collection(db, this.collectionName), where('id', '==', documentId)));
      
      if (!currentDoc.empty) {
        const currentViews = currentDoc.docs[0].data().views || 0;
        await updateDoc(docRef, {
          views: currentViews + 1,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
      throw error;
    }
  }

  async incrementDownloads(documentId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      const currentDoc = await getDocs(query(collection(db, this.collectionName), where('id', '==', documentId)));
      
      if (!currentDoc.empty) {
        const currentDownloads = currentDoc.docs[0].data().downloads || 0;
        await updateDoc(docRef, {
          downloads: currentDownloads + 1,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error incrementing downloads:', error);
      throw error;
    }
  }
}

export const documentService = new DocumentService();
