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
import FriendsManager from './FriendsManager';
import ProfileManager from './ProfileManager';
import './Page.css';

export default function Page ({ side, content, flipProgress, flippingFromSignIn, user, currentFriend, onFriendSelect, ...handlers }) {
  const rotation = side === 'right'
    ? -180 * flipProgress
    : 180 * flipProgress;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Only setup chat logic for right-side chat pages
  const isChatPage = content?.type === 'chat' && side === 'right';
  const roomId = content?.roomId || `room_${content?.id || 1}`;

  useEffect(() => {
    if (!isChatPage) return;

    const q = query(
      collection(db, 'chatrooms', roomId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [isChatPage, roomId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user?.uid || !content?.roomId){
      console.error("Missing required data for sending message.");
      return;
    }
    console.log("Current user:", user?.displayName);
    console.log("Current friend:", currentFriend?.displayName);
    console.log("Room ID:", content?.roomId);

    try {
      const messageData = {
        text: input,
        sender: user.displayName,
        senderId: user.uid,
        receiver: currentFriend?.displayName || 'public',
        receiverId: currentFriend?.id || 'public',
        timestamp: serverTimestamp()
      };
      console.log("Attempting to send message:", messageData);
      await addDoc(collection(db, 'chatrooms', content.roomId, 'messages'), messageData);
      setInput('');
    } 
    catch (error) {
      console.error("Error sending message:", error);
      alert("Couldn't send message. Please check your permissions.");
    }

    setInput('');
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteDoc(doc(db, 'chatrooms', roomId, 'messages', messageId));
    }
    catch(err) {
      console.error('Delete failed:', err);
    }
  }

  const renderContent = () => {
    if (!content) return null;

    if(side === 'left' && user) {
      return (
        <>
          <ProfileManager user={user} />
          <FriendsManager 
            user={user}
            onFriendSelect={onFriendSelect} 
          />
        </>
      );
    }

    if (content.type === 'signin') {
      return (
        <div className="signin-page">
          <h2>Welcome to the Notebook Chat</h2>
          <button onClick={() => signInWithPopup(auth, provider)}>Sign In with Google</button>
        </div>
      );
    }

    if (isChatPage) {
      return (
        <div className="chatroom">
          <div className="messages">
            {messages.map((msg) => {
              const date = msg.timestamp?.toDate?.() || new Date();
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
              return (
                <div key={msg.id} className={`bubble ${msg.uid === user?.uid ? 'self' : 'other'}`}>
                  <div className='bubble-header'>
                    <span className='sender'>{msg.sender}</span>
                    {msg.uid === user?.uid && (
                      <FaTrash
                        className="delete-icon"
                        onClick={() => handleDelete(msg.id)}
                      />
                    )}
                  </div>
                  <div className="text">{msg.text}</div>                  
                  <div className="time">{timeString}</div>
                </div>
              );
            })}
          </div>
    
          {!flippingFromSignIn && user && (
            <form className="input-box" onSubmit={handleSend}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
              />
              <button type="submit">Send</button>
            </form>
          )}
        </div>
      );
    }

    return <div className="note">{content.content}</div>;
  };

  return (
    <div
      className={`page ${side}`}
      style={{ transform: `rotateY(${rotation}deg)` }}
      {...handlers}
    >
      {renderContent()}
    </div>
  );
};
