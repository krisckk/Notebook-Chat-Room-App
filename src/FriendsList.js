import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaTrash, FaSearch } from 'react-icons/fa';
import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import './FriendsList.css';

export default function FriendsList({ user, onFriendSelect, onProfileToggle, onDelete }) {
    const [searchName, setSearchName] = useState('');
    const [friends, setFriends] = useState([]);
    const [error, setError] = useState('');

    const friendsCollection = collection(db, 'users', user?.uid, 'friends');

    useEffect(() => {
        if(!user) return;

        const q = query(friendsCollection);
        const unsub = onSnapshot(friendsCollection, (snapshot) =>{
            setFriends(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, [user?.uid]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');
        const name = searchName.trim();
        if (!name || !user) {
            setError('Please enter a name to search.');
            return;
        }

        const q = query(
            collection(db, 'users'),
            where('displayName', '==', name)
        );

        try {
            const res = await getDocs(q);
            if(res.empty) {
                setError(`No user found as "${name}"`);
                return;
            }

            for(let docSnap of res.docs){
                const friendId = docSnap.id;
                if(friends.some(f => f.id === friendId)) {
                    setError(`${name} is already your friend.`);
                    continue;
                }

                await addDoc(friendsCollection, {
                    id: friendId,
                    displayName: name,
                    addedAt: serverTimestamp(),
                    createdAt: serverTimestamp()
                });
            }
            setSearchName('');
        }
        catch(err){
            setError("Failed to add friend");
            console.error(err);
        }
    }

    return (
        <div className="friends-list-container">
            <button
                className="profile-toggle-button"
                onClick={() => onProfileToggle()}
                aria-label="Toggle profile view"
            >
                <FaUserCircle size={24}/>
            </button>

            <div className="friends-list-header">
                <h2>Your Friends</h2>
            </div>
            
            <form onSubmit={handleAdd} className="add-friend-form">
                <div className="search-input-container">
                    <FaSearch className='search-icon' />
                    <input
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        placeholder='Search by name...'
                    />
                </div>
                <button type='submit' className="add-button">Add</button>
            </form>
            {error && <div className='error-message'>{error}</div>}

            <div className='friends-scroll-container'>
                {friends.length === 0 ? (
                    <div className="empty-state">
                    {user ? "No friends yet. Add some above!" : "Please sign in to view friends"}
                  </div>
                ) : (
                    <ul className="friends-list">
                        {friends.map((friend) => (
                            <li 
                                key={friend.id} 
                                className="friend-item"
                                onClick={() => onFriendSelect(friend)}
                            >
                                <div className="friend-avatar">
                                    {friend.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="friend-info">
                                    <span className="friend-name">{friend.displayName}</span>
                                    <span className="friend-status">Last active: {friend.addedAt?.toDate?.().toLocaleDateString() || 'unknown'}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};