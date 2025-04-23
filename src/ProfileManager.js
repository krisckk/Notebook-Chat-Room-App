import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import './ProfileManager.css';

export default function ProfileManager({ user }) {
    const [profile, setProfile] = useState({
        displayName: '',
        bio: '',
        photoDataUrl: ''     // <-- store Data URL here
    });
    const [file, setFile]       = useState(null);
    const [preview, setPreview] = useState(''); // to show immediate preview
    const [saving, setSaving]   = useState(false);

    // Load existing profile once
    useEffect(() => {
        if (!user) return;
        const refDoc = doc(db, 'users', user.uid);
        getDoc(refDoc).then(snap => {
        if (snap.exists()) {
            const data = snap.data();
            setProfile(prev => ({
            ...prev,
            displayName: data.displayName || '',
            bio:         data.bio         || '',
            photoDataUrl:data.photoDataUrl|| ''
            }));
            setPreview(data.photoDataUrl || '');
        }
        });
    }, [user]);

    // Utility: compress image file to a resized Data URL
    const compressImage = (file, maxWidth = 200, maxHeight = 200, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
            reader.onload = e => {
                img.onload = () => {
                    // Compute new dimensions
                    let { width, height } = img;
                    const aspect = width / height;
                    if(width > height) {
                        if(width > maxWidth) {
                            width = maxWidth;
                            height = Math.round(width / aspect);
                        }
                    }
                    else {
                        if(height > maxHeight) {
                            height = maxHeight;
                            width = Math.round(height * aspect);
                        }
                    }
                    // Draw to canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    // Export as JPEG Data URL
                    const compressed = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressed);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // When a new file is picked, immediately read it as Data URL
    useEffect(() => {
        if (!file) return;
        compressImage(file)
        .then(dataUrl => {
            setProfile(p => ({ ...p, photoDataUrl: dataUrl }));
            setPreview(dataUrl);
        })
        .catch(err => {
            console.error('Image compression failed:', err);
        });
    }, [file]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const updates = {
        displayName: profile.displayName,
        bio:         profile.bio,
        updatedAt:   serverTimestamp(),
        photoDataUrl: profile.photoDataUrl  // embed the Data URL
        };
        
        try {
            await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
        } 
        catch (err) {
            console.error('Saving profile failed:', err);
        }

        setFile(null);
        setSaving(false);
    };

    return (
        <div className="profile-manager">
        <h3>Your Profile</h3>
        <form className="pm-form" onSubmit={handleSave}>
            <label>
            Name
            <input
                value={profile.displayName}
                onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                placeholder="Display name"
                required
            />
            </label>

            <label>
            Bio
            <textarea
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                placeholder="A short bio"
            />
            </label>

            <label className="photo-label">
            Photo
            {preview && (
                <img src={preview} alt="avatar" className="avatar-preview" />
            )}
            <input
                type="file"
                accept="image/*"
                onChange={e => setFile(e.target.files[0])}
            />
            </label>

            <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
            </button>
        </form>
        </div>
    );
}
