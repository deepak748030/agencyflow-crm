import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { type NaamJapUser } from '@/services/api';

const AUTH_USER_KEY = '@auth_user';
const AUTH_MOBILE_KEY = '@auth_mobile';

interface AuthContextType {
    user: NaamJapUser | null;
    mobile: string | null;
    isLoggedIn: boolean;
    loading: boolean;
    setAuthUser: (user: NaamJapUser, mobile: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    mobile: null,
    isLoggedIn: false,
    loading: true,
    setAuthUser: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<NaamJapUser | null>(null);
    const [mobile, setMobile] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            AsyncStorage.getItem(AUTH_USER_KEY),
            AsyncStorage.getItem(AUTH_MOBILE_KEY),
        ])
            .then(([savedUser, savedMobile]) => {
                if (savedUser && savedMobile) {
                    setUser(JSON.parse(savedUser));
                    setMobile(savedMobile);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const setAuthUser = async (userData: NaamJapUser, mob: string) => {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        await AsyncStorage.setItem(AUTH_MOBILE_KEY, mob);
        setUser(userData);
        setMobile(mob);
    };

    const logout = async () => {
        await AsyncStorage.clear();
        setUser(null);
        setMobile(null);
    };

    return (
        <AuthContext.Provider value={{ user, mobile, isLoggedIn: !!user, loading, setAuthUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);