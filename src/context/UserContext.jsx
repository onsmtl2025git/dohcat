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
            clearTimeout(timer); // Clear timeout if we get a response
            if (currentUser) {
                setUser(currentUser);
                try {
                    // Try to get existing profile
                    let userProfile = await getUserProfile(currentUser.uid);

                    // If no profile (first login), create one
                    if (!userProfile) {
                        // Check if we have registration data in session/global (passed via login results often)
                        // For the AuthPortal flow, we might need a way to pass this.
                        // For now, use data on the user object or defaults.
                        const pendingRole = window.pendingRole || 'Kid';
                        userProfile = await createUserProfile(currentUser.uid, currentUser.isAnonymous, {
                            email: currentUser.email,
                            role: pendingRole,
                            username: window.pendingUsername || 'Kid',
                            disabled: pendingRole === 'Admin' // New Admins are disabled by default
                        });
                        // Clear pending data
                        delete window.pendingRole;
                        delete window.pendingUsername;
                    }

                    setProfile(userProfile);
                } catch (error) {
                    console.error("Error fetching/creating profile:", error);
                }
            } else {
                setUser(null);
                setProfile(null);
                // If not logged in, force anonymous login
                // This ensures a seamless flow for "Anonymous User ID Gen"
                try {
                    await loginAnonymously();
                } catch (error) {
                    console.error("Auto-anonymous login failed:", error);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
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
