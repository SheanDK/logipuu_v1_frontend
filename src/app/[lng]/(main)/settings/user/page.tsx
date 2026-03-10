// frontend/src/app/(main)/settings/user/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, CircularProgress, Alert,
    AlertColor, Card, CardHeader, CardContent, Divider, Stack
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAuth } from '../../../../../contexts/AuthContext';
import { updateMyProfileApi, changeMyPasswordApi } from '../../../../../services/userService';
import { UpdateUserProfilePayload, ChangePasswordPayload } from '../../../../../types';

import { useTranslation } from '@/i18n/useTranslation';

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

export default function UserSettingsPage() {
    const { user, isLoading, updateUserContext } = useAuth();
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);

    const { t } = useTranslation(['myProfile', 'common']);
    const isDriver = !!user?.roles.includes('Kuljettaja');

    // Validation schemas
    const profileSchema: yup.ObjectSchema<UserProfileFormData> = yup.object({
        fullName: yup.string().required(t('errors.fullNameRequired')).min(2, t('errors.nameTooShort')),
        email: yup.string().email(t('errors.emailInvalid')).required(t('errors.emailRequired')),
    });

    const passwordSchema: yup.ObjectSchema<ChangePasswordFormData> = yup.object({
        currentPassword: yup.string().required(t('errors.currentPasswordRequired')),
        newPassword: yup
            .string()
            .required(t('errors.newPasswordRequired'))
            .min(8, t('errors.newPasswordMin')),
        confirmNewPassword: yup
            .string()
            .required(t('errors.confirmNewPasswordRequired'))
            .oneOf([yup.ref('newPassword')], t('errors.passwordsDoNotMatch')),
    });

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
        watch,
        trigger,
        formState: {
            errors: passwordErrors,
            isValid: isPasswordValid,
            isDirty: isPasswordDirty,
            touchedFields: passwordTouched,
            dirtyFields: passwordDirty,
        },
    } = useForm<ChangePasswordFormData>({
        resolver: yupResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
        mode: 'onChange',
        reValidateMode: 'onChange',
    });

    const newPw = watch('newPassword');
    const confirmPw = watch('confirmNewPassword');

    useEffect(() => {
        if (passwordTouched.confirmNewPassword || passwordDirty.confirmNewPassword || !!confirmPw) {
            trigger('confirmNewPassword');
        }
    }, [newPw, confirmPw, trigger, passwordTouched.confirmNewPassword, passwordDirty.confirmNewPassword]);

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
            setFeedback({ type: 'success', message: response.message || t('feedback.profileSaved') });
        } catch (err: any) {
            const message = err.response?.data?.message || t('errors.profileSaveFailed');
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
            setFeedback({ type: 'success', message: response.message || t('feedback.passwordChanged') });
            resetPasswordForm();
        } catch (err: any) {
            const message = err.response?.data?.message || t('errors.passwordChangeFailed');
            setFeedback({ type: 'error', message });
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    if (!user) {
        return <Paper sx={{ p: 3, m: 2 }}><Alert severity="warning">{t('notLoggedIn')}</Alert></Paper>;
    }

    return (
        // FIX: Removed "mx: auto" to align content to the left
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
                {t('title')}
            </Typography>

            {feedback && (
                <Alert severity={feedback.type} sx={{ mb: 3, maxWidth: 800 }} onClose={() => setFeedback(null)}>
                    {feedback.message}
                </Alert>
            )}

            <Stack spacing={4} sx={{ maxWidth: 800 }}>
                {/* Profile Details Card */}
                <Card elevation={2}>
                    <CardHeader title={t('profileCard.title')} titleTypographyProps={{ variant: 'h6' }} sx={{ pb: 1 }} />
                    <Divider />
                    <CardContent>
                        <Box component="form" onSubmit={handleProfileSubmit(onProfileSubmit)} noValidate>
                            <Stack spacing={2}>
                                <Controller
                                    name="fullName"
                                    control={profileControl}
                                    render={({ field }) => (
                                        <TextField {...field} label={t('fields.fullName')} fullWidth size="small" required error={!!profileErrors.fullName} helperText={profileErrors.fullName?.message} />
                                    )}
                                />
                                {isDriver && (
                                    <Controller
                                        name="email"
                                        control={profileControl}
                                        render={({ field }) => (
                                            <TextField {...field} label={t('fields.email')} fullWidth size="small" required error={!!profileErrors.email} helperText={profileErrors.email?.message} />
                                        )}
                                    />
                                )}
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <TextField label={t('fields.usernameId')} value={user.username || ''} fullWidth size="small" disabled />
                                    <TextField label={t('fields.roles')} value={user.roles?.join(', ') || t('fields.noRoles')} fullWidth size="small" disabled />
                                </Box>
                            </Stack>
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button type="submit" variant="contained" disabled={isSavingProfile}>
                                    {isSavingProfile ? <CircularProgress size={24} color="inherit" /> : t('profileCard.buttons.saveProfile')}
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card elevation={2}>
                    <CardHeader title={t('passwordCard.title')} titleTypographyProps={{ variant: 'h6' }} sx={{ pb: 1 }} />
                    <Divider />
                    <CardContent>
                        <Box component="form" onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate>
                            <Stack spacing={2}>
                                <Controller
                                    name="currentPassword"
                                    control={passwordControl}
                                    render={({ field }) => (
                                        <TextField {...field} label={t('passwordCard.currentPassword')} type="password" fullWidth size="small" required error={!!passwordErrors.currentPassword} helperText={passwordErrors.currentPassword?.message} />
                                    )}
                                />
                                <Controller
                                    name="newPassword"
                                    control={passwordControl}
                                    render={({ field }) => (
                                        <TextField {...field} label={t('passwordCard.newPassword')} type="password" fullWidth size="small" required error={!!passwordErrors.newPassword} helperText={passwordErrors.newPassword?.message} />
                                    )}
                                />
                                <Controller
                                    name="confirmNewPassword"
                                    control={passwordControl}
                                    render={({ field }) => (
                                        <TextField {...field} label={t('passwordCard.confirmNewPassword')} type="password" fullWidth size="small" required error={!!passwordErrors.confirmNewPassword} helperText={passwordErrors.confirmNewPassword?.message} />
                                    )}
                                />
                            </Stack>
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={!isPasswordValid || isSavingPassword}
                                >
                                    {isSavingPassword ? <CircularProgress size={24} color="inherit" /> : t('passwordCard.buttons.changePassword')}
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
}