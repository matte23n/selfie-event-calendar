import React, { createContext, JSX, useContext, useState } from "react";

const AuthContext = createContext('' as any);
export const AuthProvider = ({ children }: { children: JSX.Element }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const login = (userToken: string) => {
        localStorage.setItem('token', userToken);
    };
    const logout = () => {
        setToken(null);
    };
    const isAuthenticated = !!token;
    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};