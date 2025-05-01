import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  arrayUnion,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { FaUserPlus, FaTimes, FaChevronDown } from 'react-icons/fa';
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
    if (!input.trim()) return;
    await addDoc(
      collection(db, 'users', group.leader, 'groups', group.id, 'messages'),
      { text: input, senderId: user.uid, timestamp: serverTimestamp() }
    );
    setInput('');
  };

  const handleAddMember = async () => {
    if (!selectedFriend) return;
    const groupRef = doc(db, 'users', group.leader, 'groups', group.id);
    await updateDoc(groupRef, {
      members: arrayUnion(selectedFriend)
    });
    setSelectedFriend('');
    setShowAdd(false);
    setShowList(false);
  };

  return (
    <div className="group-chat-container">
      <header className="group-chat-header">
        <button className="exit-btn" onClick={onExit} aria-label="Close chat">
          <FaTimes />
        </button>
        <h2>{group.name}</h2>
      </header>

      <button className="add-member-btn" onClick={() => setShowAdd(!showAdd)}>
        <FaUserPlus /> Add Member
      </button>

      {showAdd && (
        <div className="member-dropdown">
          <div className="dropdown-header" onClick={() => setShowList(!showList)}>
            {selectedFriend
              ? friends.find(f => f.id === selectedFriend)?.displayName
              : 'Select friend'}
            <FaChevronDown style={{ marginLeft: '0.5rem' }} />
          </div>
          {showList && (
            <ul className="dropdown-list">
              {friends.map(f => (
                <li
                  key={f.id}
                  onClick={() => setSelectedFriend(f.id)}
                >
                  {f.displayName}
                </li>
              ))}
            </ul>
          )}
          <button
            className="confirm-add-btn"
            onClick={handleAddMember}
            disabled={!selectedFriend}
          >
            Add
          </button>
        </div>
      )}

      <div className="messages">
        {messages.map(m => (
          <div key={m.id} className={`bubble ${m.senderId === user.uid ? 'self' : 'other'}`}>
            {m.text}
          </div>
        ))}
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
