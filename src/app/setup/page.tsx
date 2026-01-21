"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import styles from "./setup.module.css";

export default function SetupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Create the admin user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Mark as initialized in Firestore
            await setDoc(doc(db, "config", "admin_setup"), {
                initialized: true,
                adminEmail: email,
                createdAt: new Date().toISOString(),
            });

            // 3. Redirect to home or admin
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred during setup.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>TheCodePrism</h1>
                <p className={styles.subtitle}>Initialize your CMS Admin Account</p>

                <form className={styles.form} onSubmit={handleSetup}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Admin Email</label>
                        <input
                            id="email"
                            type="email"
                            className={styles.input}
                            placeholder="admin@thecodeprism.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Admin Password</label>
                        <input
                            id="password"
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? "Initializing..." : "Complete Setup"}
                    </button>
                </form>
            </div>
        </div>
    );
}
