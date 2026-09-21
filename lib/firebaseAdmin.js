import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

/**
 * Initialize Firebase Admin SDK for server-side operations.
 * Admin SDK bypasses Firestore security rules entirely.
 *
 * Authentication priority:
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string) — recommended for Vercel
 * 2. GOOGLE_APPLICATION_CREDENTIALS env var (file path) — for local/GCP
 * 3. Fallback: projectId-only init (limited, works in some GCP environments)
 */
function initAdmin() {
    if (getApps().length > 0) {
        return getApps()[0]
    }

    // Option 1: Service account JSON string (Vercel-friendly)
    let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (serviceAccountKey) {
        try {
            serviceAccountKey = serviceAccountKey.trim().replace(/^\uFEFF/, '')
            // Strip outer quotes if wrapped
            if ((serviceAccountKey.startsWith("'") && serviceAccountKey.endsWith("'")) ||
                (serviceAccountKey.startsWith('"') && serviceAccountKey.endsWith('"'))) {
                serviceAccountKey = serviceAccountKey.slice(1, -1).trim()
            }
            // If base64 encoded, decode it
            if (!serviceAccountKey.startsWith('{')) {
                try {
                    const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf8')
                    if (decoded.trim().startsWith('{')) {
                        serviceAccountKey = decoded.trim()
                    }
                } catch {}
            }
            let serviceAccount = JSON.parse(serviceAccountKey)
            // If double stringified
            if (typeof serviceAccount === 'string') {
                serviceAccount = JSON.parse(serviceAccount)
            }
            // Ensure proper newlines in private key for Vercel
            if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
            }
            return initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            })
        } catch (e) {
            console.error('[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message)
        }
    }

    // Option 2: Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS file path)
    // This works automatically in GCP environments or when the env var points to a key file
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        })
    }

    // Option 3: Fallback — projectId only (may work in some environments)
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (projectId) {
        console.warn('[FirebaseAdmin] No service account found. Initializing with projectId only. Writes may fail.')
        return initializeApp({ projectId })
    }

    throw new Error('[FirebaseAdmin] Cannot initialize: no credentials or projectId found.')
}

const adminApp = initAdmin()
export const adminDb = getFirestore(adminApp)
export { FieldValue }
export default adminApp
