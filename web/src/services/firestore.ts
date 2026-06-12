import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  setDoc,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  arrayUnion
} from 'firebase/firestore';

// Types for the target collections
export interface UserProfile {
  id?: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  profile_photo_url?: string;
  bio?: string;
  home_city?: string;
  travel_preferences?: string[];
  created_at?: any;
  updated_at?: any;
}

export interface Itinerary {
  id?: string;
  userId: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  days: number;
  budget: number;
  theme?: string;
  activities?: any[];
  created_at?: any;
}

export interface Booking {
  id?: string;
  userId: string;
  booking_type: 'flight' | 'train' | 'bus' | 'hotel' | 'homestay' | 'package';
  booking_reference: string;
  amount_paid: number;
  journey_details: any;
  status: 'confirmed' | 'cancelled';
  created_at?: any;
}

export interface Reel {
  id?: string;
  userId: string;
  videoUrl: string;
  caption: string;
  author?: string;
  handle?: string;
  avatar?: string;
  likes_count?: number;
  comments_count?: number;
  music?: string;
  liked?: boolean;
  saved?: boolean;
  saves?: number;
  comments?: Array<{ id: string; user: string; text: string }>;
  created_at?: any;
}

export interface Review {
  id?: string;
  userId: string;
  targetId: string; // Attraction ID or Hotel ID
  rating: number;
  comment: string;
  created_at?: any;
}

export interface Favorite {
  id?: string;
  userId: string;
  targetId: string; // Favorite attraction or hotel ID
  targetType: 'attraction' | 'hotel' | 'homestay' | 'reel' | 'post';
  name: string;
  imageUrl?: string;
  created_at?: any;
}

export interface FailedWriteLog {
  timestamp: string;
  collection: string;
  operation: string;
  error: string;
}

// Global audit stats structure
export const firestoreAuditStats = {
  connectedServices: {
    auth: false,
    firestore: false
  },
  collections: {
    users: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    itineraries: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    bookings: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    reels: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    favorites: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    reviews: { reads: 0, writes: 0, deletes: 0, failures: 0 }
  },
  failedWritesList: [] as FailedWriteLog[]
};

// Helper: update audit connections
function markServiceConnected(service: 'auth' | 'firestore') {
  firestoreAuditStats.connectedServices[service] = true;
}

// Helper: log failed writes and update audit stats
function logWriteFailure(collectionName: string, operation: string, error: any) {
  const errorMessage = error?.message || String(error);
  console.error(`[Firestore Write Failure] Error during "${operation}" in collection "${collectionName}":`, error);
  const col = collectionName as keyof typeof firestoreAuditStats.collections;
  if (firestoreAuditStats.collections[col]) {
    firestoreAuditStats.collections[col].failures += 1;
  }
  firestoreAuditStats.failedWritesList.push({
    timestamp: new Date().toISOString(),
    collection: collectionName,
    operation,
    error: errorMessage
  });
}

// Helper: Ensure the user is authenticated and return their UID
function getAuthenticatedUserId(): string {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Unauthenticated: An authenticated user is required for this operation.');
  }
  markServiceConnected('auth');
  return currentUser.uid;
}

// Helper: Auto-repair/audit logic. If a retrieved document is missing userId, update it in background.
async function auditAndRepairDocument(collectionName: string, docId: string, docData: DocumentData): Promise<DocumentData> {
  if (!docData.userId) {
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      console.warn(`[Firestore Audit] Doc ID "${docId}" in collection "${collectionName}" is missing userId. Repairing it with current authenticated user's UID...`);
      try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, { userId: currentUid, audited_and_repaired: true });
        docData.userId = currentUid;
        firestoreAuditStats.collections[collectionName as keyof typeof firestoreAuditStats.collections].writes += 1;
      } catch (err: any) {
        logWriteFailure(collectionName, 'auto-repair', err);
      }
    }
  }
  return docData;
}

// Generic Mapper to transform snapshot to typed data and auto-audit/repair
async function mapSnapshotToData<T>(snapshot: QueryDocumentSnapshot<DocumentData>, collectionName: string): Promise<T> {
  const id = snapshot.id;
  let data = snapshot.data();
  data = await auditAndRepairDocument(collectionName, id, data);
  const col = collectionName as keyof typeof firestoreAuditStats.collections;
  if (firestoreAuditStats.collections[col]) {
    firestoreAuditStats.collections[col].reads += 1;
  }
  return { id, ...data } as unknown as T;
}

/* ==========================================
   USERS COLLECTION SERVICES
   ========================================== */

// Create or set user profile (Uses UID as document ID)
export async function setUserProfile(profileData: Omit<UserProfile, 'userId'>): Promise<UserProfile> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const profileRef = doc(db, 'users', uid);
  const fullProfile: UserProfile = {
    ...profileData,
    userId: uid,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  };
  try {
    await setDoc(profileRef, fullProfile);
    firestoreAuditStats.collections.users.writes += 1;
    return { id: uid, ...fullProfile };
  } catch (err: any) {
    logWriteFailure('users', 'set-profile', err);
    throw err;
  }
}

// Get user profile
export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  const targetUid = userId || getAuthenticatedUserId();
  markServiceConnected('firestore');
  
  // Prevent cross-user data access on profile queries (client-side checks)
  if (targetUid !== auth.currentUser?.uid) {
    throw new Error('Unauthorized: You cannot access another user\'s profile.');
  }

  try {
    const profileRef = doc(db, 'users', targetUid);
    const docSnap = await getDoc(profileRef);
    firestoreAuditStats.collections.users.reads += 1;
    if (!docSnap.exists()) return null;

    const data = await mapSnapshotToData<UserProfile>(docSnap as any, 'users');
    return data;
  } catch (err: any) {
    console.error('[Firestore Read Error] getUserProfile:', err);
    throw err;
  }
}

// Update user profile
export async function updateUserProfile(profileData: Partial<Omit<UserProfile, 'userId'>>): Promise<void> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const profileRef = doc(db, 'users', uid);
  try {
    await updateDoc(profileRef, {
      ...profileData,
      updated_at: serverTimestamp()
    });
    firestoreAuditStats.collections.users.writes += 1;
  } catch (err: any) {
    logWriteFailure('users', 'update-profile', err);
    throw err;
  }
}


/* ==========================================
   ITINERARIES COLLECTION SERVICES
   ========================================== */

export async function createItinerary(itinerary: Omit<Itinerary, 'userId'>): Promise<Itinerary> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const colRef = collection(db, 'itineraries');
  try {
    const docRef = await addDoc(colRef, {
      ...itinerary,
      userId: uid,
      created_at: serverTimestamp()
    });
    firestoreAuditStats.collections.itineraries.writes += 1;
    return { id: docRef.id, userId: uid, ...itinerary };
  } catch (err: any) {
    logWriteFailure('itineraries', 'create-itinerary', err);
    throw err;
  }
}

export async function getItineraries(): Promise<Itinerary[]> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const colRef = collection(db, 'itineraries');
  const q = query(colRef, where('userId', '==', uid));
  try {
    const querySnap = await getDocs(q);
    const results: Itinerary[] = [];
    for (const docSnap of querySnap.docs) {
      results.push(await mapSnapshotToData<Itinerary>(docSnap, 'itineraries'));
    }
    return results;
  } catch (err: any) {
    console.error('[Firestore Read Error] getItineraries:', err);
    throw err;
  }
}

export async function updateItinerary(id: string, data: Partial<Omit<Itinerary, 'userId'>>): Promise<void> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const docRef = doc(db, 'itineraries', id);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Document not found.');
    }

    const existingData = docSnap.data();
    // Validate ownership before updating
    if (existingData.userId !== uid) {
      throw new Error('Unauthorized: You do not own this itinerary.');
    }

    await updateDoc(docRef, data);
    firestoreAuditStats.collections.itineraries.writes += 1;
  } catch (err: any) {
    logWriteFailure('itineraries', 'update-itinerary', err);
    throw err;
  }
}

export async function deleteItinerary(id: string): Promise<void> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const docRef = doc(db, 'itineraries', id);
  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Document not found.');
    }

    const existingData = docSnap.data();
    // Validate ownership before deleting
    if (existingData.userId !== uid) {
      throw new Error('Unauthorized: You do not own this itinerary.');
    }

    await deleteDoc(docRef);
    firestoreAuditStats.collections.itineraries.deletes += 1;
  } catch (err: any) {
    logWriteFailure('itineraries', 'delete-itinerary', err);
    throw err;
  }
}


/* ==========================================
   BOOKINGS COLLECTION SERVICES
   ========================================== */

export async function createBooking(booking: Omit<Booking, 'userId'>): Promise<Booking> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const colRef = collection(db, 'bookings');
  try {
    const docRef = await addDoc(colRef, {
      ...booking,
      userId: uid,
      created_at: serverTimestamp()
    });
    firestoreAuditStats.collections.bookings.writes += 1;
    return { id: docRef.id, userId: uid, ...booking };
  } catch (err: any) {
    logWriteFailure('bookings', 'create-booking', err);
    throw err;
  }
}

export async function getBookings(): Promise<Booking[]> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const colRef = collection(db, 'bookings');
  const q = query(colRef, where('userId', '==', uid));
  try {
    const querySnap = await getDocs(q);
    const results: Booking[] = [];
    for (const docSnap of querySnap.docs) {
      results.push(await mapSnapshotToData<Booking>(docSnap, 'bookings'));
    }
    return results;
  } catch (err: any) {
    console.error('[Firestore Read Error] getBookings:', err);
    throw err;
  }
}

export async function cancelBooking(id: string): Promise<void> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const docRef = doc(db, 'bookings', id);
  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Booking not found.');
    }

    const existingData = docSnap.data();
    // Validate ownership before updating status
    if (existingData.userId !== uid) {
      throw new Error('Unauthorized: You do not own this booking.');
    }

    await updateDoc(docRef, { status: 'cancelled' });
    firestoreAuditStats.collections.bookings.writes += 1;
  } catch (err: any) {
    logWriteFailure('bookings', 'cancel-booking', err);
    throw err;
  }
}


/* ==========================================
   REELS COLLECTION SERVICES (Public read, Owner write)
   ========================================== */

export async function createReel(reel: Omit<Reel, 'userId'>): Promise<Reel> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const colRef = collection(db, 'reels');
  try {
    const docRef = await addDoc(colRef, {
      ...reel,
      userId: uid,
      likes_count: reel.likes_count ?? 0,
      comments_count: reel.comments_count ?? 0,
      comments: reel.comments ?? [],
      created_at: serverTimestamp()
    });
    firestoreAuditStats.collections.reels.writes += 1;
    return { id: docRef.id, userId: uid, ...reel };
  } catch (err: any) {
    logWriteFailure('reels', 'create-reel', err);
    throw err;
  }
}

// Fetch all reels (Public access allowed)
export async function getReels(): Promise<Reel[]> {
  markServiceConnected('firestore');
  const colRef = collection(db, 'reels');
  try {
    const querySnap = await getDocs(colRef);
    const results: Reel[] = [];
    for (const docSnap of querySnap.docs) {
      results.push(await mapSnapshotToData<Reel>(docSnap, 'reels'));
    }
    return results;
  } catch (err: any) {
    console.error('[Firestore Read Error] getReels:', err);
    throw err;
  }
}

// Fetch reels by a specific user (Query filter validated)
export async function getUserReels(userId?: string): Promise<Reel[]> {
  const targetUid = userId || getAuthenticatedUserId();
  markServiceConnected('firestore');
  const colRef = collection(db, 'reels');
  const q = query(colRef, where('userId', '==', targetUid));
  try {
    const querySnap = await getDocs(q);
    const results: Reel[] = [];
    for (const docSnap of querySnap.docs) {
      results.push(await mapSnapshotToData<Reel>(docSnap, 'reels'));
    }
    return results;
  } catch (err: any) {
    console.error('[Firestore Read Error] getUserReels:', err);
    throw err;
  }
}

// Update a Reel document directly (likes, comments count, etc)
export async function updateReel(id: string, data: Partial<Reel>): Promise<void> {
  markServiceConnected('firestore');
  const docRef = doc(db, 'reels', id);
  try {
    await updateDoc(docRef, data);
    firestoreAuditStats.collections.reels.writes += 1;
  } catch (err: any) {
    logWriteFailure('reels', 'update-reel', err);
    throw err;
  }
}

// Add comment to Reel document comments array
export async function addReelComment(reelId: string, comment: { id: string; user: string; text: string }): Promise<void> {
  markServiceConnected('firestore');
  const docRef = doc(db, 'reels', reelId);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Reel not found.');
    }
    const currentComments = docSnap.data().comments || [];
    const currentCount = docSnap.data().comments_count || 0;
    await updateDoc(docRef, {
      comments: [...currentComments, comment],
      comments_count: currentCount + 1
    });
    firestoreAuditStats.collections.reels.writes += 1;
  } catch (err: any) {
    logWriteFailure('reels', 'add-reel-comment', err);
    throw err;
  }
}

export async function deleteReel(id: string): Promise<void> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const docRef = doc(db, 'reels', id);
  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Reel not found.');
    }

    const existingData = docSnap.data();
    // Validate ownership before deleting
    if (existingData.userId !== uid) {
      throw new Error('Unauthorized: You do not own this reel.');
    }

    await deleteDoc(docRef);
    firestoreAuditStats.collections.reels.deletes += 1;
  } catch (err: any) {
    logWriteFailure('reels', 'delete-reel', err);
    throw err;
  }
}


/* ==========================================
   REVIEWS COLLECTION SERVICES (Public read, Owner write)
   ========================================== */

export async function createReview(review: Omit<Review, 'userId'>): Promise<Review> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const colRef = collection(db, 'reviews');
  try {
    const docRef = await addDoc(colRef, {
      ...review,
      userId: uid,
      created_at: serverTimestamp()
    });
    firestoreAuditStats.collections.reviews.writes += 1;
    return { id: docRef.id, userId: uid, ...review };
  } catch (err: any) {
    logWriteFailure('reviews', 'create-review', err);
    throw err;
  }
}

// Fetch reviews for a specific attraction/hotel (Public query)
export async function getTargetReviews(targetId: string): Promise<Review[]> {
  markServiceConnected('firestore');
  const colRef = collection(db, 'reviews');
  const q = query(colRef, where('targetId', '==', targetId));
  try {
    const querySnap = await getDocs(q);
    const results: Review[] = [];
    for (const docSnap of querySnap.docs) {
      results.push(await mapSnapshotToData<Review>(docSnap, 'reviews'));
    }
    return results;
  } catch (err: any) {
    console.error('[Firestore Read Error] getTargetReviews:', err);
    throw err;
  }
}

export async function deleteReview(id: string): Promise<void> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const docRef = doc(db, 'reviews', id);
  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Review not found.');
    }

    const existingData = docSnap.data();
    // Validate ownership before deleting
    if (existingData.userId !== uid) {
      throw new Error('Unauthorized: You do not own this review.');
    }

    await deleteDoc(docRef);
    firestoreAuditStats.collections.reviews.deletes += 1;
  } catch (err: any) {
    logWriteFailure('reviews', 'delete-review', err);
    throw err;
  }
}


/* ==========================================
   FAVORITES COLLECTION SERVICES
   ========================================== */

export async function createFavorite(favorite: Omit<Favorite, 'userId'>): Promise<Favorite> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const colRef = collection(db, 'favorites');
  try {
    // Check if duplicate favorite exists
    const q = query(colRef, where('userId', '==', uid), where('targetId', '==', favorite.targetId));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return { id: querySnap.docs[0].id, userId: uid, ...favorite };
    }
    const docRef = await addDoc(colRef, {
      ...favorite,
      userId: uid,
      created_at: serverTimestamp()
    });
    firestoreAuditStats.collections.favorites.writes += 1;
    return { id: docRef.id, userId: uid, ...favorite };
  } catch (err: any) {
    logWriteFailure('favorites', 'create-favorite', err);
    throw err;
  }
}

export async function getFavorites(): Promise<Favorite[]> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const colRef = collection(db, 'favorites');
  const q = query(colRef, where('userId', '==', uid));
  try {
    const querySnap = await getDocs(q);
    const results: Favorite[] = [];
    for (const docSnap of querySnap.docs) {
      results.push(await mapSnapshotToData<Favorite>(docSnap, 'favorites'));
    }
    return results;
  } catch (err: any) {
    console.error('[Firestore Read Error] getFavorites:', err);
    throw err;
  }
}

export async function deleteFavorite(id: string): Promise<void> {
  const uid = getAuthenticatedUserId();
  markServiceConnected('firestore');
  const docRef = doc(db, 'favorites', id);
  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Favorite not found.');
    }

    const existingData = docSnap.data();
    // Validate ownership before deleting
    if (existingData.userId !== uid) {
      throw new Error('Unauthorized: You do not own this favorite.');
    }

    await deleteDoc(docRef);
    firestoreAuditStats.collections.favorites.deletes += 1;
  } catch (err: any) {
    logWriteFailure('favorites', 'delete-favorite', err);
    throw err;
  }
}

// Dynamic Audit Connection Test Panel Data
export async function runFirebaseAudit(): Promise<any> {
  const auditReport = {
    authConnected: !!auth.currentUser,
    firestoreConnected: false,
    collectionCounts: {
      users: 0,
      itineraries: 0,
      bookings: 0,
      reels: 0,
      favorites: 0
    },
    missingIntegrations: [] as string[]
  };

  if (auth.currentUser) {
    auditReport.authConnected = true;
    firestoreAuditStats.connectedServices.auth = true;
  }

  try {
    const uid = auth.currentUser?.uid;
    // Query collections directly
    if (uid) {
      const qUsers = query(collection(db, 'users'), where('userId', '==', uid));
      const uSnap = await getDocs(qUsers);
      auditReport.collectionCounts.users = uSnap.size;

      const qItin = query(collection(db, 'itineraries'), where('userId', '==', uid));
      const snap = await getDocs(qItin);
      auditReport.firestoreConnected = true;
      firestoreAuditStats.connectedServices.firestore = true;
      auditReport.collectionCounts.itineraries = snap.size;

      const bSnap = await getDocs(query(collection(db, 'bookings'), where('userId', '==', uid)));
      auditReport.collectionCounts.bookings = bSnap.size;

      const fSnap = await getDocs(query(collection(db, 'favorites'), where('userId', '==', uid)));
      auditReport.collectionCounts.favorites = fSnap.size;

      const rSnap = await getDocs(collection(db, 'reels'));
      auditReport.collectionCounts.reels = rSnap.size;
    } else {
      const rSnap = await getDocs(collection(db, 'reels'));
      auditReport.firestoreConnected = true;
      firestoreAuditStats.connectedServices.firestore = true;
      auditReport.collectionCounts.reels = rSnap.size;
    }
  } catch (error: any) {
    console.error('[Firestore Audit] Connection check failed:', error);
    auditReport.firestoreConnected = false;
    auditReport.missingIntegrations.push(`Firestore: ${error.message}`);
  }

  return auditReport;
}

export function triggerSimulatedFailure(): void {
  try {
    throw new Error('Simulated write error: Permission Denied (403)');
  } catch (err: any) {
    logWriteFailure('favorites', 'simulated-test-write', err);
  }
}

