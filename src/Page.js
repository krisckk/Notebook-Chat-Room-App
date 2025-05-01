import React, { useEffect, useState } from 'react';
import { auth, provider, db } from './firebase';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  setDoc
} from 'firebase/firestore';
import { FaArrowLeft } from 'react-icons/fa';
import FriendsList from './FriendsList';
import GroupList from './GroupList';
import GroupChat from './GroupChat';
import ProfileEditor from './ProfileEditor';
import ChatRoom from './ChatRoom';
import './Page.css';

export default function Page ({
  side, 
  content, 
  flipProgress, 
  flippingFromSignIn, 
  user, 
  currentFriend, 
  onFriendSelect, 
  onProfileToggle, 
  onToggleSignUp, 
  ...handlers 
}) {
  const auth = getAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // ─── Group Chat State ───
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  
  const rotation = side === 'right'
    ? -180 * flipProgress
    : 180 * flipProgress;

  // Load groups for this user
  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'users', user.uid, 'groups');
    const unsub = onSnapshot(colRef, snap => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  const handleCreateGroup = async name => {
    if(!user || !name.trim()) return;
    await addDoc(
      collection(db, 'users', user.uid, 'groups'),
      {
        name,
        leader: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp()
      }
    );
  };

  // ─── Auth Handlers ───
  const handleEmailsSignIn = async e => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } 
    catch (error) {
      setError(error.message);
    }
  };
  
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setError('');
    try {
      await signInWithPopup(auth, provider);
    }
    catch (error) {
      setError(error.message);
    }
  };

  const handleSignup = async e => {
    e.preventDefault();
    setError('');
    try{
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Initialize user document in Firestore
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          email: cred.user.email,
          createdAt: serverTimestamp()
        },
        { merge: true }
      );
      onToggleSignUp(false);
    }
    catch (error) {
      setError(error.message);
    }
  };

  const renderContent = () => {
    if (!content) return null;
    // Right page group chat override
    if (side === 'right' && currentGroup) {
      return (
        <GroupChat group={currentGroup} user={user} onExit={() => setCurrentGroup(null)} onClick={console.log("Clicked")} />
      );
    }  
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
              onSelectGroup={g =>{console.log('Group clicked:', g); setCurrentGroup(g)}}
            />
          </div>
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
      case 'signup':
        return (
          <div 
            className='signup-page'
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}
          >
            <div className='notebook-sheet'>
              <h2>Create Account</h2>
              {error && <div className='error'>{error}</div>}
              <form onSubmit={handleSignup} className='auth-form'>
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
              <button
                className='back-button'
                onClick={() => onToggleSignUp(false)}
              >
                <FaArrowLeft style={{ marginRight: '0.5rem' }} />
                Back to Sign In
              </button>
            </div>
          </div>
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
            <div className='notebook-sheet'>
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
                onClick={() => onToggleSignUp(true)}  // or whatever callback Notebook.js uses
              >
                Sign up
              </button>
            </p>
            </div>
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
