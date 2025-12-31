// frontend/src/app/(main)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper, Chip, AlertColor
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';

import { useAuth } from '../../../../contexts/AuthContext';
import { IUser, IBackendUser, CreateUserPayload, UpdateUserPayload } from '../../../../types';
import { getAllUsersApi, fetchUserByTunnusApi, deleteUserApi, createUserApi, updateUserApi } from '../../../../services/userService';
import UserFormModal from '../../../../components/users/UserFormModal';
import ConfirmationDialog from '../../../../components/common/ConfirmationDialog';

import { useTranslation } from '@/i18n/useTranslation';
import { roleKeyOf, roleDisplayName } from '@/utils/i18nKeys';

export default function UserManagementPage() {
    const { user: currentUser, isLoading: isAuthLoading } = useAuth();
    const [users, setUsers] = useState<IUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<IUser | null>(null);
    const [isFetchingUser, setIsFetchingUser] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<IUser | null>(null);

    const hasViewPermission = useMemo(() => currentUser?.permissions?.includes('users_view'), [currentUser]);
    const canCreate = useMemo(() => currentUser?.permissions?.includes('users_create'), [currentUser]);
    const canEdit = useMemo(() => currentUser?.permissions?.includes('users_edit'), [currentUser]);
    const canDelete = useMemo(() => currentUser?.permissions?.includes('users_delete'), [currentUser]);
    const isCurrentUserSuperUser = useMemo(() => currentUser?.roles.includes('Superuser'), [currentUser]);

    const { t } = useTranslation(['users', 'common']);

    const backendToUser = (b: IBackendUser): IUser => ({
        id: b.tunnus,
        username: b.tunnus,
        fullName: b.nimi,
        roles: b.roles,
        isActive: b.aktiivinen,
        roleIds: b.roleIds || [],
        userId: b.tunnus,
        driverNumericId: b.kuljId ?? null,
        driverEmail: null,
        userLevel: b.taso ?? 4,
    });

    const loadUsers = useCallback(async () => {
        if (!hasViewPermission) { setIsLoading(false); return; }
        setIsLoading(true);
        setFeedback(null);
        try {
            const rawData: IBackendUser[] = await getAllUsersApi();
            const transformedUsers: IUser[] = rawData.map((backendUser) => ({
                id: backendUser.tunnus,
                username: backendUser.tunnus,
                fullName: backendUser.nimi,
                roles: backendUser.roles,
                isActive: backendUser.aktiivinen,
                roleIds: backendUser.roleIds || [],
                userId: backendUser.tunnus,
                driverNumericId: backendUser.kuljId || null,
                driverEmail: null,
                userLevel: backendUser.taso || 4,
            }));
            setUsers(transformedUsers);
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || t('errors.fetchUsers') });
        } finally {
            setIsLoading(false);
        }
    }, [hasViewPermission]);

    useEffect(() => { if (feedback) { const timer = setTimeout(() => setFeedback(null), 5000); return () => clearTimeout(timer); } }, [feedback]);
    useEffect(() => { if (!isAuthLoading && hasViewPermission) { loadUsers(); } else if (!isAuthLoading && !hasViewPermission) { setIsLoading(false); } }, [isAuthLoading, hasViewPermission, loadUsers]);

    const handleOpenModalForCreate = () => { setEditingUser(null); setModalError(null); setIsModalOpen(true); };

    const handleOpenModalForEdit = async (userToEdit: IUser) => {
        setModalError(null);
        setIsFetchingUser(true);
        try {
            const fullBackendUser = await fetchUserByTunnusApi(userToEdit.username);
            const fullUser = backendToUser(fullBackendUser);
            setEditingUser(fullUser);
        } catch (e: any) {
            console.error('[handleOpenModalForEdit] fetchUserByTunnusApi failed:', e?.response?.data || e);
            setEditingUser(userToEdit);
            setModalError(e?.response?.data?.message ?? t('errors.fetchUsers'));
        } finally {
            setIsFetchingUser(false);
            setIsModalOpen(true);
        }
    };

    const handleDeleteClick = (userToDelete: IUser) => { setDeleteTarget(userToDelete); };
    const handleModalClose = () => { setIsModalOpen(false); setEditingUser(null); };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsSaving(true);
        try {
            await deleteUserApi(deleteTarget.username);
            setFeedback({ type: 'success', message: t('feedback.deleteSuccess', { username: deleteTarget.username }) });
            loadUsers();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || t('errors.deleteFailed') });
        } finally {
            setIsSaving(false);
            setDeleteTarget(null);
        }
    };

    const handleSave = async (data: CreateUserPayload | UpdateUserPayload, username?: string) => {
        setIsSaving(true);
        setModalError(null);
        try {
            let successMessage = '';
            if (username) {
                await updateUserApi(username, data as UpdateUserPayload);
                successMessage = t('feedback.updateSuccess', { username });
            } else {
                const createData = data as CreateUserPayload;
                await createUserApi(createData);
                successMessage = t('feedback.createSuccess', { username: createData.username });
            }
            handleModalClose();
            setFeedback({ type: 'success', message: successMessage });
            loadUsers();
        } catch (err: any) {
            setModalError(err.response?.data?.message || t('errors.saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    // --- UPDATED COLUMNS DEFINITION ---
    const columns: GridColDef<IUser>[] = useMemo(() => [
        // FIX: Swapped Full Name and Username
        // FIX: Removed flex, used fixed width for compact layout
        { 
            field: 'fullName', 
            headerName: t('columns.fullName'), 
            width: 250 
        },
        { 
            field: 'username', 
            headerName: t('columns.username'), 
            width: 150 
        },
        {
            field: 'roles',
            headerName: t('columns.role'),
            width: 200, 
            renderCell: ({ value }) => {
                const rolesArray: string[] = Array.isArray(value) ? value : [];
                const rawRole = rolesArray.length > 0 ? rolesArray[0] : 'N/A';
                const key = roleKeyOf(rawRole);

                return (
                    <Chip
                        label={roleDisplayName(rawRole, t)}
                        size="small"
                        color={key === 'superuser' ? 'error' : key === 'admin' ? 'warning' : 'primary'}
                        icon={
                            key === 'superuser' ? (
                                <SupervisorAccountIcon fontSize="small" />
                            ) : key === 'admin' ? (
                                <AdminPanelSettingsIcon fontSize="small" />
                            ) : (
                                <PersonIcon fontSize="small" />
                            )
                        }
                        variant="outlined"
                    />
                );
            },
        },
        { 
            field: 'isActive', 
            headerName: t('columns.status'), 
            width: 120, 
            type: 'boolean', 
            renderCell: (params) => (<Chip icon={params.value ? <CheckCircleIcon /> : <CancelIcon />} label={params.value ? t('status.active') : t('status.inactive')} color={params.value ? 'success' : 'default'} size="small" variant="outlined" />) 
        },
        {
            field: 'actions', 
            type: 'actions', 
            headerName: t('columns.actions'), 
            width: 100,
            getActions: ({ row }) => {
                const isTargetSuperUser = row.roles.includes('Superuser');
                const canPerformAction = !isTargetSuperUser || isCurrentUserSuperUser;
                const actions = [];
                if (canEdit && canPerformAction) {
                    actions.push(<GridActionsCellItem icon={<EditIcon />} label={t('actions.edit')} onClick={() => handleOpenModalForEdit(row)} />);
                }
                if (canDelete && canPerformAction) {
                    actions.push(<GridActionsCellItem icon={<DeleteIcon color="error" />} label={t('actions.delete')} onClick={() => handleDeleteClick(row)} />);
                }
                return actions;
            },
        },
    ], [canEdit, canDelete, isCurrentUserSuperUser]);

    if (isAuthLoading || isLoading) { return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>; }
    if (!hasViewPermission) { return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">{t('noPermission')}</Alert></Paper>; }

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, height: 'calc(100vh - 128px)', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h1">{t('title')}</Typography>
                {canCreate && (<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModalForCreate}> {t('buttons.addUser')}</Button>)}
            </Box>

            {feedback && <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>{feedback.message}</Alert>}

            <Box sx={{ height: `calc(100% - ${feedback ? '112px' : '56px'})`, width: '100%' }}>
                <DataGrid 
                    rows={users} 
                    columns={columns} 
                    getRowId={(row) => row.id} 
                    loading={isLoading} 
                    disableRowSelectionOnClick 
                    slots={{ toolbar: GridToolbar }} 
                    // --- Header Styling (Bold & Uppercase) ---
                    sx={{
                        '& .MuiDataGrid-columnHeaderTitle': {
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                        },
                    }}
                />
            </Box>

            {isModalOpen && (
                <UserFormModal
                    open={isModalOpen}
                    onCloseAction={handleModalClose}
                    onSaveAction={handleSave}
                    user={editingUser}
                    isSaving={isSaving || isFetchingUser}
                    apiError={modalError}
                    currentUser={currentUser}
                />
            )}

            {deleteTarget && (
                <ConfirmationDialog
                    open={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                    title={t('confirmDelete.title')}
                    message={t('confirmDelete.message', { username: deleteTarget.username })}
                    isConfirming={isSaving}
                    confirmButtonText={t('common:buttons.confirm')}
                    cancelButtonText={t('common:buttons.cancel')}
                />
            )}
        </Paper>
    );
}