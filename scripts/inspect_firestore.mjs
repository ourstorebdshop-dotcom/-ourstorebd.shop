import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const collections = ['products', 'categories', 'banners', 'coupons', 'orders', 'customers', 'conversations']
const settingsDocs = [
    'hero', 'shipping', 'contact', 'header_footer', 'favicon',
    'fraud', 'cashflow', 'api_settings', 'tracking', 'integrations'
]

async function inspect() {
    console.log('=== INSPECTING FIRESTORE COLLECTIONS ===')
    for (const col of collections) {
        try {
            const snap = await getDocs(collection(db, col))
            console.log(`Collection [${col}]: ${snap.size} documents`)
            snap.docs.slice(0, 3).forEach(d => {
                const data = d.data()
                console.log(`  - docId: ${d.id}, sample keys: ${Object.keys(data).slice(0, 5).join(', ')}`)
            })
        } catch (e) {
            console.error(`Error reading collection ${col}:`, e.message)
        }
    }

    console.log('\n=== INSPECTING SETTINGS DOCUMENTS ===')
    for (const setting of settingsDocs) {
        try {
            const snap = await getDoc(doc(db, 'settings', setting))
            if (snap.exists()) {
                const data = snap.data()
                console.log(`Setting [settings/${setting}]: EXISTS, keys: ${Object.keys(data).slice(0, 5).join(', ')}`)
            } else {
                console.log(`Setting [settings/${setting}]: DOES NOT EXIST (empty)`)
            }
        } catch (e) {
            console.error(`Error reading settings/${setting}:`, e.message)
        }
    }
    process.exit(0)
}

inspect()
