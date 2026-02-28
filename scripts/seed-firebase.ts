import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PRODUCTION SEEDING SCRIPT
 * 
 * This script migrates the scraped conservatorium data and initial mock users
 * into a production Firebase project.
 * 
 * PRE-REQUISITES:
 * 1. Download service-account-file.json from Firebase Console.
 * 2. Set FIREBASE_SERVICE_ACCOUNT_PATH environment variable.
 */

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account-file.json';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')))
    });
}

const db = admin.firestore();

async function seedConservatoriums() {
    console.log('Seeding conservatoriums...');
    const conservatoriumsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/Conservatoriums/conservatoriums.json'), 'utf8'));

    const batch = db.batch();

    for (const cons of conservatoriumsData) {
        const docRef = db.collection('conservatoriums').doc(`cons-${cons.id}`);
        batch.set(docRef, {
            ...cons,
            tier: cons.id % 3 === 0 ? 'A' : (cons.id % 2 === 0 ? 'B' : 'C'), // Initial tier distribution
            newFeaturesEnabled: true,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    await batch.commit();
    console.log(`Successfully seeded ${conservatoriumsData.length} conservatoriums.`);
}

async function seedInitialAdmins() {
    console.log('Seeding initial admins...');
    // Example of seeding a site admin
    const siteAdminEmail = 'admin@harmonia.co.il';
    try {
        const userRecord = await admin.auth().createUser({
            email: siteAdminEmail,
            emailVerified: true,
            password: 'HarmonyDefault123!',
            displayName: 'Global Site Admin',
        });

        await db.collection('users').doc(userRecord.uid).set({
            id: userRecord.uid,
            email: siteAdminEmail,
            name: 'Global Site Admin',
            role: 'site_admin',
            approved: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('Site admin created.');
    } catch (error) {
        console.error('Error seeding site admin:', error);
    }
}

async function main() {
    try {
        await seedConservatoriums();
        await seedInitialAdmins();
        console.log('Production seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

main();
