// frontend/src/app/[lng]/(auth)/login/page.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // Keep useRouter if you have other navigation needs
import { useAuth } from '../../../../contexts/AuthContext';
import { loginUserApi } from '../../../../services/authService';
import { UserLoginCredentials } from '../../../../types/auth';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import { alpha, useTheme } from '@mui/material/styles';
import Image from 'next/image';

import { useTranslation } from '@/i18n/useTranslation';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { t } = useTranslation('login');

    const { login } = useAuth();
    // useRouter is no longer strictly needed for this function, but it's fine to keep it
    const router = useRouter();
    const theme = useTheme();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        const credentials: UserLoginCredentials = { username, password };

        try {
            // Step 1: Call API
            const apiResponse = await loginUserApi(credentials);

            // --- THIS IS THE FIX ---
            // Step 2: Update the context. The `login` function inside AuthContext
            // now handles ALL redirection logic itself. We don't need to do anything else here.
            await login(apiResponse);

            const userRoles = apiResponse.user.roles || [];
            if (userRoles.includes('Kuljettaja')) {
                router.push('/my-loads');
            } else {
                router.push('/timber-stacks'); // Or any other default office page
            }

            // Step 3: REMOVED the router.push('/dashboard') call from here.

        } catch (err: any) {
            console.error("Login failed:", err);
            const message = err.response?.data?.message || err.message || t('errorGeneric');
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate border radius safely based on the theme.
    const paperBorderRadius = typeof theme.shape.borderRadius === 'number'
        ? theme.shape.borderRadius * 2
        : parseInt(String(theme.shape.borderRadius).replace('px', '')) * 2;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                width: '100vw',
                padding: theme.spacing(2),
            }}
        >

            <Box
                sx={{
                    position: 'fixed',
                    top: 12,
                    right: 12,
                    zIndex: (t) => t.zIndex.modal + 1,
                    color: 'text.primary',
                }}
            >
                <LanguageSwitcher />
            </Box>

            <Paper
                elevation={6}
                sx={{
                    padding: theme.spacing(3, 4),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '420px',
                    backgroundColor: alpha(theme.palette.background.paper, 0.88),
                    backdropFilter: 'blur(10px)',
                    borderRadius: paperBorderRadius,
                    boxShadow: theme.shadows[10],
                }}
            >
                <Box sx={{ mb: 2, width: 160 }}>
                    <Image
                        src="/images/softrain-logo.png"
                        alt="Softrain Logo"
                        width={160}
                        height={54}
                        priority
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                </Box>

                <Typography component="h1" variant="h5" sx={{ color: theme.palette.text.primary, mb: 1 }}>
                    {t('title')}
                </Typography>
                <Typography component="p" variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3, textAlign: 'center' }}>
                    {t('subtitle')}
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label={t('username')}
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        variant="outlined"
                        sx={{ mb: 1 }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label={t('password')}
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        variant="outlined"
                        sx={{ mt: 1 }}
                    />

                    {error && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3, mb: 2, py: 1.25, fontSize: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? t('signingIn') : t('signIn')}
                    </Button>
                    {/* TODO if needed
                    <Grid container justifyContent="flex-end">
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <LinkMaterial href="#" variant="body2" color="primary.dark">
                                Forgot password?
                            </LinkMaterial>
                        </Box>
                    </Grid>
                    */}
                </Box>
            </Paper>

            <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.85), mt: 'auto', pt: theme.spacing(3), pb: theme.spacing(2) }}>
                {t('copyright', { year: new Date().getFullYear() })}
                {new Date().getFullYear()}
                {'.'}
            </Typography>
        </Box>
    );
}