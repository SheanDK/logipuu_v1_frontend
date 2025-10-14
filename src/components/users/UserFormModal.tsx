// src/components/users/UserFormModal.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    CircularProgress, Alert, Grid, FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, FormHelperText, Box, Switch, Typography
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { IUser, IRole, CreateUserPayload, UpdateUserPayload } from '../../types';
import { fetchAllRolesApi } from '../../services/roleService';
import { minLength } from 'zod';

import { useTranslation } from '@/i18n/useTranslation';

// Props Interface remains the same.
interface UserFormModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSaveAction: (data: CreateUserPayload | UpdateUserPayload, username?: string) => Promise<void>;
    user: IUser | null;
    isSaving: boolean;
    apiError: string | null;
    currentUser: IUser | null;
}

// 1. Define a simple, explicit interface for the form's data structure.
// This is now the single source of truth for the form's shape.
interface UserFormData {
    username: string;
    fullName: string;
    password?: string;
    confirmPassword?: string;
    roleId: number | null;
    isActive: boolean;
}

// 2. Create the Yup schema dynamically based on whether it's edit mode.
const getValidationSchema = (isEditMode: boolean) =>
(yup.object({
    username: yup.string().required('Username is required.'),
    fullName: yup.string().required('Full name is required.'),
    password: yup
        .string()
        .when([], {
            is: () => !isEditMode,
            then: (schema) => schema.required('Password is required').min(8, 'Password must be at least 8 characters'),
        }),
    confirmPassword: yup.string().when('password', ([password], schema) => {
        return password
            ? schema.required('Please confirm password').oneOf([yup.ref('password')], 'Passwords do not match')
            : schema.optional();
    }),
    roleId: yup
        .number()
        .transform((v, orig) => (orig === '' ? null : v))
        .nullable()
        .typeError('A role must be selected')
        .required('A role is required'),
    isActive: yup.boolean().required(),
}) as yup.ObjectSchema<UserFormData>);




export default function UserFormModal({ open, onCloseAction, onSaveAction, user, isSaving, apiError, currentUser }: UserFormModalProps) {
    const isEditMode = Boolean(user);
    const [allRoles, setAllRoles] = useState<IRole[]>([]);
    const { t } = useTranslation(['userForm', 'common']);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isValid }
    } = useForm<UserFormData>({
        resolver: yupResolver(getValidationSchema(isEditMode)),
        defaultValues: {
            username: '',
            fullName: '',
            password: '',
            confirmPassword: '',
            roleId: null,
            isActive: true,
        },
        mode: 'onChange',
    });

    const [initialFormState, setInitialFormState] = useState<Partial<UserFormData>>({});
    const currentValues = watch();

    const hasFormChanged = useMemo(() => {
        // Create a subset of values to compare for changes.
        const initialComparable = {
            fullName: initialFormState.fullName,
            roleId: initialFormState.roleId,
            isActive: initialFormState.isActive,
        };
        const currentComparable = {
            fullName: currentValues.fullName,
            roleId: currentValues.roleId,
            isActive: currentValues.isActive,
        };
        return JSON.stringify(initialComparable) !== JSON.stringify(currentComparable);
    }, [initialFormState, currentValues]);
    // --- END CORRECTION ---

    useEffect(() => {
        if (open) {
            const getRoles = async () => {
                try {
                    const rolesData = await fetchAllRolesApi();
                    setAllRoles(rolesData);
                } catch (err) { console.error("Failed to load roles:", err); }
            };
            getRoles();
        }
    }, [open]);


    useEffect(() => {
        if (open) {
            const initialState: UserFormData = {
                username: user?.username || '',
                fullName: user?.fullName || '',
                password: '',
                confirmPassword: '',
                roleId: (user?.roleIds?.[0] ?? null) as number | null,
                isActive: user ? user.isActive : true,
            };

            console.log('[UserFormModal] user prop:', user);
            console.log('[UserFormModal] user.roleIds:', user?.roleIds);
            console.log('[UserFormModal] initialState:', initialState);

            reset(initialState);
            setInitialFormState(initialState);
        }
    }, [user, open, reset]);

    const onSubmitHandler: SubmitHandler<UserFormData> = async (data) => {
        if (typeof data.roleId !== 'number') return;

        let payload: CreateUserPayload | UpdateUserPayload;
        if (isEditMode) {
            payload = { fullName: data.fullName, roleIds: [data.roleId], isActive: data.isActive };
        } else {
            payload = { ...data, roleIds: [data.roleId] };
            delete (payload as any).confirmPassword;
            delete (payload as any).roleId;
        }
        await onSaveAction(payload, user?.username);
    };

    const isSaveButtonDisabled = () => {
        if (isSaving || !isValid) return true;
        if (isEditMode) {
            return !hasFormChanged;
        }
        // In create mode, we can rely on `isValid`. The form starts empty, so any valid state is a change.
        return false;
    };

    return (
        <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm">
            <DialogTitle>{user ? t('titles.edit') : t('titles.add')}</DialogTitle>
            <form id="user-form" onSubmit={handleSubmit(onSubmitHandler)}>
                <DialogContent dividers>
                    {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError || t('errors.api')}</Alert>}
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            pt: 1,
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        }}
                    >
                        <Box><Controller name="username" control={control} render={({ field }) => <TextField {...field} label={t('fields.username')} fullWidth required disabled={isEditMode} error={!!errors.username} helperText={errors.username?.message} />} /></Box>
                        <Box><Controller name="fullName" control={control} render={({ field }) => <TextField {...field} label={t('fields.fullName')} fullWidth required error={!!errors.fullName} helperText={errors.fullName?.message} />} /></Box>
                        {!isEditMode && (
                            <>
                                <Box><Controller name="password" control={control} render={({ field }) => <TextField {...field} type="password" label={t('fields.password')} fullWidth required={!isEditMode} error={!!errors.password} helperText={errors.password?.message} />} /></Box>
                                <Box><Controller name="confirmPassword" control={control} render={({ field }) => <TextField {...field} type="password" label={t('fields.confirmPassword')} fullWidth required={!isEditMode} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />} /></Box>
                            </>
                        )}
                        <Box><FormControl fullWidth required error={!!errors.roleId}><InputLabel id="role-select-label">{t('fields.role')}</InputLabel><Controller name="roleId" control={control} render={({ field }) => (<Select {...field} labelId="role-select-label" label={t('fields.role')} sx={{ width: 150 }} onChange={(e) => field.onChange(Number(e.target.value))} >{allRoles.map((role) => (<MenuItem key={role.rooliId} value={role.rooliId}>{role.roolinNimi}</MenuItem>))}</Select>)} />{errors.roleId && <FormHelperText>{errors.roleId.message}</FormHelperText>}</FormControl></Box>
                        <Box><FormControlLabel control={<Controller name="isActive" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />} label={<Typography>{t('fields.status')} <b>{watch('isActive') ? t('status.active') : t('status.inactive')}</b></Typography>} /></Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onCloseAction} disabled={isSaving}>{t('common:buttons.cancel')}</Button>
                    <Button
                        type="submit"
                        form="user-form"
                        variant="contained"
                        disabled={isSaveButtonDisabled()}
                    >
                        {isSaving ? <CircularProgress size={24} color="inherit" /> : t('common:buttons.save')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}