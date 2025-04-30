import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import './GroupList.css';

export default function GroupList({ groups, onCreateGroup, onSelectGroup }) {
    const [newGroupName, setNewGroupName] = useState('');

    const handleAdd = () => {
        if(!newGroupName.trim()) return;
        onCreateGroup(newGroupName.trim());
        setNewGroupName('');
    }

    return (
        <div className="group-list-container">
            <h3>Group Chats</h3>
            <div className="group-create">
                <input
                    type="text"
                    placeholder="New Group Name"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                />
                <button onClick={handleAdd} className="group-add-button">
                    <FaPlus />
                </button>
            </div>
            <ul className="group-list">
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