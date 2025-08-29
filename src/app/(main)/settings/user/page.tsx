// frontend/src/app/(main)/settings/user/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, CircularProgress, Alert,
    Grid, AlertColor, Card, CardHeader, CardContent, Divider
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAuth } from '../../../../contexts/AuthContext';
import { updateMyProfileApi, changeMyPasswordApi } from '../../../../services/userService';
import { UpdateUserProfilePayload, ChangePasswordPayload } from '../../../../types';

// Define types for the forms
interface UserProfileFormData {
    fullName: string;
    email: string;
}

interface ChangePasswordFormData {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

// Validation schemas
const profileSchema = yup.object().shape({
    fullName: yup.string().required('Full name is required').min(2, 'Name is too short'),
    email: yup.string().email('Enter a valid email').required('Email is required'),
});

const passwordSchema = yup.object().shape({
    currentPassword: yup.string().required('Current password is required'),
    newPassword: yup.string()
        .required('New password is required')
        .min(8, 'New password must be at least 8 characters long'),
    confirmNewPassword: yup.string()
        .required('Please confirm your new password')
        .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
});

export default function UserSettingsPage() {
    const { user, isLoading, updateUserContext } = useAuth();
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);

    const {
        control: profileControl,
        handleSubmit: handleProfileSubmit,
        reset: resetProfileForm,
        formState: { errors: profileErrors }
    } = useForm<UserProfileFormData>({
        resolver: yupResolver(profileSchema),
        defaultValues: { fullName: '', email: '' },
    });

    const {
        control: passwordControl,
        handleSubmit: handlePasswordSubmit,
        reset: resetPasswordForm,
        formState: { errors: passwordErrors }
    } = useForm<ChangePasswordFormData>({
        resolver: yupResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
    });

    useEffect(() => {
        if (user) {
            resetProfileForm({
                fullName: user.fullName || '',
                email: user.driverEmail || '',
            });
        }
    }, [user, resetProfileForm]);

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const onProfileSubmit = async (data: UserProfileFormData) => {
        setIsSavingProfile(true);
        setFeedback(null);
        try {
            const payload: UpdateUserProfilePayload = {
                fullName: data.fullName,
                email: data.email,
            };
            const response = await updateMyProfileApi(payload);
            updateUserContext(response.profile);
            setFeedback({ type: 'success', message: response.message });
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update profile.';
            setFeedback({ type: 'error', message });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const onPasswordSubmit = async (data: ChangePasswordFormData) => {
        setIsSavingPassword(true);
        setFeedback(null);
        try {
            const payload: ChangePasswordPayload = {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            };
            const response = await changeMyPasswordApi(payload);
            setFeedback({ type: 'success', message: response.message });
            resetPasswordForm();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to change password.';
            setFeedback({ type: 'error', message });
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }
    
    if (!user) {
        return <Paper sx={{ p: 3, m: 2 }}><Alert severity="warning">Please log in to view user settings.</Alert></Paper>;
    }

    const isDriver = user.roles.includes('Kuljettaja');

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h4" component="h1" gutterBottom>
                User Profile & Settings
            </Typography>

            {feedback && (
                <Alert severity={feedback.type} sx={{ mb: 3 }} onClose={() => setFeedback(null)}>
                    {feedback.message}
                </Alert>
            )}

            <Grid container spacing={4}>
                {/* Profile Details Card */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardHeader title="Profile Details" />
                        <Divider />
                        <CardContent>
                            <Box component="form" onSubmit={handleProfileSubmit(onProfileSubmit)} noValidate>
                                <Controller
                                    name="fullName"
                                    control={profileControl}
                                    render={({ field }) => (
                                        <TextField {...field} label="Full Name" fullWidth margin="normal" required error={!!profileErrors.fullName} helperText={profileErrors.fullName?.message} />
                                    )}
                                />
                                {isDriver && (
                                    <Controller
                                        name="email"
                                        control={profileControl}
                                        render={({ field }) => (
                                            <TextField {...field} label="Email Address" fullWidth margin="normal" required error={!!profileErrors.email} helperText={profileErrors.email?.message} />
                                        )}
                                    />
                                )}
                                <TextField label="Username / User ID" value={user.username || ''} fullWidth margin="normal" disabled />
                                <TextField label="Roles" value={user.roles?.join(', ') || 'No roles assigned'} fullWidth margin="normal" disabled />
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button type="submit" variant="contained" disabled={isSavingProfile}>
                                        {isSavingProfile ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Change Password Card */}
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardHeader title="Change Password" />
                        <Divider />
                        <CardContent>
                            <Box component="form" onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate>
                                <Controller
                                    name="currentPassword"
                                    control={passwordControl}
                                    render={({ field }) => (
                                        <TextField {...field} label="Current Password" type="password" fullWidth margin="normal" required error={!!passwordErrors.currentPassword} helperText={passwordErrors.currentPassword?.message} />
                                    )}
                                />
                                <Controller
                                    name="newPassword"
                                    control={passwordControl}
                                    render={({ field }) => (
                                        <TextField {...field} label="New Password" type="password" fullWidth margin="normal" required error={!!passwordErrors.newPassword} helperText={passwordErrors.newPassword?.message} />
                                    )}
                                />
                                <Controller
                                    name="confirmNewPassword"
                                    control={passwordControl}
                                    render={({ field }) => (
                                        <TextField {...field} label="Confirm New Password" type="password" fullWidth margin="normal" required error={!!passwordErrors.confirmNewPassword} helperText={passwordErrors.confirmNewPassword?.message} />
                                    )}
                                />
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button type="submit" variant="contained" disabled={isSavingPassword}>
                                        {isSavingPassword ? <CircularProgress size={24} color="inherit" /> : 'Change Password'}
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}