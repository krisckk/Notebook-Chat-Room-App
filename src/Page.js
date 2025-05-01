// src/Page.js
import React, { useEffect, useState } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { FaArrowLeft } from 'react-icons/fa';
import FriendsList from './FriendsList';
import GroupList from './GroupList';
import GroupChat from './GroupChat';
import ProfileEditor from './ProfileEditor';
import ChatRoom from './ChatRoom';
import './Page.css';

export default function Page({
  side,
  content,
  flipProgress,
  flippingFromSignIn,
  user,
  currentFriend,
  currentGroup,
  onFriendSelect,
  onProfileToggle,
  onToggleSignUp,
  onSelectGroup,
  ...handlers
}) {
  const auth = getAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  // Group list state
  const [groups, setGroups] = useState([]);

  // Load groups for this user
  useEffect(() => {
    if (!user) {
      onSelectGroup(null);
      return;
    }
    const colRef = collection(db, 'users', user.uid, 'groups');
    const unsub = onSnapshot(colRef, snap => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user, onSelectGroup]);

  // Auth handlers
  const handleEmailSignIn = async e => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignup = async e => {
    e.preventDefault();
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(
        doc(db, 'users', cred.user.uid),
        { email: cred.user.email, createdAt: serverTimestamp() },
        { merge: true }
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Render content
  const renderContent = () => {
    // Right-hand Group Chat override
    if (side === 'right' && currentGroup) {
      return (
        <GroupChat
          group={currentGroup}
          user={user}
          onExit={() => onSelectGroup(null)}
        />
      );
    }

    if (!content) return null;
    switch (content.type) {
      case 'friends':
        return (
          <div className="friends-and-groups">
            <FriendsList
              user={user}
              onFriendSelect={content.onFriendSelect}
              onProfileToggle={content.onProfileToggle}
            />
            <GroupList
              user={user}
              groups={groups}
              onSelectGroup={onSelectGroup}
            />
          </div>
        );

      case 'profile':
        return (
          <ProfileEditor
            user={user}
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
        );

      case 'signup':
        return (
          <div className="signup-page" style={{ display:'flex',justifyContent:'center',alignItems:'center',height:'100%',width:'100%' }}>
            <div className="notebook-sheet">
              <h2>Create Account</h2>
              {error && <div className="error">{error}</div>}
              <form onSubmit={handleSignup} className="auth-form">
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
                <button type="submit">Sign Up</button>
              </form>
              <button className="back-button" onClick={() => onToggleSignUp(false)}>
                <FaArrowLeft style={{ marginRight:'0.5rem' }} />
                Back to Sign In
              </button>
            </div>
          </div>
        );

      case 'signin':
        return (
          <div className="signin-page">
            <div className="notebook-sheet">
              <h2>Sign In</h2>
              {error && <div className="error">{error}</div>}
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
              <button onClick={handleGoogleSignIn}>Sign In with Google</button>
              <p>
                Don’t have an account?{' '}
                <button className="link-button" onClick={() => onToggleSignUp(true)}>
                  Sign up
                </button>
              </p>
            </div>
          </div>
        );

      default:
        return <div className="note">{content.content}</div>;
    }
  };

  const rotation = side === 'right'
    ? -180 * flipProgress
    : 180 * flipProgress;

  return (
    <div
      className={`page ${side}`}
      style={{ transform: `rotateY(${rotation}deg)`, width:'100%', height:'100%' }}
      {...handlers}
    >
      {renderContent()}
    </div>
  );
}
