// src/GroupList.js
import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { db } from "./firebase";
import {
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    getDocs,
    doc,
    setDoc,
    deleteDoc
} from 'firebase/firestore';
import './GroupList.css';

export default function GroupList({ user, onSelectGroup }) {
    const [groups, setGroups] = useState([]);
    const [newEntries, setNewEntries] = useState([]);

    // Subscribe to existing groups
    useEffect(() => {
        if (!user) return;
        const colRef = collection(db, 'users', user.uid, 'groups');
        const unsub = onSnapshot(colRef, snap => {
            setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return unsub;
    }, [user]);

    // Add a placeholder entry for new group name
    const handleAddClick = () => {
        setNewEntries(entries => [
            { tempId: Date.now().toString(), name: '' },
            ...entries
        ]);
    };

    // Update just-typed name
    const updateEntry = (tempId, name) => {
        setNewEntries(entries =>
            entries.map(e => e.tempId === tempId ? { ...e, name } : e)
        );
    };

    // Commit new group to Firestore and mirror to all members
    const commitEntry = async (tempId, name) => {
        setNewEntries(entries => entries.filter(e => e.tempId !== tempId));
        const trimmed = name.trim();
        if (!trimmed || !user) return;

        try {
            // 1) gather all your friend UIDs from the friend records
            const friendsSnap = await getDocs(collection(db, 'users', user.uid, 'friends'));
            // Each friend doc stores the actual friend's uid in its 'id' field
            const memberIds = friendsSnap.docs.map(d => d.data().id);
            // include yourself
            memberIds.push(user.uid);

            // 2) write the group under your own namespace
            const groupDoc = await addDoc(
                collection(db, 'users', user.uid, 'groups'),
                {
                    name:      trimmed,
                    leader:    user.uid,
                    members:   memberIds,
                    createdAt: serverTimestamp()
                }
            );

            // 3) mirror that doc under each member's path
            await Promise.all(memberIds.map(memberUid =>
                setDoc(
                    doc(db, 'users', memberUid, 'groups', groupDoc.id),
                    {
                        name:      trimmed,
                        leader:    user.uid,
                        members:   memberIds,
                        createdAt: serverTimestamp()
                    },
                    { merge: true }
                )
            ));

            console.log('Group created and mirrored to members:', trimmed);
        } 
        catch (err) {
            console.error('Failed to create group:', err);
        }
    };

    const handleDeleteGroup = async group => {
        try {
            // remove the group doc from each member
            await Promise.all(
                group.members.map(uid => 
                    doc(db, 'users', uid, 'groups', group.id)
                ).map(path => deleteDoc(path))
            );
            console.log("🗑️ Group deleted:", group.name);
        }
        catch(err) {
            console.error("❌ Failed to delete group:", err);
        }
    }

    return (
        <div className="group-list-container">
            <h3>Group Chats</h3>
            <button onClick={handleAddClick} className="group-add-button">
                <FaPlus />
            </button>
            <ul className="group-list">
                {newEntries.map(entry => (
                    <li key={entry.tempId} className="group-item">
                        <input
                            autoFocus
                            value={entry.name}
                            onChange={e => updateEntry(entry.tempId, e.target.value)}
                            onBlur={e => commitEntry(entry.tempId, e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') commitEntry(entry.tempId, entry.name);
                            }}
                            placeholder="Enter group name"
                        />
                    </li>
                ))}
                {groups.map(group => (
                    <li key={group.id} className="group-item">
                        <span onClick={() => onSelectGroup(group)}>
                           {group.name}
                        </span>
                        <FaTrash
                            className="group-delete-icon"
                            onClick={() => handleDeleteGroup(group)}
                        />
                  </li>
                ))}
            </ul>
        </div>
    );
};
