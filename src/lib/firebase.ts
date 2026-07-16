/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

// Initialize Firebase Auth
const auth = getAuth(app);

// Setup Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Add redirect URL configuration
if (typeof window !== "undefined") {
  const redirectUrl = window.location.origin;
  console.log("Firebase Auth initialized for:", redirectUrl);
  console.log("OAuth Client ID configured:", firebaseConfig.oAuthClientId ? "Yes" : "No");
}

export { app, db, auth, googleProvider };


