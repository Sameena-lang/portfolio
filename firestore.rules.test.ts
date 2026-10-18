/**
 * Phase 0 & Phase 5 Security Rules Verification Suite
 * Verifies that all 12 "Dirty Dozen" adversarial payloads defined in security_spec.md
 * are rejected with PERMISSION_DENIED by the Firestore Security Rules.
 */

export interface AdversarialTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TEST_CASES: AdversarialTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Write to Inquiries',
    collectionPath: '/inquiries/inq_1',
    operation: 'create',
    auth: null,
    payload: {
      authorUid: 'u1',
      authorName: 'Attacker',
      subject: 'Hello',
      message: 'Unauthenticated message attempt.',
      status: 'submitted',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Admin Spoof',
    collectionPath: '/inquiries/inq_1',
    operation: 'get',
    auth: { uid: 'spoof_uid', email: 'sameenap203@gmail.com', email_verified: false },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Identity Spoofing on Inquiry Create',
    collectionPath: '/inquiries/inq_2',
    operation: 'create',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      authorUid: 'user_b',
      authorName: 'Spoofed User',
      subject: 'Valid subject',
      message: 'Attempting to spoof another user UID.',
      status: 'submitted',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Inquiry Create',
    collectionPath: '/inquiries/inq_3',
    operation: 'create',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      authorUid: 'user_a',
      authorName: 'Alice',
      subject: 'Collaboration',
      message: 'Injecting shadow field isVerified.',
      status: 'submitted',
      isVerified: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow Field Injection on SavedResearch Update',
    collectionPath: '/savedResearch/rec_1',
    operation: 'update',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      notes: 'Updated note',
      role: 'superadmin',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'ID Poisoning with Special Characters',
    collectionPath: '/inquiries/invalid$id!@#',
    operation: 'create',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      authorUid: 'user_a',
      authorName: 'Alice',
      subject: 'Collaboration',
      message: 'Valid length message body.',
      status: 'submitted',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Denial-of-Wallet Oversized String',
    collectionPath: '/inquiries/inq_4',
    operation: 'create',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      authorUid: 'user_a',
      authorName: 'Alice',
      subject: 'Collaboration',
      message: 'X'.repeat(5000),
      status: 'submitted',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Client Timestamp Forgery on Create',
    collectionPath: '/savedResearch/rec_2',
    operation: 'create',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      ownerUid: 'user_a',
      uniprotAccession: 'P04637',
      geneSymbol: 'TP53',
      proteinName: 'Cellular tumor antigen p53',
      projectContext: 'Brain Tumor MRI',
      notes: 'Forged past timestamp',
      createdAt: '1999-01-01T00:00:00Z',
      updatedAt: '1999-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immortal Field Mutation (ownerUid)',
    collectionPath: '/savedResearch/rec_2',
    operation: 'update',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      ownerUid: 'user_b',
      notes: 'Transferring ownership illegally',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Terminal State Bypass on Archived Inquiry',
    collectionPath: '/inquiries/inq_archived',
    operation: 'update',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      message: 'Attempting to mutate after status is archived',
      status: 'submitted',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Cross-Tenant List Scraping on SavedResearch',
    collectionPath: '/savedResearch',
    operation: 'list',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Invalid UniProt Accession Pattern Injection',
    collectionPath: '/savedResearch/rec_3',
    operation: 'create',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      ownerUid: 'user_a',
      uniprotAccession: '<script>xss</script>',
      geneSymbol: 'TP53',
      proteinName: 'Cellular tumor antigen p53',
      projectContext: 'Brain Tumor MRI',
      notes: 'Malformed accession test',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
