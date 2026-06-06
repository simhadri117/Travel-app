import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_wanderwise_jwt_key_2026_dev';

// Initialize Firebase Admin if service account JSON path is provided in .env
let firebaseAdminInitialized = false;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (serviceAccountPath) {
  try {
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    if (fs.existsSync(absolutePath)) {
      admin.initializeApp({
        credential: admin.credential.cert(absolutePath)
      });
      firebaseAdminInitialized = true;
      console.log('[Firebase Auth] Firebase Admin SDK initialized successfully.');
    } else {
      console.warn(`[Firebase Auth] Service account file not found at: ${absolutePath}`);
    }
  } catch (err: any) {
    console.error('[Firebase Auth] Failed to initialize Firebase Admin:', err.message);
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone?: string;
  };
}

export function generateToken(userId: string, phone?: string): string {
  return jwt.sign({ id: userId, phone: phone || '' }, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; email?: string; name?: string; picture?: string }> {
  // 1. If Firebase Admin is initialized, use it to verify the ID token cryptographically
  if (firebaseAdminInitialized) {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture
    };
  }

  // 2. Fallback: call the Google Identity Toolkit REST API which verifies the ID token's validity
  // using Google's public certificates. This is secure and works without a service account JSON.
  const firebaseApiKey = process.env.FIREBASE_API_KEY || 'AIzaSyC-DRPpZ02gfADJdPaPwoQiJ9IW1lTvtT0';
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`;
  const response = await axios.post(url, { idToken });
  const user = response.data.users?.[0];
  if (!user) {
    throw new Error('Invalid Firebase ID token');
  }
  return {
    uid: user.localId,
    email: user.email,
    name: user.displayName,
    picture: user.photoUrl
  };
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Try local JWT token verification first
  const decoded = verifyToken(token);
  if (decoded) {
    req.user = decoded;
    return next();
  }

  // 2. Try Firebase ID Token verification if Firebase Admin is initialized
  if (firebaseAdminInitialized) {
    try {
      const decodedIdToken = await admin.auth().verifyIdToken(token);
      const phone = decodedIdToken.phone_number || `firebase_${decodedIdToken.uid.substring(0, 10)}`;
      const email = decodedIdToken.email || '';
      
      let user = await User.findOne({
        $or: [
          { phone },
          ...(email ? [{ email }] : [])
        ]
      });

      if (!user) {
        user = new User({
          phone,
          email: email || undefined,
          name: decodedIdToken.name || 'Firebase User',
          profile_photo_url: decodedIdToken.picture || ''
        });
        await user.save();
      }

      req.user = { id: user._id.toString(), phone: user.phone };
      return next();
    } catch (err: any) {
      console.error('[Firebase Auth] Token verification failed:', err.message);
    }
  }

  return res.status(401).json({ success: false, error: 'Token expired or invalid' });
}

export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  // 1. Try local JWT token verification first
  const decoded = verifyToken(token);
  if (decoded) {
    req.user = decoded;
    return next();
  }

  // 2. Try Firebase ID Token verification if Firebase Admin is initialized
  if (firebaseAdminInitialized) {
    try {
      const decodedIdToken = await admin.auth().verifyIdToken(token);
      const phone = decodedIdToken.phone_number || `firebase_${decodedIdToken.uid.substring(0, 10)}`;
      const email = decodedIdToken.email || '';
      
      let user = await User.findOne({
        $or: [
          { phone },
          ...(email ? [{ email }] : [])
        ]
      });

      if (!user) {
        user = new User({
          phone,
          email: email || undefined,
          name: decodedIdToken.name || 'Firebase User',
          profile_photo_url: decodedIdToken.picture || ''
        });
        await user.save();
      }

      req.user = { id: user._id.toString(), phone: user.phone };
      return next();
    } catch (err: any) {
      console.error('[Firebase Auth] Token verification failed:', err.message);
    }
  }

  return next();
}
