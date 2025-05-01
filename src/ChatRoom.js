import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { FaPaperPlane } from 'react-icons/fa';
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
                  <button
                    className="delete-icon"
                    onClick={() => handleDelete(msg.id)}
                    aria-label="Delete message"
                  >
                    <svg
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3 6v18h18v-18h-18zm5 14c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4-18v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.315c0 .901.73 2 1.631 2h5.712z" />
                    </svg>
                  </button>
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
          <button type="submit"><FaPaperPlane /></button>
        </form>
      )}
    </div>
  );
}