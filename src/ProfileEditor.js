import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaSave, FaEdit, FaCamera } from "react-icons/fa";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import { updateProfile } from "firebase/auth";
import "./ProfileEditor.css";

export default function ProfileEditor({ user, onReturn }){
    const [profile, setProfile] = useState({
        displayName: '',
        bio: '',
        photoDataUrl: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if(!user) return;

        const loadProfile = async () => {
            try {
                const userRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userRef);

                if(docSnap.exists()){
                    const data = docSnap.data();
                    setProfile({
                        displayName: data.displayName    || user.displayName || '',
                        bio: data.bio                    || '',
                        photoDataUrl: data.photoDataUrl  || '',
                        email: data.email                || user.email || '',
                        phone: data.phone                || '',
                        address: data.address            || '',
                    });
                    setPreview(data.photoDataUrl || '');
                }
                else {
                    await setDoc(userRef, {
                        displayName: user.displayName || '',
                        email: user.email || '',
                        phone: '',
                        address: '',
                        createdAt: serverTimestamp(),
                    }, { merge: true });
                    setProfile({
                        displayName: user.displayName || '',
                        bio: '',
                        photoDataUrl: '',
                        email: user.email || '',
                        phone: '',
                        address: ''
                    });
                }
            }
            catch(error) {
                console.error("Error loading profile:", error);
            }
            finally{
                setLoading(false);
            }
        };
        loadProfile();
    }, [user]);

    const compressImage = (file, maxWidth = 200, maxHeight = 200, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
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

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (Blob) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                resolve(reader.result);
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(Blob);
                        },
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    useEffect(() => {
        if(!file) return;

        compressImage(file)
        .then(dataUrl => {
            setProfile(p => ({...p, photoDataUrl: dataUrl }));
            setPreview(dataUrl);
        })
        .catch(err => console.error("Error compressing image:", err));
    }, [file]);
    
    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;
        
        setSaving(true);

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                displayName: profile.displayName,
                bio: profile.bio,
                photoDataUrl: profile.photoDataUrl,
                email: profile.email,
                phone: profile.phone,
                address: profile.address,
                updatedAt: serverTimestamp()
            }, { merge: true });

            // Sync to Firebase Auth so user.displayName is updated
            await updateProfile(user, {
                displayName: profile.displayName,
                bio: profile.bio,
                photoDataUrl: profile.photoDataUrl,
                email: profile.email,
                phone: profile.phone,
                address: profile.address,
            });

            setIsEditing(false);
        } 
        catch (err) {
            console.error('Profile save failed:', err);
        } 
        finally {
            setSaving(false);
        }
    };

    return (
        <div className="profile-editor-container">
            <div className="profile-header">
                <button 
                    className="return-button"
                    onClick={onReturn}
                    disabled={saving}
                >
                <FaArrowLeft />
                </button>
                
                <h2>My Profile</h2>
                
                {isEditing ? (
                    <button
                        className="save-button"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : <FaSave />}
                    </button>
                ) : (
                    <button
                        className="edit-button"
                        onClick={() => setIsEditing(true)}
                    >
                        <FaEdit />
                    </button>
                )}
            </div>

            <div className="profile-content">
                <div className="avatar-section">
                    <div className="avatar-preview-container">
                        {preview ? (
                            <img 
                                src={preview} 
                                alt="Profile" 
                                className="avatar-preview"
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                {profile.displayName.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                        {isEditing && (
                            <label className="avatar-upload-button">
                                <FaCamera />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        )}
                    </div>
                </div>
                {/*---Display Name Field ---*/}
                <div className="profile-fields">
                    <div className="profile-field">
                        <label>Display Name</label>
                        {isEditing ? (
                            <input
                                value={profile.displayName}
                                onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                                placeholder="Your name"
                                maxLength={30}
                            />
                        ) : (
                            <div className="profile-value">{profile.displayName}</div>
                        )}
                    </div>
                {/*---Bio Field ---*/}        
                <div className="profile-field">
                    <label>Bio</label>
                    {isEditing ? (
                        <textarea
                            value={profile.bio}
                            onChange={(e) => setProfile({...profile, bio: e.target.value})}
                            placeholder="Tell others about yourself"
                            maxLength={150}
                            rows={3}
                        />
                    ) : (
                        <div className="profile-value bio-value">
                            {profile.bio || 'No bio yet'}
                        </div>
                    )}
                </div>
                {/*---Email Field ---*/}    
                <div className="profile-field">
                    <label>Email</label>
                    {isEditing ? (
                        <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({...profile, email: e.target.value})}
                            placeholder="you@example.com"
                        />
                    ) : (
                        <div className="profile-value">
                            {profile.email || 'No email provided'}
                        </div>
                    )}
                </div>

                {/*---Phone Number Field ---*/}
                <div className="profile-field">
                    <label>Phone Number</label>
                    {isEditing ? (
                        <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                            placeholder="Your phone number"
                        />
                    ) : (
                        <div className="profile-value">
                            {profile.phone || 'No phone number provided'}
                        </div>
                    )}
                </div>

                {/*---Address Field ---*/}
                <div className="profile-field">
                    <label>Address</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={profile.address}
                            onChange={(e) => setProfile({...profile, address: e.target.value})}
                            placeholder="Your home address"
                        />
                    ) : (
                        <div className="profile-value">
                            {profile.address || 'No address provided'}
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
};