// frontend/src/contexts/AuthContext.tsx
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { AuthState, AuthContextType, LoginApiResponse, IUser } from '../types';
import apiClient from '../services/apiClient';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography, Box } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTranslation } from '@/i18n/useTranslation';
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: true,
        showForceLogoutModal: false,
        forceLogoutReason: '',
    });
    const router = useRouter();
    const { t } = useTranslation(['common', 'login']);

    // This effect runs ONLY ONCE on initial app load
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decodedPayload = jwtDecode<IUser & { exp: number }>(token);
                if (decodedPayload.exp * 1000 > Date.now()) {
                    // Token is valid, set the auth state
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    setAuthState({
                        isAuthenticated: true,
                        // Reconstruct the user object from the token payload
                        user: {
                            id: decodedPayload.userId,
                            userId: decodedPayload.userId,
                            username: decodedPayload.userId, // Use userId as username if not available
                            fullName: decodedPayload.fullName,
                            roles: decodedPayload.roles,
                            permissions: decodedPayload.permissions,
                            driverNumericId: decodedPayload.driverNumericId || null,
                            driverEmail: decodedPayload.driverEmail || '',
                            userLevel: decodedPayload.userLevel,
                            isActive: true,
                        },
                        token: token,
                        isLoading: false,
                    });
                } else {
                    // Token expired
                    localStorage.removeItem('authToken');
                    setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
                }
            } catch (error) {
                console.error("Invalid token found:", error);
                localStorage.removeItem('authToken');
                setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
            }
        } else {
            // No token found
            setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
        }
    }, []); // Empty dependency array means this runs only once

    const login = async (apiResponse: LoginApiResponse): Promise<void> => {
        const { token } = apiResponse;
        localStorage.setItem('authToken', token);

        try {
            const decodedPayload = jwtDecode<IUser>(token);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Reconstruct the user object from the DECODED TOKEN PAYLOAD.
            // This is more reliable than mixing with apiResponse.user.
            const userData: IUser = {
                id: decodedPayload.userId,
                userId: decodedPayload.userId,
                username: decodedPayload.userId, // Use userId from token
                fullName: decodedPayload.fullName,
                roles: decodedPayload.roles,
                permissions: decodedPayload.permissions,
                driverNumericId: decodedPayload.driverNumericId || null,
                driverEmail: decodedPayload.driverEmail || '',
                userLevel: decodedPayload.userLevel,
                isActive: true, // Assume active on login
            };

            setAuthState({
                isAuthenticated: true,
                user: userData,
                token: token,
                isLoading: false,
            });
        } catch (error) {
            console.error("Failed to process token on login:", error);
            // Don't call logout() here to avoid redirect loop, just clear state
            localStorage.removeItem('authToken');
            delete apiClient.defaults.headers.common['Authorization'];
            setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false });
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        delete apiClient.defaults.headers.common['Authorization'];
        setAuthState({ isAuthenticated: false, user: null, token: null, isLoading: false, showForceLogoutModal: false });
        // The redirect should be handled by the AuthWrapper in the layout
        router.push('/login');
    };

    const setForceLogout = (reason: string) => {
        setAuthState(prev => ({
            ...prev,
            showForceLogoutModal: true,
            forceLogoutReason: reason
        }));
    };

    // ... (updateUserContext can remain the same)

    return (
        <AuthContext.Provider value={{ ...authState, login, logout, setForceLogout, updateUserContext: () => { } }}>
            {children}

            {/* 🚨 Global Force Logout Modal 🚨 */}
            <Dialog
                open={!!authState.showForceLogoutModal}
                onClose={() => { }} // රියදුරුට මෙය ඉබේ වැසිය නොහැක
                PaperProps={{
                    sx: { borderRadius: '16px', p: 1, maxWidth: '400px' }
                }}
            >
                <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
                    <Box sx={{
                        width: 60, height: 60, borderRadius: '50%', bgcolor: '#fff4e5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2
                    }}>
                        <WarningAmberIcon sx={{ color: '#ffa726', fontSize: 35 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800} component="div">{t("login:session-terminated")}</Typography>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ textAlign: 'center', color: 'text.primary', px: 2 }}>
                        {t(authState.forceLogoutReason || "login:session-terminated-reason")}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={logout}
                        sx={{
                            bgcolor: '#a38f6d',
                            fontWeight: 800,
                            borderRadius: '10px',
                            py: 1.2,
                            '&:hover': { bgcolor: '#8c7a5d' }
                        }}
                    >
                        {t("login:understood-log-out")}
                    </Button>
                </DialogActions>
            </Dialog>
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