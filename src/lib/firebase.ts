import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };

export interface SavedResearchRecord {
  id: string;
  ownerUid: string;
  uniprotAccession: string;
  geneSymbol: string;
  proteinName: string;
  projectContext: string;
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CloudInquiryRecord {
  id: string;
  authorUid: string;
  authorName: string;
  subject: string;
  message: string;
  status: 'submitted' | 'archived';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120) || `doc_${Date.now()}`;
}

export async function createCloudInquiry(params: {
  authorName: string;
  subject: string;
  message: string;
}): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Please sign in with Google to save inquiries to Firestore.');
  }

  const inquiryId = sanitizeId(`inq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const path = `inquiries/${inquiryId}`;

  const cleanAuthorName = params.authorName.trim().slice(0, 100);
  const cleanSubject = params.subject.trim().slice(0, 160);
  const cleanMessage = params.message.trim().slice(0, 2000);

  try {
    await setDoc(doc(db, 'inquiries', inquiryId), {
      authorUid: currentUser.uid,
      authorName: cleanAuthorName.length >= 2 ? cleanAuthorName : currentUser.displayName || 'Visitor',
      subject: cleanSubject.length >= 3 ? cleanSubject : 'Portfolio Inquiry',
      message: cleanMessage.length >= 10 ? cleanMessage : cleanMessage.padEnd(10, '.'),
      status: 'submitted',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return inquiryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserInquiries(
  uid: string,
  onData: (records: CloudInquiryRecord[]) => void
): () => void {
  const path = 'inquiries';
  const q = query(collection(db, path), where('authorUid', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: CloudInquiryRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CloudInquiryRecord, 'id'>),
      }));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createSavedResearchRecord(params: {
  uniprotAccession: string;
  geneSymbol: string;
  proteinName: string;
  projectContext: string;
  notes: string;
}): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Please sign in with Google to save research records to Firestore.');
  }

  const recordId = sanitizeId(`res_${params.uniprotAccession}_${Date.now()}`);
  const path = `savedResearch/${recordId}`;

  const cleanAccession = params.uniprotAccession
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 20);
  const cleanSymbol = params.geneSymbol.trim().slice(0, 30) || 'GENE';
  const cleanProtein = params.proteinName.trim().slice(0, 240) || 'Protein Target';
  const cleanContext = params.projectContext.trim().slice(0, 120) || 'Bioinformatics Lab';
  const cleanNotes = params.notes.trim().slice(0, 1000) || 'Saved from Science Workbench.';

  try {
    await setDoc(doc(db, 'savedResearch', recordId), {
      ownerUid: currentUser.uid,
      uniprotAccession: cleanAccession.length >= 4 ? cleanAccession : 'P04637',
      geneSymbol: cleanSymbol,
      proteinName: cleanProtein,
      projectContext: cleanContext,
      notes: cleanNotes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return recordId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSavedResearchRecord(recordId: string): Promise<void> {
  const path = `savedResearch/${recordId}`;
  try {
    await deleteDoc(doc(db, 'savedResearch', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeSavedResearch(
  uid: string,
  onData: (records: SavedResearchRecord[]) => void
): () => void {
  const path = 'savedResearch';
  const q = query(collection(db, path), where('ownerUid', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedResearchRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SavedResearchRecord, 'id'>),
      }));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
