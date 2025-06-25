import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Convert Firebase User to our AuthUser type
export const convertFirebaseUser = (user: User | null): AuthUser | null => {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<AuthUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = convertFirebaseUser(userCredential.user);
    if (!user) throw new Error('Failed to sign in');
    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<AuthUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    const user = convertFirebaseUser(userCredential.user);
    if (!user) throw new Error('Failed to create account');
    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create account');
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<AuthUser> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = convertFirebaseUser(userCredential.user);
    if (!user) throw new Error('Failed to sign in with Google');
    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send reset email');
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(convertFirebaseUser(user));
  });
};

// Get current user
export const getCurrentUser = (): AuthUser | null => {
  return convertFirebaseUser(auth.currentUser);
};
