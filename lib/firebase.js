import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyACb-3RNc25_c7zQtS1UyXpCzAGWQbV2nk',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ourstorebd-7917f.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ourstorebd-7917f',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ourstorebd-7917f.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '362221465217',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:362221465217:web:1ab5a8d9931a93becaa780',
}

// Initialize Firebase only once (prevent duplicate app initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Firestore instance
export const db = getFirestore(app)

export default app
