// frontend/src/app/[lng]/(auth)/login/page.tsx
'use client';

import React, { useState, FormEvent } from 'react';
// --- FIX 1: Import 'useParams' to get the current language ---
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { loginUserApi } from '../../../../services/authService';
import { UserLoginCredentials } from '../../../../types';

import { useTranslation } from '@/i18n/useTranslation';
// --- FIX 2: Import language settings for fallback ---
import { fallbackLng, languages } from '@/i18n/settings';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import { alpha, useTheme } from '@mui/material/styles';
import Image from 'next/image';
import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import dynamic from 'next/dynamic';

import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import axios from 'axios';

const SettingsModal = dynamic(() => import('@/components/common/SettingsModal'), { ssr: false });

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { t } = useTranslation('login');
    const { login } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    // --- FIX 3: Get the current language from the URL params ---
    const params = useParams() as { lng?: string };
    const currentLng = (params.lng && languages.includes(params.lng)) ? params.lng : fallbackLng;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        const credentials: UserLoginCredentials = { username, password };

        try {
            const apiResponse = await loginUserApi(credentials);
            console.log("--- User data from API ---", apiResponse.user);

            await login(apiResponse); 

            const userRoles = apiResponse.user.roles || [];
            const isDriver = userRoles.some((role: string) => role.toLowerCase() === 'kuljettaja');

            // --- FIX 4: Add the language prefix to the redirect paths ---
            if (isDriver) {
                console.log(`Redirecting to /${currentLng}/my-loads for Driver.`);
                router.push(`/${currentLng}/my-loads`);
            } else {
                console.log(`Redirecting to /${currentLng}/dashboard for non-Driver.`);
                router.push(`/${currentLng}/dashboard`);
            }

         } catch (err: unknown) {
            console.error("Login failed:", err);
            let message: string;
            if (axios.isAxiosError(err) && err.response) {
                message = err.response.data.message || t('errorGeneric');
            } else if (err instanceof Error) {
                message = err.message;
            } else {
                message = t('errorGeneric');
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const paperBorderRadius = typeof theme.shape.borderRadius === 'number'
        ? theme.shape.borderRadius * 2
        : 16;

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '100vh', width: '100vw', padding: 2,
        }}>
            <Box sx={{ position: 'fixed', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LanguageSwitcher />
                <Tooltip title="Server Settings">
                    <IconButton 
                        onClick={() => setIsSettingsOpen(true)}
                        sx={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.2)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.4)' } }}
                    >
                        <SettingsIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Paper
                elevation={12}
                sx={{
                    p: { xs: 3, sm: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    width: '100%', maxWidth: '420px', backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(2px)', borderRadius: paperBorderRadius,
                }}
            >
                <Box sx={{ mb: 2, width: 160 }}>
                    <Image
                        src="/images/hkk-logo.png" alt="Hkk Logo"
                        width={160} height={54} priority
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                </Box>
                <Typography component="h1" variant="h5" sx={{ color: 'text.primary', mb: 1 }}>
                    {t('title')}
                </Typography>
                <Typography component="p" variant="body2" sx={{ color: 'text.secondary', mb: 3, textAlign: 'center' }}>
                    {t('subtitle')}
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                    <TextField
                        margin="normal" required fullWidth id="username"
                        label={t('username')} name="username" autoComplete="username"
                        autoFocus value={username} onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal" required fullWidth name="password"
                        label={t('password')} type="password" id="password"
                        autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    {error && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}
                    <Button
                        type="submit" fullWidth variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : t('signIn')}
                    </Button>
                </Box>
            </Paper>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 'auto', pt: 4, pb: 2 }}>
                {t('copyright', { year: new Date().getFullYear() })}
            </Typography>
            {isSettingsOpen && (
                <SettingsModal 
                    open={isSettingsOpen} 
                    onCloseAction={() => setIsSettingsOpen(false)}
                />
            )}
        </Box>
    );
}