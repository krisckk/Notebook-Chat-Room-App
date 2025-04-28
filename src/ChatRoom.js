import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { FaTrash } from 'react-icons/fa';
import './ChatRoom.css';

export default function ChatRoom({ user, roomId, friend, flippingFromSignIn }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Load messages for this chat room
  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, 'chatrooms', roomId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [roomId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user || !roomId) return;

    try {
      await addDoc(collection(db, 'chatrooms', roomId, 'messages'), {
        text: input,
        sender: user.displayName,
        senderId: user.uid,
        receiver: friend?.displayName || 'public',
        receiverId: friend?.id || 'public',
        timestamp: serverTimestamp()
      });
      setInput('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteDoc(doc(db, 'chatrooms', roomId, 'messages', messageId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="chatroom" style={{ 
      overflowY: "auto", 
      flex: 1, 
      maxHeight: "60vh",
      padding: "10px" 
    }}>
      <div className="messages" >
        {messages.map((msg) => {
          const date = msg.timestamp?.toDate?.() || new Date();
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={msg.id} className={`bubble ${msg.senderId === user?.uid ? 'self' : 'other'}`}>
              <div className='bubble-header'>
                <span className='sender'>{msg.sender}</span>
                {msg.senderId === user?.uid && (
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
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      )}
    </div>
  );
}