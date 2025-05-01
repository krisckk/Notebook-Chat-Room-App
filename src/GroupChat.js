// src/GroupChat.js
import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { FaTimes } from 'react-icons/fa';
import './GroupChat.css';

export default function GroupChat({ group, user, onExit }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [friends, setFriends] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showList, setShowList] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState('');

  // Load user's friends for manual dropdown
  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDocs(collection(db, 'users', user.uid, 'friends'));
      setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, [user]);

  // Subscribe to this group's messages
  useEffect(() => {
    if (!group) return;
    const path = collection(db, 'users', group.leader, 'groups', group.id, 'messages');
    const q = query(path, orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [group]);

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    try {
      await addDoc(
        collection(db, 'users', group.leader, 'groups', group.id, 'messages'),
        {
          text: input,
          senderId: user.uid,
          senderName: user.displayName || user.email || 'Unknown',
          timestamp: serverTimestamp()
        }
      );
      setInput('');
    } 
    catch (err) {
      console.error('Send failed:', err);
    }
  };

  return (
    <div className="group-chat-container">
      <header className="group-chat-header">
        <button className="exit-btn" onClick={onExit} aria-label="Close chat">
          <FaTimes />
        </button>
        <h2>{group.name}</h2>
      </header>

      <div className="messages">
        {messages.map(m => {
          const date = m.timestamp?.toDate?.() || new Date();
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={m.id} className={`bubble ${m.senderId === user?.uid ? 'self' : 'other'}`}>
              <div className="bubble-header">
                <span className="sender-name">{m.senderName}</span>
                <span className="timestamp">{timeString}</span>
              </div>
              <div className="bubble-text">{m.text}</div>
            </div>
          );
        })}
      </div>

      <form className="input-box" onSubmit={handleSend}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
