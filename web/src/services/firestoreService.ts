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
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

// Types for target collections
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
  uid?: string;
  photoURL?: string;
  provider?: string;
  createdAt?: any;
  lastLogin?: any;
  role?: string;
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
  targetId: string;
  rating: number;
  comment: string;
  created_at?: any;
}

export interface Favorite {
  id?: string;
  userId: string;
  targetId: string;
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

// Global audit stats structure for all 18 collections
export const firestoreAuditStats = {
  connectedServices: {
    auth: false,
    firestore: false
  },
  collections: {
    users: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    itineraries: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    bookings: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    notifications: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    posts: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    reels: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    favorites: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    reviews: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    hotels: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    flights: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    trains: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    buses: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    homestays: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    saved_places: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    search_history: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    ai_chats: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    travel_reels: { reads: 0, writes: 0, deletes: 0, failures: 0 },
    payments: { reads: 0, writes: 0, deletes: 0, failures: 0 }
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
  console.error("Firestore Write Failed", collectionName, errorMessage);
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

// Helper: Ensure the user is authenticated (with anonymous fallback) and return their UID
export async function getAuthenticatedUserId(): Promise<string> {
  let currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('[Firestore Auth] No active Firebase session. Authenticating anonymously...');
    try {
      const cred = await signInAnonymously(auth);
      currentUser = cred.user;
    } catch (err: any) {
      logWriteFailure('auth', 'anonymous-signin', err);
      throw new Error('Unauthenticated: An authenticated user is required for this operation.');
    }
  }
  markServiceConnected('auth');
  return currentUser.uid;
}

// Helper: Auto-repair/audit logic
async function auditAndRepairDocument(collectionName: string, docId: string, docData: DocumentData): Promise<DocumentData> {
  if (!docData.userId) {
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      console.warn(`[Firestore Audit] Doc ID "${docId}" in collection "${collectionName}" is missing userId. Repairing it in background...`);
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
  console.log("Firestore Read Success", collectionName, id);
  return { id, ...data } as unknown as T;
}

/* ==========================================
   GENERIC FIRESTORE SERVICE LAYER
   ========================================== */

// Generic Create Document
export async function createDocument(collectionName: string, data: any, docId?: string): Promise<any> {
  markServiceConnected('firestore');
  try {
    let finalId = docId;
    if (docId) {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, {
        ...data,
        created_at: data.created_at || serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } else {
      const colRef = collection(db, collectionName);
      const docRef = await addDoc(colRef, {
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      finalId = docRef.id;
    }

    console.log("Firestore Write Success", collectionName, finalId);

    const col = collectionName as keyof typeof firestoreAuditStats.collections;
    if (firestoreAuditStats.collections[col]) {
      firestoreAuditStats.collections[col].writes += 1;
    }
    return { id: finalId, ...data };
  } catch (err: any) {
    console.error("Firestore Write Failed", collectionName, err);
    logWriteFailure(collectionName, `createDocument:${docId || 'auto'}`, err);
    throw err;
  }
}

// Generic Update Document
export async function updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
  markServiceConnected('firestore');
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });

    console.log("Firestore Write Success", collectionName, docId);

    const col = collectionName as keyof typeof firestoreAuditStats.collections;
    if (firestoreAuditStats.collections[col]) {
      firestoreAuditStats.collections[col].writes += 1;
    }
  } catch (err: any) {
    console.error("Firestore Write Failed", collectionName, err);
    logWriteFailure(collectionName, `updateDocument:${docId}`, err);
    throw err;
  }
}

// Generic Delete Document
export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  markServiceConnected('firestore');
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);

    console.log("Firestore Write Success", collectionName, docId);

    const col = collectionName as keyof typeof firestoreAuditStats.collections;
    if (firestoreAuditStats.collections[col]) {
      firestoreAuditStats.collections[col].deletes += 1;
    }
  } catch (err: any) {
    console.error("Firestore Write Failed", collectionName, err);
    logWriteFailure(collectionName, `deleteDocument:${docId}`, err);
    throw err;
  }
}

// Generic Get Document
export async function getDocument(collectionName: string, docId: string): Promise<any> {
  markServiceConnected('firestore');
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    const col = collectionName as keyof typeof firestoreAuditStats.collections;
    if (firestoreAuditStats.collections[col]) {
      firestoreAuditStats.collections[col].reads += 1;
    }

    if (!docSnap.exists()) {
      console.log("Firestore Read Success", collectionName, `${docId} (not found)`);
      return null;
    }
    console.log("Firestore Read Success", collectionName, docId);
    return { id: docSnap.id, ...docSnap.data() };
  } catch (err: any) {
    console.error("Firestore Read Failed", collectionName, err);
    throw err;
  }
}

// Generic Get Collection
export async function getCollection(collectionName: string, queryConstraints: any[] = []): Promise<any[]> {
  markServiceConnected('firestore');
  const colRef = collection(db, collectionName);
  let q = query(colRef);
  if (queryConstraints.length > 0) {
    q = query(colRef, ...queryConstraints);
  }
  try {
    const querySnap = await getDocs(q);
    const results: any[] = [];
    for (const docSnap of querySnap.docs) {
      results.push(await mapSnapshotToData<any>(docSnap, collectionName));
    }
    console.log("Firestore Read Success", collectionName);
    return results;
  } catch (err: any) {
    console.error("Firestore Read Failed", collectionName, err);
    throw err;
  }
}

/* ==========================================
   DOMAINS TYPED PERSISTENCE LAYER
   ========================================== */

export async function setUserProfile(profileData: Omit<UserProfile, 'userId'>, provider: string = 'google'): Promise<UserProfile> {
  const uid = await getAuthenticatedUserId();
  const data = {
    ...profileData,
    userId: uid,
    uid,
    name: profileData.name || 'Traveler',
    email: profileData.email || '',
    photoURL: profileData.photoURL || profileData.profile_photo_url || '',
    provider,
    createdAt: profileData.createdAt || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    role: profileData.role || 'traveler'
  };
  return createDocument('users', data, uid);
}

export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  const targetUid = userId || await getAuthenticatedUserId();
  return getDocument('users', targetUid);
}

export async function updateUserProfile(profileData: Partial<Omit<UserProfile, 'userId'>>): Promise<void> {
  const uid = await getAuthenticatedUserId();
  return updateDocument('users', uid, profileData);
}

export async function createItinerary(itinerary: any, customId?: string): Promise<any> {
  const uid = await getAuthenticatedUserId();
  const data = {
    ...itinerary,
    userId: uid,
    destination: itinerary.destination || '',
    startDate: itinerary.start_date || itinerary.startDate || '',
    endDate: itinerary.end_date || itinerary.endDate || '',
    travelers: itinerary.travelers || 1,
    budget: itinerary.budget || 0,
    generatedItinerary: JSON.stringify(itinerary.activities || itinerary),
    activities: itinerary.activities || [],
    hotels: itinerary.hotels || [],
    restaurants: itinerary.restaurants || [],
    transport: itinerary.transport || [],
    createdAt: new Date().toISOString()
  };
  return createDocument('itineraries', data, customId);
}

export async function getItineraries(): Promise<Itinerary[]> {
  const uid = await getAuthenticatedUserId();
  const qConstraints = [where('userId', '==', uid)];
  return getCollection('itineraries', qConstraints);
}

export async function updateItinerary(id: string, data: Partial<Omit<Itinerary, 'userId'>>): Promise<void> {
  const uid = await getAuthenticatedUserId();
  const docRef = doc(db, 'itineraries', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Document not found.');
  if (docSnap.data().userId !== uid) throw new Error('Unauthorized: You do not own this itinerary.');
  return updateDocument('itineraries', id, data);
}

export async function deleteItinerary(id: string): Promise<void> {
  const uid = await getAuthenticatedUserId();
  const docRef = doc(db, 'itineraries', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Document not found.');
  if (docSnap.data().userId !== uid) throw new Error('Unauthorized: You do not own this itinerary.');
  return deleteDocument('itineraries', id);
}

export async function createBooking(booking: any, customId?: string): Promise<any> {
  const uid = await getAuthenticatedUserId();
  const data = {
    ...booking,
    userId: uid,
    bookingType: booking.booking_type || booking.bookingType || 'general',
    bookingDetails: booking.journey_details || booking.bookingDetails || {},
    amount: booking.amount_paid || booking.amount || 0,
    status: booking.status || 'confirmed',
    createdAt: new Date().toISOString()
  };

  const bookingType = (booking.booking_type || booking.bookingType || '').toLowerCase();
  const collectionMap: Record<string, string> = {
    flight: 'flights',
    hotel: 'hotels',
    train: 'trains',
    bus: 'buses',
    homestay: 'homestays'
  };
  const targetCol = collectionMap[bookingType];
  if (targetCol && customId) {
    try {
      await createDocument(targetCol, {
        userId: uid,
        bookingId: customId,
        details: booking.journey_details || {},
        createdAt: new Date().toISOString()
      }, customId);
    } catch (fsErr) {
      console.error(`[Firestore ${targetCol} Booking Sync Failed]:`, fsErr);
    }
  }

  return createDocument('bookings', data, customId);
}

export async function getBookings(): Promise<Booking[]> {
  const uid = await getAuthenticatedUserId();
  const qConstraints = [where('userId', '==', uid)];
  return getCollection('bookings', qConstraints);
}

export async function cancelBooking(id: string): Promise<void> {
  const uid = await getAuthenticatedUserId();
  const docRef = doc(db, 'bookings', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Booking not found.');
  if (docSnap.data().userId !== uid) throw new Error('Unauthorized: You do not own this booking.');
  return updateDocument('bookings', id, { status: 'cancelled' });
}

export async function createReel(reel: any): Promise<any> {
  const uid = await getAuthenticatedUserId();
  const data = {
    ...reel,
    userId: uid,
    likes_count: reel.likes_count ?? 0,
    comments_count: reel.comments_count ?? 0,
    comments: reel.comments ?? [],
    createdAt: new Date().toISOString()
  };

  try {
    await createDocument('travel_reels', {
      userId: uid,
      title: reel.caption || reel.title || 'Travel Clip',
      videoUrl: reel.videoUrl || reel.video_url || '',
      thumbnail: reel.thumbnail || reel.avatar || '',
      likes: reel.likes_count || 0,
      views: reel.views || 0,
      createdAt: new Date().toISOString()
    });
  } catch (fsErr) {
    console.error('[Firestore Travel Reels Sync Failed]:', fsErr);
  }

  return createDocument('reels', data);
}

export async function getReels(): Promise<Reel[]> {
  return getCollection('reels');
}

export async function getUserReels(userId?: string): Promise<Reel[]> {
  const targetUid = userId || await getAuthenticatedUserId();
  const qConstraints = [where('userId', '==', targetUid)];
  return getCollection('reels', qConstraints);
}

export async function updateReel(id: string, data: Partial<Reel>): Promise<void> {
  return updateDocument('reels', id, data);
}

export async function addReelComment(reelId: string, comment: { id: string; user: string; text: string }): Promise<void> {
  const docRef = doc(db, 'reels', reelId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Reel not found.');
  const currentComments = docSnap.data().comments || [];
  const currentCount = docSnap.data().comments_count || 0;
  return updateDocument('reels', reelId, {
    comments: [...currentComments, comment],
    comments_count: currentCount + 1
  });
}

export async function deleteReel(id: string): Promise<void> {
  const uid = await getAuthenticatedUserId();
  const docRef = doc(db, 'reels', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Reel not found.');
  if (docSnap.data().userId !== uid) throw new Error('Unauthorized: You do not own this reel.');
  return deleteDocument('reels', id);
}

export async function createReview(review: any): Promise<any> {
  const uid = await getAuthenticatedUserId();
  const data = {
    ...review,
    userId: uid,
    targetId: review.targetId || review.target_id || '',
    rating: review.rating || 5,
    reviewText: review.comment || review.reviewText || '',
    createdAt: new Date().toISOString()
  };
  return createDocument('reviews', data);
}

export async function getTargetReviews(targetId: string): Promise<Review[]> {
  const qConstraints = [where('targetId', '==', targetId)];
  return getCollection('reviews', qConstraints);
}

export async function deleteReview(id: string): Promise<void> {
  const uid = await getAuthenticatedUserId();
  const docRef = doc(db, 'reviews', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Review not found.');
  if (docSnap.data().userId !== uid) throw new Error('Unauthorized: You do not own this review.');
  return deleteDocument('reviews', id);
}

export async function createFavorite(favorite: Omit<Favorite, 'userId'>): Promise<Favorite> {
  const uid = await getAuthenticatedUserId();
  const colRef = collection(db, 'favorites');
  const q = query(colRef, where('userId', '==', uid), where('targetId', '==', favorite.targetId));
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    return { id: querySnap.docs[0].id, userId: uid, ...favorite };
  }
  const data = {
    ...favorite,
    userId: uid
  };
  return createDocument('favorites', data);
}

export async function getFavorites(): Promise<Favorite[]> {
  const uid = await getAuthenticatedUserId();
  const qConstraints = [where('userId', '==', uid)];
  return getCollection('favorites', qConstraints);
}

export async function deleteFavorite(id: string): Promise<void> {
  const uid = await getAuthenticatedUserId();
  const docRef = doc(db, 'favorites', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Favorite not found.');
  if (docSnap.data().userId !== uid) throw new Error('Unauthorized: You do not own this favorite.');
  return deleteDocument('favorites', id);
}

export async function createPost(post: any, customId?: string): Promise<any> {
  const uid = await getAuthenticatedUserId();
  const data = {
    ...post,
    userId: post.userId || uid,
    content: post.content || post.caption || '',
    images: post.images || post.media_urls || [],
    likes: post.likes || post.likes_count || 0,
    comments: post.comments || post.comments_count || 0,
    createdAt: post.createdAt || post.created_at || new Date().toISOString()
  };
  return createDocument('posts', data, customId);
}

export async function createNotification(notification: any, customId?: string): Promise<any> {
  const uid = await getAuthenticatedUserId();
  const data = {
    ...notification,
    userId: notification.userId || uid,
    title: notification.title || '',
    message: notification.message || notification.body || '',
    isRead: notification.isRead || notification.read || false,
    createdAt: notification.createdAt || notification.created_at || new Date().toISOString()
  };
  return createDocument('notifications', data, customId);
}

export async function createPayment(payment: any, customId?: string): Promise<any> {
  const uid = await getAuthenticatedUserId();
  const data = {
    ...payment,
    userId: uid,
    amount: payment.amount || 0,
    paymentMethod: payment.paymentMethod || payment.payment_method || 'stripe',
    transactionId: payment.transactionId || payment.payment_reference || payment.payment_id || customId || '',
    status: payment.status || 'succeeded',
    createdAt: new Date().toISOString()
  };
  return createDocument('payments', data, customId);
}

// Dynamic Audit Connection Test Panel Data (All 17 collections)
export async function runFirebaseAudit(): Promise<any> {
  const auditReport = {
    authConnected: !!auth.currentUser,
    firestoreConnected: false,
    collectionCounts: {
      users: 0,
      itineraries: 0,
      bookings: 0,
      notifications: 0,
      posts: 0,
      reels: 0,
      favorites: 0,
      reviews: 0,
      hotels: 0,
      flights: 0,
      trains: 0,
      buses: 0,
      homestays: 0,
      saved_places: 0,
      search_history: 0,
      ai_chats: 0,
      travel_reels: 0,
      payments: 0
    },
    missingIntegrations: [] as string[]
  };

  if (auth.currentUser) {
    auditReport.authConnected = true;
    firestoreAuditStats.connectedServices.auth = true;
  }

  try {
    const uid = auth.currentUser?.uid;
    auditReport.firestoreConnected = true;
    firestoreAuditStats.connectedServices.firestore = true;

    const checkCollection = async (name: string, isUserFiltered: boolean) => {
      try {
        let snap;
        if (isUserFiltered && uid) {
          const q = query(collection(db, name), where('userId', '==', uid));
          snap = await getDocs(q);
        } else {
          snap = await getDocs(collection(db, name));
        }
        (auditReport.collectionCounts as any)[name] = snap.size;
      } catch (err: any) {
        console.warn(`[Firestore Audit] Collection "${name}" fetch failed:`, err.message);
      }
    };

    await Promise.all([
      checkCollection('users', true),
      checkCollection('itineraries', true),
      checkCollection('bookings', true),
      checkCollection('notifications', true),
      checkCollection('favorites', true),
      checkCollection('reels', false),
      checkCollection('posts', false),
      checkCollection('reviews', false),
      checkCollection('hotels', false),
      checkCollection('flights', false),
      checkCollection('trains', false),
      checkCollection('buses', false),
      checkCollection('homestays', false),
      checkCollection('saved_places', true),
      checkCollection('search_history', true),
      checkCollection('ai_chats', true),
      checkCollection('travel_reels', false),
      checkCollection('payments', true)
    ]);

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
