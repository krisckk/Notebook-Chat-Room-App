import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { db } from "./firebase";
import {
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
} from 'firebase/firestore';
import './GroupList.css';

export default function GroupList({ user, onSelectGroup }) {
    const [newGroupName, setNewGroupName] = useState('');
    const [groups, setGroups]       = useState([]);
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

    // Commit new group to Firestore
    const commitEntry = async (tempId, name) => {
        setNewEntries(entries => entries.filter(e => e.tempId !== tempId));
        const trimmed = name.trim();
        if (!trimmed || !user) return;
        try {
            await addDoc(
                collection(db, 'users', user.uid, 'groups'),
                {
                name: trimmed,
                leader:  user.uid,
                members: [user.uid],
                createdAt: serverTimestamp()
                }
            );
            console.log('Group created:', trimmed);
        } catch (err) {
        console.error('Failed to create group:', err);
        }
    };

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
                        if (e.key === 'Enter') {
                        commitEntry(entry.tempId, entry.name);
                        }
                    }}
                    placeholder="Enter group name"
                    />
                </li>
                ))}
                {groups.map(group => (
                <li
                    key={group.id}
                    className="group-item"
                    onClick={() => onSelectGroup(group)}
                >
                    {group.name}
                </li>
                ))}
            </ul>
        </div>
    );
};