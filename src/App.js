import React, { useState, useEffect } from 'react';
import { db, auth, provider } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, signOut } from 'firebase/auth';
import Notebook from './Notebook';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleAuthStateChange = async (user) => {
      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            displayName: user.displayName,
            email: user.email,
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error("Error updating user document:", error);
        }
      }
      setUser(user);
    };

    const unsubscribe = auth.onAuthStateChanged(handleAuthStateChange);
    return () => unsubscribe();
  }, []);

  return (
    <div className="notebook-wrapper">
      {user && (
        <button
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1000,
            padding: '8px 16px',
            background: '#ff4f4f',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onClick={() => signOut(auth)}
        >
          Sign Out
        </button>
      )}
      <Notebook user={user} />
    </div>
  );
};

