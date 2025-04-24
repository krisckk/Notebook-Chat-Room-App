import React, { useEffect, useState } from "react";
import { db } from './firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    onSnapshot,
    deleteDoc,
    doc
} from "firebase/firestore";
import './FriendsManager.css'
import { FaTrash, FaComment, FaPaperPlane } from 'react-icons/fa';

export default function FriendsManager({ user, onFriendSelect }) {
    const [searchName, setSearchName] = useState('');
    const [friends, setFriends] = useState([]);
    const [error, setError] = useState('');

    const friendsCollection = collection(db, 'users', user.uid, 'friends');
    // Load live friend list
    useEffect(() => {
        const unsub = onSnapshot(friendsCollection, snap => {
            setFriends(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => unsub();
    }, [user.uid]);
    // Add friend by displayName
    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');
        const name = searchName.trim();
        if (!name) return;

        const q = query(
            collection(db, 'users'),
            where("displayName", "==", name)
        );
        const res = await getDocs(q);
        if(res.empty){
            setError(`No user found as "${name}".`);
            return;
        }

        for (let docSnap of res.docs) {
            const friendId = docSnap.id;
            // avoid duplicates:
            if (friends.some(f => friendId.id === friendId)) {
                setError(`"${name}" is already your friend.`);
                continue;
            }
            await addDoc(friendsCollection, {
                id:         friendId,
                displayName: name,
                addedAt:    serverTimestamp()
            });
        }
        setSearchName('');
    };

    const handleRemove = async (friendId) => {
        await deleteDoc(doc(db, 'users', user.uid, 'friends', friendId));
    };

    return (
        <div className="friends-manager">
        <h3>Your Friends</h3>
        <form onSubmit={handleAdd} className="add-friend-form">
            <input
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                placeholder="Enter display name…"
            />
            <button type="submit">Add</button>
            </form>
            {error && <div className="fm-error">{error}</div>}

            <ul className="friends-list">
                {friends.map(f => (
                    <li key={f.id}>
                        <span 
                            className="fn-name clickable"
                            onClick={() => onFriendSelect && onFriendSelect(f)}
                        >
                            {f.displayName}
                        </span>
                        <div className="friend-actions">
                            <FaComment 
                                className="fn-chat"
                                onClick={() => onFriendSelect && onFriendSelect(f)}
                            />
                            <FaTrash
                                className="fn-trash"
                                onClick={() => handleRemove(f.id)}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};