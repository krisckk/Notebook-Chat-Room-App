import React, { useEffect, useState } from 'react';
import { auth, provider, db } from './firebase';
import { signInWithPopup } from 'firebase/auth';
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

export default function Page ({ side, content, flipProgress, flippingFromSignIn, user, currentFriend, onFriendSelect, onProfileToggle, ...handlers }) {
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
        return (
          <div className="signin-page">
            <h2>Welcome to the Notebook Chat</h2>
            <button onClick={() => signInWithPopup(auth, provider)}>
              Sign In with Google
            </button>
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
