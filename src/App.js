import React, { useState, useEffect } from 'react';
import { auth, provider } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import Notebook from './Notebook';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscibe = auth.onAuthStateChanged(setUser);
    return () => unsubscibe();
  }, []);

  return (
    <div className="App">
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

