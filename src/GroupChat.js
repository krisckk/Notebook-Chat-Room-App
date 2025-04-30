import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, addDoc, serverTimestamp, updateDoc, arrayUnion, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { FaUserPlus } from 'react-icons/fa';
import './GroupChat.css';

export default function GroupChat({ group, user }){
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [friends, setFriends] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState('');

    useEffect(() => {
        // load group members for dropdown
        const loadFriends = async () => {
            const collectionRef = collection(db, 'users', user.uid, 'friends');
            const snap = await getDocs(collectionRef);
            setFriends(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        loadFriends();
    }, [user.uid]);

    useEffect(() => {
        // load messages
        const q = query(collection(db, 'groups', group.id, 'messages'), orderBy('timestamp'));
        const unsub = onSnapshot(q, snap => {
            setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });
        return unsub;
    }, [group.id]);

    const handleSend = async e => {
        e.preventdefault();
        await addDoc(collection(db, 'groups', group.id, 'messages'), {
            text: input,
            timestamp: serverTimestamp(),
            sender: user.uid
        });
        setInput('');
    };

    const handleAddMember = async () => {
        if (!selectedFriend) return;
        const groupRef = doc(db, 'groups', group.id);
        await updateDoc(groupRef, {
            members: arrayUnion(selectedFriend)
        });
        setShowAdd(false);
    };

    return (
        <div className="group-chat-container">
          <h2>{group.name}</h2>
          <button onClick={() => setShowAdd(!showAdd)} className="add-member-btn">
            <FaUserPlus /> Add Member
          </button>
          {showAdd && (
            <div className="member-dropdown">
              <select onChange={e => setSelectedFriend(e.target.value)}>
                <option value="">Select friend</option>
                {friends.map(f => <option key={f.id} value={f.id}>{f.displayName}</option>)}
              </select>
              <button onClick={handleAddMember}>Add</button>
            </div>
          )}
          <div className="messages">
            {messages.map(m => (
              <div key={m.id} className={`bubble ${m.senderId === user.uid ? 'self' : 'other'}`}>{m.text}</div>
            ))}
          </div>
          <form onSubmit={handleSend} className="input-box">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..."/>
            <button type="submit">Send</button>
          </form>
        </div>
    );

};