/**
 * Deploy Firestore security rules using the Firebase Admin REST API
 * This bypasses the Firebase CLI login requirement
 */
import { readFileSync } from 'fs'
import { GoogleAuth } from 'google-auth-library'

const PROJECT_ID = 'ourstorebd-7917f'

async function deployRules() {
    // Read the service account key
    const saKey = JSON.parse(readFileSync('sa-key-temp.json', 'utf8'))
    
    // Read the rules file
    const rulesSource = readFileSync('firestore.rules', 'utf8')
    
    // Create auth client
    const auth = new GoogleAuth({
        credentials: saKey,
        scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
    })
    
    const client = await auth.getClient()
    const token = await client.getAccessToken()
    
    // Step 1: Create a new ruleset
    const createUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`
    
    const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            source: {
                files: [{
                    name: 'firestore.rules',
                    content: rulesSource,
                }]
            }
        })
    })
    
    if (!createRes.ok) {
        const err = await createRes.text()
        console.error('Failed to create ruleset:', createRes.status, err)
        process.exit(1)
    }
    
    const ruleset = await createRes.json()
    console.log('✅ Ruleset created:', ruleset.name)
    
    // Step 2: Release the ruleset to Firestore
    const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases`
    const releaseName = `projects/${PROJECT_ID}/releases/cloud.firestore`
    
    // Try update first (PATCH), fall back to create (POST)
    const patchUrl = `https://firebaserules.googleapis.com/v1/${releaseName}`
    const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            release: {
                name: releaseName,
                rulesetName: ruleset.name,
            }
        })
    })
    
    if (patchRes.ok) {
        console.log('✅ Firestore rules deployed successfully!')
        return
    }
    
    // Try POST if PATCH fails
    const postRes = await fetch(releaseUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: releaseName,
            rulesetName: ruleset.name,
        })
    })
    
    if (postRes.ok) {
        console.log('✅ Firestore rules deployed successfully!')
    } else {
        const err = await postRes.text()
        console.error('Failed to release ruleset:', postRes.status, err)
        process.exit(1)
    }
}

deployRules().catch(err => {
    console.error('Deploy failed:', err)
    process.exit(1)
})
