import React, { useState } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, {
                displayName: email.split('@')[0]
            });
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                createdAt: serverTimestamp(),
                displayName: email.split('@')[0],
                phone: "",
                address: ""
            });
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h2>Sign Up</h2>
            {error && <p className="error">{error}</p>}
            <label>
                Email
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </label>
            <label>
                Password
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </label>
            <button type="submit">Create Account</button>
        </form>
    )
}