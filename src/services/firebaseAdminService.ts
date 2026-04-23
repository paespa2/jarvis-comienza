/**
 * FIREBASE ADMIN SERVICE
 *
 * Server-side Firebase Admin SDK initialization
 * Provides secure admin access to Firestore and Realtime Database
 * Used for: User management, permission control, batch operations, data validation
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as process from 'process';

let adminApp: admin.app.App | null = null;
let db: admin.firestore.Firestore | null = null;
let rtdb: admin.database.Database | null = null;
let auth: admin.auth.Auth | null = null;

/**
 * Initialize Firebase Admin SDK
 * Supports multiple methods for loading service account:
 * 1. GOOGLE_APPLICATION_CREDENTIALS env var (recommended for production)
 * 2. serviceAccountKey.json in project root
 * 3. serviceAccountKey.json in .config directory (for sensitive deployments)
 */
export function initializeFirebaseAdmin(): void {
  if (adminApp) {
    console.log('✅ [FirebaseAdmin] Already initialized');
    return;
  }

  try {
    let serviceAccountPath: string | null = null;
    let serviceAccount: any = null;

    // Method 1: Check GOOGLE_APPLICATION_CREDENTIALS environment variable
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      console.log('🔐 [FirebaseAdmin] Using GOOGLE_APPLICATION_CREDENTIALS:', serviceAccountPath);
    }
    // Method 2: Check .config directory (hidden, secure location)
    else if (fs.existsSync(path.join(process.cwd(), '.config', 'serviceAccountKey.json'))) {
      serviceAccountPath = path.join(process.cwd(), '.config', 'serviceAccountKey.json');
      console.log('🔐 [FirebaseAdmin] Found serviceAccountKey in .config');
    }
    // Method 3: Check project root
    else if (fs.existsSync(path.join(process.cwd(), 'serviceAccountKey.json'))) {
      serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      console.log('⚠️  [FirebaseAdmin] Using serviceAccountKey from project root (less secure)');
    }

    if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
      console.warn('⚠️  [FirebaseAdmin] Service account key not found. Admin SDK will not be initialized.');
      console.warn('   Place serviceAccountKey.json in .config/ or set GOOGLE_APPLICATION_CREDENTIALS');
      return;
    }

    // Load service account
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

    // Load Firebase config for database URL
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let databaseURL = process.env.VITE_FIREBASE_DB_URL || 'https://asistente-jarvis-1741893602789-default-rtdb.firebaseio.com';

    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      databaseURL = firebaseConfig.databaseURL || databaseURL;
    }

    // Initialize Admin SDK
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseURL,
      projectId: serviceAccount.project_id
    });

    // Initialize services
    db = admin.firestore();
    rtdb = admin.database();
    auth = admin.auth();

    console.log('✅ [FirebaseAdmin] Admin SDK initialized successfully');
    console.log(`   Project: ${serviceAccount.project_id}`);
    console.log(`   Database: ${databaseURL}`);
  } catch (error: any) {
    console.error('❌ [FirebaseAdmin] Initialization failed:', error.message);
    throw error;
  }
}

/**
 * Get Firestore database instance
 */
export function getFirestoreDb(): admin.firestore.Firestore {
  if (!db) {
    initializeFirebaseAdmin();
  }
  if (!db) {
    throw new Error('Firestore database not initialized. Check service account configuration.');
  }
  return db;
}

/**
 * Get Realtime Database instance
 */
export function getRealtimeDb(): admin.database.Database {
  if (!rtdb) {
    initializeFirebaseAdmin();
  }
  if (!rtdb) {
    throw new Error('Realtime database not initialized. Check service account configuration.');
  }
  return rtdb;
}

/**
 * Get Auth instance
 */
export function getAuth(): admin.auth.Auth {
  if (!auth) {
    initializeFirebaseAdmin();
  }
  if (!auth) {
    throw new Error('Auth service not initialized. Check service account configuration.');
  }
  return auth;
}

/**
 * Write to Realtime Database
 */
export async function writeToRTDB(path: string, data: any): Promise<void> {
  try {
    const ref = getRealtimeDb().ref(path);
    await ref.set(data);
    console.log(`✅ [RTDB] Wrote to ${path}`);
  } catch (error: any) {
    console.error(`❌ [RTDB] Failed to write to ${path}:`, error.message);
    throw error;
  }
}

/**
 * Read from Realtime Database
 */
export async function readFromRTDB(path: string): Promise<any> {
  try {
    const ref = getRealtimeDb().ref(path);
    const snapshot = await ref.once('value');
    return snapshot.val();
  } catch (error: any) {
    console.error(`❌ [RTDB] Failed to read from ${path}:`, error.message);
    throw error;
  }
}

/**
 * Update in Realtime Database
 */
export async function updateRTDB(path: string, updates: any): Promise<void> {
  try {
    const ref = getRealtimeDb().ref(path);
    await ref.update(updates);
    console.log(`✅ [RTDB] Updated ${path}`);
  } catch (error: any) {
    console.error(`❌ [RTDB] Failed to update ${path}:`, error.message);
    throw error;
  }
}

/**
 * Delete from Realtime Database
 */
export async function deleteFromRTDB(path: string): Promise<void> {
  try {
    const ref = getRealtimeDb().ref(path);
    await ref.remove();
    console.log(`✅ [RTDB] Deleted ${path}`);
  } catch (error: any) {
    console.error(`❌ [RTDB] Failed to delete ${path}:`, error.message);
    throw error;
  }
}

/**
 * Create custom claims for user (for authorization)
 */
export async function setUserClaims(uid: string, claims: any): Promise<void> {
  try {
    await getAuth().setCustomUserClaims(uid, claims);
    console.log(`✅ [Auth] Set custom claims for user ${uid}`);
  } catch (error: any) {
    console.error(`❌ [Auth] Failed to set claims for ${uid}:`, error.message);
    throw error;
  }
}

/**
 * Create user with email and password
 */
export async function createUser(email: string, password: string): Promise<string> {
  try {
    const user = await getAuth().createUser({
      email,
      password,
      emailVerified: false
    });
    console.log(`✅ [Auth] Created user ${user.uid}`);
    return user.uid;
  } catch (error: any) {
    console.error(`❌ [Auth] Failed to create user ${email}:`, error.message);
    throw error;
  }
}

/**
 * Get user by UID
 */
export async function getUser(uid: string): Promise<admin.auth.UserRecord> {
  try {
    return await getAuth().getUser(uid);
  } catch (error: any) {
    console.error(`❌ [Auth] Failed to get user ${uid}:`, error.message);
    throw error;
  }
}

/**
 * Verify ID token
 */
export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  try {
    return await getAuth().verifyIdToken(token);
  } catch (error: any) {
    console.error('❌ [Auth] Failed to verify token:', error.message);
    throw error;
  }
}

/**
 * Write to Firestore
 */
export async function writeToFirestore(collection: string, docId: string, data: any): Promise<void> {
  try {
    await getFirestoreDb().collection(collection).doc(docId).set(data, { merge: true });
    console.log(`✅ [Firestore] Wrote to ${collection}/${docId}`);
  } catch (error: any) {
    console.error(`❌ [Firestore] Failed to write:`, error.message);
    throw error;
  }
}

/**
 * Read from Firestore
 */
export async function readFromFirestore(collection: string, docId: string): Promise<any> {
  try {
    const doc = await getFirestoreDb().collection(collection).doc(docId).get();
    return doc.exists ? doc.data() : null;
  } catch (error: any) {
    console.error(`❌ [Firestore] Failed to read:`, error.message);
    throw error;
  }
}

/**
 * Query Firestore
 */
export async function queryFirestore(
  collection: string,
  field: string,
  operator: any,
  value: any
): Promise<any[]> {
  try {
    const querySnapshot = await getFirestoreDb()
      .collection(collection)
      .where(field, operator, value)
      .get();

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    console.error(`❌ [Firestore] Query failed:`, error.message);
    throw error;
  }
}

/**
 * Delete from Firestore
 */
export async function deleteFromFirestore(collection: string, docId: string): Promise<void> {
  try {
    await getFirestoreDb().collection(collection).doc(docId).delete();
    console.log(`✅ [Firestore] Deleted ${collection}/${docId}`);
  } catch (error: any) {
    console.error(`❌ [Firestore] Failed to delete:`, error.message);
    throw error;
  }
}

export default {
  initializeFirebaseAdmin,
  getFirestoreDb,
  getRealtimeDb,
  getAuth,
  writeToRTDB,
  readFromRTDB,
  updateRTDB,
  deleteFromRTDB,
  setUserClaims,
  createUser,
  getUser,
  verifyIdToken,
  writeToFirestore,
  readFromFirestore,
  queryFirestore,
  deleteFromFirestore
};
