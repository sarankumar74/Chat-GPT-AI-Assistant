/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";
import { LogIn, UserPlus, ShieldAlert, Sparkles } from "lucide-react";

interface AuthProps {
  onAuthSuccess: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile display name
        await updateProfile(user, {
          displayName: displayName || email.split("@")[0],
        });

        // Initialize user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName || email.split("@")[0],
          photoURL: user.photoURL || null,
          createdAt: Date.now(),
        });
      } else {
        // Sign in with existing credentials
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Ensure user document exists in Firestore (fallback if created elsewhere)
        const userRef = doc(db, "users", userCredential.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName || email.split("@")[0],
            photoURL: userCredential.user.photoURL || null,
            createdAt: Date.now(),
          });
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error("Authentication error:", err);
      let friendlyMessage = "Failed to authenticate. Please check your credentials.";
      if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "This email is already registered.";
      } else if (err.code === "auth/invalid-credential") {
        friendlyMessage = "Invalid email or password.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Save or update user profile details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: Date.now(),
      }, { merge: true });

      onAuthSuccess();
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      if (err.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked. Please enable popups or try using the Email/Password form.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Sign-in was cancelled. Please try again.");
      } else {
        setError("Google Sign-In failed. Try using Email/Password authentication.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center p-4 relative overflow-hidden" id="auth_container">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm relative z-10 animate-fade-in" id="auth_card">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-slate-900 rounded-md mb-4 shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold font-sans text-slate-900 tracking-tight">
            AI Assistant
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to start your personalized production-ready experience.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-600 text-sm animate-shake" id="auth_error">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Google OAuth Quick Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-medium py-2.5 px-4 rounded-lg transition duration-150 active:scale-[0.98] disabled:opacity-50 shadow-sm cursor-pointer text-sm"
          id="btn_google_signin"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.43 14.97 1 12 1 7.35 1 3.37 3.68 1.48 7.58l3.78 2.93c.88-2.64 3.38-4.47 6.74-4.47z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.63z"
            />
            <path
              fill="#FBBC05"
              d="M5.26 14.11c-.22-.66-.35-1.37-.35-2.11s.13-1.45.35-2.11L1.48 6.96C.54 8.88 0 11.02 0 13.25s.54 4.37 1.48 6.29l3.78-2.93c-.22-.66-.35-1.37-.35-2.11z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.36 0-5.86-1.83-6.74-4.47L1.48 17.3c1.89 3.9 5.87 6.2 10.52 6.2z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-6 flex items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or email</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4" id="form_email_auth">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-lg px-4 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400"
                required={isSignUp}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-lg px-4 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-lg px-4 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-lg transition duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm text-sm"
            id="btn_submit_auth"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle between login and sign up */}
        <div className="text-center mt-6 text-sm">
          <span className="text-slate-400 text-xs">
            {isSignUp ? "Already have an account?" : "New to AI Assistant?"}
          </span>{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-slate-900 hover:underline text-xs font-semibold transition ml-1 bg-transparent border-none cursor-pointer"
            id="btn_toggle_auth_mode"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
