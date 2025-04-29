import React, { useEffect, useState } from 'react';
import { auth, provider, db } from './firebase';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { FaTrash } from 'react-icons/fa';
import FriendsList from './FriendsList';
import ProfileEditor from './ProfileEditor';
import ChatRoom from './ChatRoom';
import './Page.css';

export default function Page ({ side, content, flipProgress, flippingFromSignIn, user, currentFriend, onFriendSelect, onProfileToggle, onFlipToSignUp, ...handlers }) {
  const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [error, setError] = useState('');
  
  const rotation = side === 'right'
    ? -180 * flipProgress
    : 180 * flipProgress;

  const renderContent = () => {
    if (!content) return null;
    switch (content.type) {
      case 'friends':
        return (
          <FriendsList 
            user={user} 
            onFriendSelect={content.onFriendSelect}
            onProfileToggle={content.onProfileToggle} 
          />
        );
      case 'profile':
        return (
          <ProfileEditor 
            user={user} 
            onProfileClick={content.onProfileToggle} 
            onReturn={content.onProfileToggle}
          />
        );
      case 'chat':
        return (
          <ChatRoom 
            user={user} 
            friend={content.friend} 
            roomId={content.roomId}  
            flippingFromSignIn={flippingFromSignIn}
          />
        )
      case 'signin':

        const handleEmailSignIn = async (e) => {
          e.preventDefault();
          setError('');
          try {
            await signInWithEmailAndPassword(auth, email, password);
          } 
          catch (err) {
            setError(err.message);
          }
        };
        const handleGoogle = async() => {
          const provider = new GoogleAuthProvider();
          try {
            await signInWithPopup(auth, provider);
          }
          catch(err){
            console.error(err);
          }
        }
        return (
          <div className="signin-page">
      <h2>Sign In</h2>
      {error && <div className="error">{error}</div>}

      {/* — Email/Password Form — */}
      <form onSubmit={handleEmailSignIn} className="auth-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">Sign In with Email</button>
      </form>

      <hr />

      {/* — Google Sign-In — */}
      <button onClick={handleGoogle}>
        Sign In with Google
      </button>

      {/* — Flip to “sign up” page — */}
      <p>
        Don’t have an account?{" "}
        <button 
          className="link-button" 
          onClick={() => onFlipToSignUp()}  // or whatever callback Notebook.js uses
        >
          Sign up
        </button>
      </p>
    </div>
        )
      default:
        return <div className="note">{content.content}</div>;
    }
  };

  return (
    <div
      className={`page ${side}`}
      style={{ 
        transform: `rotateY(${rotation}deg)`, 
        width: '100%',
        height: '100%',
      }}
      {...handlers}
    >
      {renderContent()}
    </div>
  );
};
