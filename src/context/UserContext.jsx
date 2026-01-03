import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuthChanges, loginAnonymously } from '../services/authService';
import { createUserProfile, getUserProfile } from '../services/userService';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety Valve: Force app to load if Auth hangs for > 4 seconds
        const timer = setTimeout(() => {
            setLoading(l => {
                if (l) console.warn("Auth timed out, forcing load.");
                return false;
            });
        }, 4000);

        const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
            clearTimeout(timer);
            if (currentUser) {
                setUser(currentUser);
                // 1. Resolve loading IMMEDIATELY now that we have a UID.
                // This prevents the whole app from hanging while Firestore fetches the profile.
                setLoading(false);

                try {
                    const userProfile = await getUserProfile(currentUser.uid);
                    if (userProfile) {
                        setProfile(userProfile);
                    } else if (currentUser.isAnonymous) {
                        // 2. OPTIMISTIC GUEST SETUP: If new guest, set a stub immediately
                        const stubProfile = {
                            uid: currentUser.uid,
                            isAnonymous: true,
                            username: `Explorer #${currentUser.uid.slice(-4).toUpperCase()}`,
                            role: 'Kid',
                            level: 1,
                            emojis: ['🐱'],
                            isSyncing: true
                        };
                        setProfile(stubProfile);

                        // 3. BACKGROUND SYNC: Create the actual profile without 'await'ing it for the UI
                        createUserProfile(currentUser.uid, true).then(finalProfile => {
                            setProfile(finalProfile);
                        });
                    } else {
                        // Regular user first login
                        const pendingRole = window.pendingRole || 'Kid';
                        const newProfile = await createUserProfile(currentUser.uid, false, {
                            email: currentUser.email,
                            role: pendingRole,
                            disabled: pendingRole === 'Admin'
                        });
                        delete window.pendingRole;
                        setProfile(newProfile);
                    }
                } catch (error) {
                    console.error("Error fetching/creating profile:", error);
                }
            } else {
                setUser(null);
                setProfile(null);
                try {
                    setLoading(false);
                    await loginAnonymously();
                } catch (error) {
                    console.error("Auto-anonymous login failed:", error);
                    setLoading(false);
                }
            }
        });

        const safetyValve = setTimeout(() => {
            setLoading(current => {
                if (current) console.warn("Auth Safety Valve triggered: Forcing load completion.");
                return false;
            });
        }, 5000);

        return () => {
            unsubscribe();
            clearTimeout(safetyValve);
        };
    }, []);

    const value = {
        user,
        profile,
        loading,
        setProfile // Expose this if we need to update profile state locally after DB writes
    };

    return (
        <UserContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <div className="text-gray-500 font-bold animate-pulse">Loading LeoLearn...</div>
                </div>
            ) : (
                children
            )}
        </UserContext.Provider>
    );
};
