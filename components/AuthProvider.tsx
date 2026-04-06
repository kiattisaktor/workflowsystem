"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useLiff } from "./LiffProvider";
import { User, getUsers, loginUser as apiLoginUser } from "../lib/api";
import { registerUser } from "../lib/register";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    loginWeb: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
    authMethod: "LINE" | "WEB" | "GUEST";
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    loginWeb: async () => ({ success: false }),
    logout: () => { },
    isAuthenticated: false,
    authMethod: "GUEST",
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { isLoggedIn: isLiffLoggedIn, profile: liffProfile, isInitialized } = useLiff();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authMethod, setAuthMethod] = useState<"LINE" | "WEB" | "GUEST">("GUEST");

    useEffect(() => {
        // Wait for LIFF to initialize
        if (!isInitialized) return;

        const resolveAuth = async () => {
            setIsLoading(true);

            // 1. Check LINE Login
            if (isLiffLoggedIn && liffProfile) {
                try {
                    const allUsers = await getUsers();
                    const match = allUsers.find((u) => u.id === liffProfile.userId);
                    if (match) {
                        setUser(match);
                    } else {
                        // Register new user
                        await registerUser(liffProfile.userId, liffProfile.displayName);

                        setUser({
                            id: liffProfile.userId,
                            name: liffProfile.displayName,
                            nickName: liffProfile.displayName,
                            role: "No Role",
                            isAdmin: false,
                            canCreateTask: false,
                        });
                    }
                    setAuthMethod("LINE");
                } catch (e) {
                    console.error("Auth Error", e);
                }
            }
            // 2. Check Web Session (LocalStorage)
            else {
                const storedUser = localStorage.getItem("web_user");
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        setUser(parsed);
                        setAuthMethod("WEB");
                    } catch (e) {
                        localStorage.removeItem("web_user");
                    }
                }
            }

            setIsLoading(false);
        };

        resolveAuth();
    }, [isInitialized, isLiffLoggedIn, liffProfile]);

    const loginWeb = async (username: string, password: string) => {
        setIsLoading(true);
        const result = await apiLoginUser(username, password);
        if (result.success && result.user) {
            setUser(result.user);
            setAuthMethod("WEB");
            localStorage.setItem("web_user", JSON.stringify(result.user));
        }
        setIsLoading(false);
        return result;
    };

    const logout = () => {
        setUser(null);
        setAuthMethod("GUEST");
        localStorage.removeItem("web_user");
        // If Line, we can't really "logout" from LIFF context easily without closing window, 
        // but we can clear local state. 
        // Actually LIFF logout is `liff.logout()`, but in LIFF browser it does nothing usually.
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading: isLoading && !user, // Only loading if we don't have a user yet
            loginWeb,
            logout,
            isAuthenticated: !!user,
            authMethod
        }}>
            {children}
        </AuthContext.Provider>
    );
}
