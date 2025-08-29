// frontend/src/app/(auth)/login/page.tsx (නිවැරදි කරන ලද / CORRECTED)
'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { loginUserApi } from '../../../services/authService';
import { UserLoginCredentials } from '../../../types/auth';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import LinkMaterial from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import { alpha, useTheme } from '@mui/material/styles';
import Image from 'next/image';

export default function LoginPage() {
    // State for form fields, errors, and loading status
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Get the login function from AuthContext and router from Next.js
    const { login } = useAuth();
    const router = useRouter(); 
    const theme = useTheme();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        const credentials: UserLoginCredentials = { username, password };
        
        try {
            // Step 1: Call the API to get the token and user data.
            const apiResponse = await loginUserApi(credentials);
            
            // Step 2: Update the global authentication context with the response.
            // The login function in the context will handle setting state and localStorage.
            await login(apiResponse); 
            
            // Step 3: AFTER the context is updated, navigate to the dashboard.
            // This is the correct place for navigation logic.
            router.push('/dashboard'); 

        } catch (err: any) {
            // Handle login errors (e.g., wrong password, user not found).
            console.error("Login failed:", err);
            const message = err.response?.data?.message || err.message || 'Login failed. Please try again.';
            setError(message);
        } finally {
            // Ensure loading state is turned off regardless of success or failure.
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
                    Sign in
                </Typography>
                <Typography component="p" variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3, textAlign: 'center' }}>
                    Welcome back! Please enter your credentials to access your account.
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
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
                        label="Password"
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
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                    <Grid container justifyContent="flex-end">
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <LinkMaterial href="#" variant="body2" color="primary.dark">
                                Forgot password?
                            </LinkMaterial>
                        </Box>
                    </Grid>
                </Box>
            </Paper>

            <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.85), mt: 'auto', pt: theme.spacing(3), pb: theme.spacing(2) }}>
                {'Copyright © WoodMaster LogiApp by Softrain '}
                {new Date().getFullYear()}
                {'.'}
            </Typography>
        </Box>
    );
}