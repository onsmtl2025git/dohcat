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
        const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
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
                        userProfile = await createUserProfile(currentUser.uid, currentUser.isAnonymous, {
                            email: currentUser.email,
                            role: window.pendingRole || 'User',
                            username: window.pendingUsername || 'User'
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
            {!loading && children}
        </UserContext.Provider>
    );
};
