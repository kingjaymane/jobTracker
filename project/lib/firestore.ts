import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { JobApplication } from '@/app/page';

const COLLECTION_NAME = 'jobApplications';

// Get all job applications for the current user
export const getJobApplications = async (userId: string): Promise<JobApplication[]> => {
  try {
    console.log('Fetching jobs for userId:', userId);
    
    // First try a simple query without orderBy to see if that works
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    console.log('Query snapshot size:', querySnapshot.size);
    
    let jobs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as JobApplication[];
    
    // Sort manually on the client side for now
    jobs = jobs.sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
    
    console.log('Fetched jobs:', jobs);
    return jobs;
  } catch (error) {
    console.error('Error fetching job applications:', error);
    throw error;
  }
};

// Add a new job application
export const addJobApplication = async (job: Omit<JobApplication, 'id'>, userId: string): Promise<string> => {
  try {
    console.log('Adding job for userId:', userId, 'Job data:', job);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...job,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log('Added job with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding job application:', error);
    throw error;
  }
};

// Update a job application
export const updateJobApplication = async (id: string, updates: Partial<JobApplication>, userId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating job application:', error);
    throw error;
  }
};

// Delete a job application
export const deleteJobApplication = async (id: string, userId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting job application:', error);
    throw error;
  }
};

// Update job status
export const updateJobStatus = async (id: string, status: JobApplication['status'], userId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
};

// Get job applications by status for the current user
export const getJobApplicationsByStatus = async (status: JobApplication['status'], userId: string): Promise<JobApplication[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('status', '==', status)
    );
    const querySnapshot = await getDocs(q);
    
    let jobs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as JobApplication[];
    
    // Sort manually on the client side
    jobs = jobs.sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
    
    return jobs;
  } catch (error) {
    console.error('Error fetching job applications by status:', error);
    throw error;
  }
};
