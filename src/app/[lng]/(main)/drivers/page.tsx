// frontend/src/app/[lng]/(main)/drivers/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Button, Paper, Tooltip, Chip, Alert, CircularProgress, AlertColor } from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';

import { useAuth } from '../../../../contexts/AuthContext';
import { IDriver, IDriverGridRow, ICreateDriverDto, IUpdateDriverDto, IBackendDriver } from '../../../../types';
import { fetchAllDrivers, createDriver, updateDriver, deleteDriver } from '../../../../services/driverService';
import DriverFormModal from '../../../../components/drivers/DriverFormModal';
import ConfirmationDialog from '../../../../components/common/ConfirmationDialog';
import { useTranslation } from '@/i18n/useTranslation';

export default function DriversPage() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const [drivers, setDrivers] = useState<IDriver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<IDriver | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IDriver | null>(null);

    const canView = useMemo(() => user?.permissions?.includes('drivers_view'), [user]);
    const canCreate = useMemo(() => user?.permissions?.includes('drivers_create'), [user]);
    const canEdit = useMemo(() => user?.permissions?.includes('drivers_edit'), [user]);
    const canDelete = useMemo(() => user?.permissions?.includes('drivers_delete'), [user]);

    const { t } = useTranslation(['drivers', 'common']);

    const loadDrivers = useCallback(async () => {
        if (!canView) {
            setFeedback({ type: 'error', message: t('noPermission') });
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const rawData: IBackendDriver[] = await fetchAllDrivers();
            const transformedDrivers: IDriver[] = rawData.map((backendDriver) => ({
                driverId: backendDriver.kuljId,
                name: backendDriver.nimi,
                phoneNo: backendDriver.puhelinNro,
                email: backendDriver.email,
                hasAlerts: backendDriver.halytys,
            }));
            setDrivers(transformedDrivers);
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : t('feedback.loadFailed');
            setFeedback({ type: 'error', message: message || t('feedback.loadFailed') });
        } finally {
            setIsLoading(false);
        }
    }, [canView, t]);

    useEffect(() => {
        if (user) {
            loadDrivers();
        }
    }, [user, loadDrivers]);

    const rowsForGrid: IDriverGridRow[] = useMemo(() => {
        return drivers.map((driver: IDriver) => ({
            ...driver,
            id: driver.driverId,
        }));
    }, [drivers]);

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const handleOpenModalForCreate = () => {
        setEditingDriver(null);
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = useCallback((row: IDriverGridRow) => {
        setEditingDriver(row);
        setModalError(null);
        setIsModalOpen(true);
    }, []);

    const handleDeleteClick = useCallback((row: IDriverGridRow) => {
        setDeleteTarget(row);
    }, []);

    const handleSave = async (data: ICreateDriverDto | IUpdateDriverDto, driverId?: number) => {
        setIsSaving(true);
        setModalError(null);
        try {
            if (driverId) {
                await updateDriver(driverId, data as IUpdateDriverDto);
                enqueueSnackbar(t('feedback.updateSuccess'), { variant: 'success' });
            } else {
                await createDriver(data as ICreateDriverDto);
                enqueueSnackbar(t('feedback.createSuccess'), { variant: 'success' });
            }
            setIsModalOpen(false);
            await loadDrivers();
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : t('feedback.saveFailed');
            setModalError(message || t('feedback.saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsSaving(true);
        try {
            await deleteDriver(deleteTarget.driverId);
            enqueueSnackbar(t('feedback.deleteSuccess', { name: deleteTarget.name }), { variant: 'success' });
        } catch (error: unknown) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : t('feedback.deleteFailed');
            enqueueSnackbar(message || t('feedback.deleteFailed'), { variant: 'error' });
        } finally {
            setIsSaving(false);
            setDeleteTarget(null);
            await loadDrivers();
        }
    };

    const columns: GridColDef<IDriverGridRow>[] = useMemo(() => {
        const baseColumns: GridColDef<IDriverGridRow>[] = [
            { field: 'name', headerName: t('columns.name'), width: 250 },
            { field: 'phoneNo', headerName: t('columns.phoneNo'), width: 180 },
            { field: 'email', headerName: t('columns.email'), width: 250 },
            {
                field: 'hasAlerts',
                headerName: t('columns.status'),
                width: 150,
                renderCell: (params: GridRenderCellParams<IDriverGridRow, boolean>) => (
                    <Chip
                        icon={params.value ? <CheckCircleIcon /> : <CancelIcon />}
                        label={params.value ? t('status.active') : t('status.inactive')}
                        color={params.value ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                    />
                ),
            },
        ];
        if (canEdit || canDelete) {
            baseColumns.push({
                field: 'actions',
                type: 'actions',
                headerName: t('columns.actions'),
                width: 120,
                getActions: ({ row }: { row: IDriverGridRow }) => {
                    const actions = [];
                    if (canEdit) {
                        actions.push(<GridActionsCellItem key={`edit-${row.id}`} icon={<Tooltip title={t('actions.edit')}><EditIcon /></Tooltip>} label={t('actions.edit')} onClick={() => handleOpenModalForEdit(row)} />);
                    }
                    if (canDelete) {
                        actions.push(<GridActionsCellItem key={`delete-${row.id}`} icon={<Tooltip title={t('actions.delete')}><DeleteIcon color="error" /></Tooltip>} label={t('actions.delete')} onClick={() => handleDeleteClick(row)} />);
                    }
                    return actions;
                },
            });
        }
        return baseColumns;
    }, [canEdit, canDelete, handleOpenModalForEdit, handleDeleteClick, t]);

    if (isLoading || !user) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    if (!canView) {
        return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">{t('noPermission')}</Alert></Paper>;
    }

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, height: 'calc(100vh - 128px)', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h1">{t('title')}</Typography>
                {canCreate && (<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModalForCreate}>{t('buttons.addDriver')}</Button>)}
            </Box>

            {feedback && <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>{feedback.message}</Alert>}

            <Box sx={{ height: `calc(100% - ${feedback ? '112px' : '56px'})`, width: '100%' }}>
                <DataGrid
                    rows={rowsForGrid}
                    columns={columns}
                    density="compact"
                    loading={isLoading}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.id}
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
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
                <DriverFormModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    initialData={editingDriver}
                    isSaving={isSaving}
                    apiError={modalError}
                />
            )}

            {deleteTarget && (
                <ConfirmationDialog
                    open={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                    title={t('confirmDelete.title')}
                    message={t('confirmDelete.message', { name: deleteTarget.name })}
                    isConfirming={isSaving}
                    confirmButtonText={t('common:buttons.confirm')}
                    cancelButtonText={t('common:buttons.cancel')}
                />
            )}
        </Paper>
    );
}