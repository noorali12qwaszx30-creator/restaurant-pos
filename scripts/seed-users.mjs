/**
 * seed-users.mjs
 * Run once to create test users in Firebase Auth + Firestore
 *
 * Usage:
 *   node scripts/seed-users.mjs
 *
 * Requirements:
 *   npm install firebase   (already installed)
 *   .env file must exist with valid Firebase credentials
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env manually (no dotenv needed) ───────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
});

// ── Firebase init ────────────────────────────────────────────────
const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

// ── Test users ───────────────────────────────────────────────────
const USERS = [
  {
    username: "admin",
    password: "Admin@123",
    displayName: "مدير النظام",
    roles: ["admin"],
  },
  {
    username: "cashier1",
    password: "Cash@123",
    displayName: "كاشير 1",
    roles: ["cashier"],
  },
  {
    username: "field1",
    password: "Field@123",
    displayName: "ميدان 1",
    roles: ["field"],
  },
  {
    username: "delivery1",
    password: "Delivery@123",
    displayName: "مندوب التوصيل",
    roles: ["delivery"],
  },
  {
    username: "takeaway1",
    password: "Take@123",
    displayName: "تيك أواي 1",
    roles: ["takeaway"],
  },
  {
    username: "kitchen1",
    password: "Kitchen@123",
    displayName: "طاهي المطبخ",
    roles: ["kitchen"],
  },
  {
    username: "super",
    password: "Super@123",
    displayName: "مستخدم متعدد الأدوار",
    roles: ["cashier", "takeaway", "admin"],
  },
];

// ── Create or update each user ───────────────────────────────────
async function seedUser(user) {
  const email = `${user.username}@restaurant.local`;

  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, user.password);
    uid = cred.user.uid;
    console.log(`✅ Created  → ${user.username} (${email})`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      const cred = await signInWithEmailAndPassword(auth, email, user.password);
      uid = cred.user.uid;
      console.log(`⏩ Exists   → ${user.username} (updated Firestore doc)`);
    } else {
      console.error(`❌ Failed   → ${user.username}: ${err.message}`);
      return;
    }
  }

  await setDoc(
    doc(db, "users", uid),
    {
      username: user.username,
      email,
      displayName: user.displayName,
      roles: user.roles,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

console.log("\n🚀 Seeding test users...\n");
for (const user of USERS) {
  await seedUser(user);
}

console.log("\n✔  Done! Users ready.\n");
process.exit(0);
