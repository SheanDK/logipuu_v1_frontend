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

import { useAuth } from '../../../contexts/AuthContext';
import { IUser, IBackendUser, CreateUserPayload, UpdateUserPayload } from '../../../types'; 
import { getAllUsersApi, deleteUserApi, createUserApi, updateUserApi } from '../../../services/userService';
import UserFormModal from '../../../components/users/UserFormModal';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog'; // Import ConfirmationDialog

export default function UserManagementPage() {
    const { user: currentUser, isLoading: isAuthLoading } = useAuth();
    const [users, setUsers] = useState<IUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<IUser | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IUser | null>(null); // For Confirmation Dialog

    const hasViewPermission = useMemo(() => currentUser?.permissions?.includes('users_view'), [currentUser]);
    const canCreate = useMemo(() => currentUser?.permissions?.includes('users_create'), [currentUser]);
    const canEdit = useMemo(() => currentUser?.permissions?.includes('users_edit'), [currentUser]);
    const canDelete = useMemo(() => currentUser?.permissions?.includes('users_delete'), [currentUser]);
    const isCurrentUserSuperUser = useMemo(() => currentUser?.roles.includes('Superuser'), [currentUser]);

    const loadUsers = useCallback(async () => {
        if (!hasViewPermission) { setIsLoading(false); return; }
        setIsLoading(true);
        setFeedback(null);
        try {
            const rawData: IBackendUser[] = await getAllUsersApi();
            // --- ⬇️ CORRECTION IS HERE ⬇️ ---
            const transformedUsers: IUser[] = rawData.map((backendUser) => ({
                id: backendUser.tunnus,
                username: backendUser.tunnus,
                fullName: backendUser.nimi,
                roles: backendUser.roles,
                isActive: backendUser.aktiivinen,
                roleIds: backendUser.roleIds || [],
                // Add missing properties to satisfy the IUser type
                userId: backendUser.tunnus, // Use tunnus as userId
                driverNumericId: backendUser.kuljId || null,
                driverEmail: null, // This info is not available in the admin user list, so we set it to null
                userLevel: backendUser.taso || 4, // Assuming taso is available, otherwise default
            }));
            // --- ⬆️ CORRECTION IS HERE ⬆️ ---
            setUsers(transformedUsers);
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || "Failed to fetch users." });
        } finally {
            setIsLoading(false);
        }
    }, [hasViewPermission]);

    useEffect(() => { if (feedback) { const timer = setTimeout(() => setFeedback(null), 5000); return () => clearTimeout(timer); } }, [feedback]);
    useEffect(() => { if (!isAuthLoading && hasViewPermission) { loadUsers(); } else if (!isAuthLoading && !hasViewPermission) { setIsLoading(false); } }, [isAuthLoading, hasViewPermission, loadUsers]);

    const handleOpenModalForCreate = () => { setEditingUser(null); setModalError(null); setIsModalOpen(true); };
    const handleOpenModalForEdit = (userToEdit: IUser) => { setEditingUser(userToEdit); setModalError(null); setIsModalOpen(true); };
    const handleDeleteClick = (userToDelete: IUser) => { setDeleteTarget(userToDelete); };
    const handleModalClose = () => { setIsModalOpen(false); setEditingUser(null); };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsSaving(true);
        try {
            await deleteUserApi(deleteTarget.username);
            setFeedback({ type: 'success', message: `User "${deleteTarget.username}" deleted successfully.` });
            loadUsers();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || "Failed to delete user." });
        } finally {
            setIsSaving(false);
            setDeleteTarget(null); // Close the dialog
        }
    };

    const handleSave = async (data: CreateUserPayload | UpdateUserPayload, username?: string) => {
        setIsSaving(true);
        setModalError(null);
        try {
            let successMessage = '';
            if (username) {
                await updateUserApi(username, data as UpdateUserPayload);
                successMessage = `User "${username}" updated successfully.`;
            } else {
                const createData = data as CreateUserPayload;
                await createUserApi(createData);
                successMessage = `User "${createData.username}" created successfully.`;
            }
            handleModalClose();
            setFeedback({ type: 'success', message: successMessage });
            loadUsers();
        } catch (err: any) {
            setModalError(err.response?.data?.message || "An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const columns: GridColDef<IUser>[] = useMemo(() => [
        { field: 'username', headerName: 'Username', width: 180 },
        { field: 'fullName', headerName: 'Full Name', flex: 1, minWidth: 200 },
        {
            field: 'roles', headerName: 'Role', flex: 1, minWidth: 150,
            renderCell: ({ value }) => {
                const rolesArray = Array.isArray(value) ? value : [];
                const role = rolesArray.length > 0 ? rolesArray[0] : 'N/A';
                return (<Chip label={role} size="small" color={role === 'Superuser' ? 'error' : role === 'Admin' ? 'warning' : 'primary'} icon={role === 'Superuser' ? <SupervisorAccountIcon fontSize="small"/> : role === 'Admin' ? <AdminPanelSettingsIcon fontSize="small"/> : <PersonIcon fontSize="small"/>} variant="outlined" />);
            }
        },
        { field: 'isActive', headerName: 'Status', width: 120, type: 'boolean', renderCell: (params) => (<Chip icon={params.value ? <CheckCircleIcon /> : <CancelIcon />} label={params.value ? 'Active' : 'Inactive'} color={params.value ? 'success' : 'default'} size="small" variant="outlined" />) },
        {
            field: 'actions', type: 'actions', headerName: 'Actions', width: 100,
            getActions: ({ row }) => {
                const isTargetSuperUser = row.roles.includes('Superuser');
                const canPerformAction = !isTargetSuperUser || isCurrentUserSuperUser;
                const actions = [];
                if (canEdit && canPerformAction) {
                    actions.push(<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => handleOpenModalForEdit(row)} />);
                }
                if (canDelete && canPerformAction) {
                    actions.push(<GridActionsCellItem icon={<DeleteIcon color="error" />} label="Delete" onClick={() => handleDeleteClick(row)} />);
                }
                return actions;
            },
        },
    ], [canEdit, canDelete, isCurrentUserSuperUser]);

    if (isAuthLoading || isLoading) { return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>; }
    if (!hasViewPermission) { return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">You do not have permission to view this page.</Alert></Paper>; }

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, height: 'calc(100vh - 128px)', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h1">User Management</Typography>
                {canCreate && (<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModalForCreate}>Add User</Button>)}
            </Box>

            {feedback && <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>{feedback.message}</Alert>}

            <Box sx={{ height: `calc(100% - ${feedback ? '112px' : '56px'})`, width: '100%' }}>
                <DataGrid rows={users} columns={columns} getRowId={(row) => row.id} loading={isLoading} disableRowSelectionOnClick slots={{ toolbar: GridToolbar }} />
            </Box>

            {isModalOpen && (
                <UserFormModal
                    open={isModalOpen}
                    onCloseAction={handleModalClose}
                    onSaveAction={handleSave}
                    user={editingUser}
                    isSaving={isSaving}
                    apiError={modalError}
                    currentUser={currentUser}
                />
            )}

            {deleteTarget && (
                <ConfirmationDialog
                    open={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete User"
                    message={`Are you sure you want to delete user "${deleteTarget.username}"? This action cannot be undone.`}
                    isConfirming={isSaving}
                />
            )}
        </Paper>
    );
}