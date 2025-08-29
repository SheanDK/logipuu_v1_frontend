// frontend/src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

import { AuthState, AuthContextType, LoginApiResponse, IUser, UserProfileResponseDto } from '../types'; 
import apiClient from '../services/apiClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: true,
    });
    
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decodedPayload = jwtDecode<IUser & { exp: number }>(token);

                if (decodedPayload.exp * 1000 > Date.now()) {
                    setAuthState({
                        isAuthenticated: true,
                        user: { ...decodedPayload, id: decodedPayload.userId },
                        token: token,
                        isLoading: false,
                    });
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                } else {
                    localStorage.removeItem('authToken');
                    setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
                }
            } catch (error) {
                console.error("Invalid token during initial load:", error);
                localStorage.removeItem('authToken');
                setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
            }
        } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    const login = async (apiResponse: LoginApiResponse) => {
        try {
            const { token, user: userFromApi } = apiResponse;
            localStorage.setItem('authToken', token);
            
            const decodedPayload = jwtDecode<IUser>(token);

            const userData: IUser = {
                id: decodedPayload.userId,
                userId: decodedPayload.userId,
                username: userFromApi.username,
                fullName: userFromApi.fullName,
                roles: userFromApi.roles,
                permissions: userFromApi.permissions,
                driverNumericId: decodedPayload.driverNumericId || null,
                driverEmail: decodedPayload.driverEmail || '',
                userLevel: decodedPayload.userLevel,
                isActive: true,
            };

            setAuthState({
                isAuthenticated: true,
                user: userData,
                token: token,
                isLoading: false,
            });
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
            console.error("Failed to process API response on login:", error);
            logout();
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        delete apiClient.defaults.headers.common['Authorization'];
        setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
        router.push('/login');
    };

    // --- NEW FUNCTION TO UPDATE USER CONTEXT ---
    const updateUserContext = (updatedProfile: UserProfileResponseDto) => {
        setAuthState(prevState => {
            if (!prevState.user) return prevState;
            
            const updatedUser: IUser = {
                ...prevState.user,
                fullName: updatedProfile.fullName,
                driverEmail: updatedProfile.driverEmail,
            };

            return { ...prevState, user: updatedUser };
        });
    };

    return (
        <AuthContext.Provider value={{ ...authState, login, logout, updateUserContext }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};