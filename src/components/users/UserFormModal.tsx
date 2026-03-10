// src/components/users/UserFormModal.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    CircularProgress, Alert, Box, FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, FormHelperText, Switch, Typography, Stack, useTheme, alpha
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { IUser, IRole, CreateUserPayload, UpdateUserPayload, IDriverBasicInfo } from '../../types';
import { fetchAllRolesApi } from '../../services/roleService';
import { fetchDriversWithoutAccountApi } from '../../services/driverService';
import { useTranslation } from '@/i18n/useTranslation';

interface UserFormModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSaveAction: (data: CreateUserPayload | UpdateUserPayload, username?: string) => Promise<void>;
    user: IUser | null;
    isSaving: boolean;
    apiError: string | null;
    currentUser: IUser | null;
}

interface UserFormData {
    username: string;
    fullName: string;
    password?: string;
    confirmPassword?: string;
    roleId: number | "";
    isActive: boolean;
    kuljId: number | "";
}

const DRIVER_ROLE_ID = 5;

const getValidationSchema = (isEditMode: boolean, selectedRoleId: number | "") =>
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
        .mixed()
        .required('A role is required')
        .test('not-empty', 'A role must be selected', (val) => val !== ''),
    kuljId: yup.mixed().when([], {
        is: () => !isEditMode && selectedRoleId === DRIVER_ROLE_ID,
        then: (schema) => schema.required('Linking a driver is required').test('not-empty', 'Please select a driver', (val) => val !== ''),
        otherwise: (schema) => schema.optional()
    }),
    isActive: yup.boolean().required(),
}) as yup.ObjectSchema<UserFormData>);

export default function UserFormModal({ open, onCloseAction, onSaveAction, user, isSaving, apiError }: UserFormModalProps) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const isEditMode = Boolean(user);
    const [allRoles, setAllRoles] = useState<IRole[]>([]);
    const [driversNoAccount, setDriversNoAccount] = useState<IDriverBasicInfo[]>([]);
    const { t } = useTranslation(['userForm', 'common']);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isValid }
    } = useForm<UserFormData>({
        resolver: (values, context, options) => {
            return yupResolver(getValidationSchema(isEditMode, values.roleId))(values, context, options);
        },
        defaultValues: {
            username: '',
            fullName: '',
            password: '',
            confirmPassword: '',
            roleId: "",
            isActive: true,
            kuljId: ""
        },
        mode: 'onChange',
    });

    const selectedRoleId = watch('roleId');
    const [initialFormState, setInitialFormState] = useState<Partial<UserFormData>>({});
    const currentValues = watch();

    const hasFormChanged = useMemo(() => {
        if (!isEditMode) return true;
        return (
            initialFormState.fullName !== currentValues.fullName ||
            initialFormState.roleId !== currentValues.roleId ||
            initialFormState.isActive !== currentValues.isActive
        );
    }, [isEditMode, initialFormState, currentValues]);

    useEffect(() => {
        if (open) {
            fetchAllRolesApi().then(setAllRoles).catch(console.error);
            if (!isEditMode) {
                fetchDriversWithoutAccountApi().then(setDriversNoAccount).catch(console.error);
            }
        }
    }, [open, isEditMode]);

    useEffect(() => {
        if (open) {
            const initialState: UserFormData = {
                username: user?.username || '',
                fullName: user?.fullName || '',
                password: '',
                confirmPassword: '',
                roleId: (user?.roleIds?.[0] ?? '') as number | '',
                isActive: user ? user.isActive : true,
                kuljId: (user?.driverNumericId ?? '') as number | '',
            };
            reset(initialState);
            setInitialFormState(initialState);
        }
    }, [user, open, reset]);

    const handleDriverSelect = (id: number) => {
        const drv = driversNoAccount.find(d => d.id === id);
        if (drv) {
            setValue('fullName', drv.name, { shouldValidate: true });
        }
    };

    const onSubmitHandler: SubmitHandler<UserFormData> = async (data) => {
        if (data.roleId === '') return;

        let payload: CreateUserPayload | UpdateUserPayload;
        if (isEditMode) {
            payload = { fullName: data.fullName, roleIds: [data.roleId], isActive: data.isActive };
        } else {
            payload = {
                username: data.username,
                fullName: data.fullName,
                password: data.password,
                isActive: data.isActive,
                roleIds: [Number(data.roleId)],
                kuljId: data.roleId === DRIVER_ROLE_ID ? Number(data.kuljId) : null
            };
        }
        await onSaveAction(payload, user?.username);
    };

    return (
        <Dialog
            open={open}
            onClose={onCloseAction}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    bgcolor: isDarkMode ? '#1e1e1e' : '#fff',
                    backgroundImage: 'none'
                }
            }}
        >
            <DialogTitle sx={{
                fontWeight: 800,
                bgcolor: isDarkMode ? '#252525' : '#f8f9fa',
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 2
            }}>
                {user ? t('titles.edit') : t('titles.add')}
            </DialogTitle>

            <form id="user-form" onSubmit={handleSubmit(onSubmitHandler)}>
                <DialogContent dividers sx={{ p: 3, bgcolor: isDarkMode ? '#1e1e1e' : '#fff' }}>
                    {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

                    <Box sx={{
                        display: 'grid',
                        gap: 2.5,
                        pt: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }
                    }}>

                        {/* Role Selection */}
                        <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                            <FormControl fullWidth required size="small" error={!!errors.roleId}>
                                <InputLabel id="role-select-label">{t('fields.role')}</InputLabel>
                                <Controller
                                    name="roleId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            value={field.value ?? ''}
                                            labelId="role-select-label"
                                            label={t('fields.role')}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        >
                                            {allRoles.map((role) => (
                                                <MenuItem key={role.rooliId} value={role.rooliId}>
                                                    {role.roolinNimi}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                                {errors.roleId && <FormHelperText>{errors.roleId.message as string}</FormHelperText>}
                            </FormControl>
                        </Box>

                        {/* Driver Link Dropdown */}
                        {!isEditMode && Number(selectedRoleId) === DRIVER_ROLE_ID && (
                            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                                <FormControl fullWidth required size="small" error={!!errors.kuljId}>
                                    <InputLabel id="driver-link-label">Link to Existing Driver</InputLabel>
                                    <Controller
                                        name="kuljId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                value={field.value !== null && field.value !== undefined ? field.value : ''}
                                                labelId="driver-link-label"
                                                label="Link to Existing Driver"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const numericVal = String(val) === '' ? null : Number(val);
                                                    field.onChange(numericVal);
                                                    if (numericVal !== null) handleDriverSelect(numericVal);
                                                }}
                                            >
                                                {driversNoAccount.length === 0 ? (
                                                    <MenuItem disabled value="">
                                                        <em>No drivers available without an account</em>
                                                    </MenuItem>
                                                ) : (
                                                    driversNoAccount.map((d) => (
                                                        <MenuItem key={d.id} value={d.id}>
                                                            {d.name}
                                                        </MenuItem>
                                                    ))
                                                )}
                                            </Select>
                                        )}
                                    />
                                    <FormHelperText>
                                        {errors.kuljId ? (errors.kuljId.message as string) : 'Select a driver from Driver Management.'}
                                    </FormHelperText>
                                </FormControl>
                            </Box>
                        )}

                        <Box>
                            <Controller
                                name="username"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        label={t('fields.username')}
                                        fullWidth required size="small"
                                        disabled={isEditMode}
                                        error={!!errors.username}
                                        helperText={errors.username?.message}
                                    />
                                )}
                            />
                        </Box>

                        <Box>
                            <Controller
                                name="fullName"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? ''}
                                        label={t('fields.fullName')}
                                        fullWidth required size="small"
                                        error={!!errors.fullName}
                                        helperText={errors.fullName?.message}
                                    />
                                )}
                            />
                        </Box>

                        {!isEditMode && (
                            <>
                                <Box>
                                    <Controller
                                        name="password"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                value={field.value ?? ''}
                                                type="password"
                                                label={t('fields.password')}
                                                fullWidth required size="small"
                                                error={!!errors.password}
                                                helperText={errors.password?.message}
                                            />
                                        )}
                                    />
                                </Box>
                                <Box>
                                    <Controller
                                        name="confirmPassword"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                value={field.value ?? ''}
                                                type="password"
                                                label={t('fields.confirmPassword')}
                                                fullWidth required size="small"
                                                error={!!errors.confirmPassword}
                                                helperText={errors.confirmPassword?.message}
                                            />
                                        )}
                                    />
                                </Box>
                            </>
                        )}

                        {/* Status Switch Strip */}
                        <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#f8f9fa',
                                p: 1.5,
                                borderRadius: '10px',
                                border: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {t('fields.status')} : <Box component="span" sx={{ color: watch('isActive') ? 'success.main' : 'error.main' }}>
                                        {watch('isActive') ? t('status.active') : t('status.inactive')}
                                    </Box>
                                </Typography>
                                <Controller
                                    name="isActive"
                                    control={control}
                                    render={({ field }) => <Switch {...field} checked={field.value} size="small" color="primary" />}
                                />
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{
                    p: 2.5,
                    bgcolor: isDarkMode ? '#252525' : '#f8f9fa',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    justifyContent: 'space-between'
                }}>
                    <Button
                        onClick={onCloseAction}
                        disabled={isSaving}
                        variant="outlined"
                        sx={{ borderRadius: '20px', px: 3, color: theme.palette.text.secondary, borderColor: 'divider' }}
                    >
                        {t('common:buttons.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSaving || !isValid || (isEditMode && !hasFormChanged)}
                        sx={{
                            bgcolor: '#a38f6d',
                            borderRadius: '20px',
                            px: 4,
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: '#8c7a5d' }
                        }}
                    >
                        {isSaving ? <CircularProgress size={24} color="inherit" /> : t('common:buttons.save')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}