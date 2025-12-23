// src/app/[lng]/(main)/vehicles/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    AlertColor,
    Tooltip,
    Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { GridToolbar } from '@mui/x-data-grid';

import {
    fetchAllVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle
} from '../../../../services/vehicleService';
import { IVehicle, ICreateVehicleDto, IUpdateVehicleDto, IVehicleBackendResponse } from '../../../../types';
import VehicleFormModal from '../../../../components/vehicles/VehicleFormModal';
import ConfirmationDialog from '../../../../components/common/ConfirmationDialog';
import { useAuth } from '../../../../contexts/AuthContext';

import { useTranslation } from '@/i18n/useTranslation';

interface IVehicleGridRow extends IVehicle {
    id: string; 
}

export default function VehiclesPage() {
    const { user } = useAuth();
    const { t } = useTranslation(['vehicles', 'common']);

    const [vehicles, setVehicles] = useState<IVehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<IVehicle | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IVehicle | null>(null);

    const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);

    const canView = useMemo(() => user?.permissions?.includes('vehicles_view'), [user]);
    const canCreate = useMemo(() => user?.permissions?.includes('vehicles_create'), [user]);
    const canEdit = useMemo(() => user?.permissions?.includes('vehicles_edit'), [user]);
    const canDelete = useMemo(() => user?.permissions?.includes('vehicles_delete'), [user]);

    const loadVehicles = useCallback(async () => {
        if (!canView) {
            setFeedback({ type: 'error', message: t('noPermission') });
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const rawData: IVehicleBackendResponse[] = await fetchAllVehicles();
            const transformedVehicles: IVehicle[] = rawData.map((backendVehicle: IVehicleBackendResponse) => ({
                vehicleNo: String(backendVehicle.kalustoNro),
                registrationNo: backendVehicle.rekNro,
                previousInspectionDate: backendVehicle.edKatsastus,
                nextInspectionDate: backendVehicle.katsastusAik,
                isActive: backendVehicle.aktiivinen,
            }));
            setVehicles(transformedVehicles);
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || t('feedback.loadFailed') });
        } finally {
            setIsLoading(false);
        }
    }, [canView]);

    useEffect(() => {
        if (user) {
            loadVehicles();
        }
    }, [user, loadVehicles]);

    const rowsForGrid: IVehicleGridRow[] = useMemo(() => {
        return vehicles.map((vehicle: IVehicle) => {
            return {
                ...vehicle,
                id: vehicle.vehicleNo, 
            };
        });
    }, [vehicles]);

    const handleOpenModalForCreate = () => {
        setEditingVehicle(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (row: IVehicleGridRow) => {
        setEditingVehicle(row);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (row: IVehicleGridRow) => {
        setDeleteTarget(row);
    };

    const handleSave = async (data: ICreateVehicleDto | IUpdateVehicleDto, vehicleNo?: string) => {
        setIsSaving(true);
        setFeedback(null);
        try {
            if (vehicleNo) {
                await updateVehicle(vehicleNo, data as IUpdateVehicleDto);
                setFeedback({ type: 'success', message: t('feedback.updateSuccess') });
            } else {
                await createVehicle(data as ICreateVehicleDto);
                setFeedback({ type: 'success', message: t('feedback.createSuccess') });
            }
            setIsModalOpen(false);
            await loadVehicles();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || t('feedback.saveFailed') });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsSaving(true);
        setFeedback(null);
        try {
            await deleteVehicle(deleteTarget.vehicleNo);
            setFeedback({ type: 'success', message: `Vehicle "${deleteTarget.registrationNo}" deleted successfully.` });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || t('feedback.saveFailed') });
        } finally {
            setIsSaving(false);
            setDeleteTarget(null);
            await loadVehicles();
        }
    };

    const columns: GridColDef<IVehicleGridRow>[] = useMemo(() => {
        const baseColumns: GridColDef<IVehicleGridRow>[] = [
            // FIX: Removed 'vehicleNo' column to hide it
            // { field: 'vehicleNo', headerName: t('columns.vehicleNo'), width: 120 },
            
            // FIX: Used fixed width instead of flex
            { field: 'registrationNo', headerName: t('columns.registrationNo'), width: 250 },
            {
                field: 'nextInspectionDate',
                headerName: t('columns.nextInspectionDate'),
                width: 180, // Fixed width
                type: 'date',
                valueGetter: (value) => value ? new Date(value) : null,
            },
            {
                field: 'isActive',
                headerName: t('columns.status'),
                width: 120, // Fixed width
                renderCell: (params) => (
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
                width: 100,
                getActions: ({ row }) => {
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
    }, [canEdit, canDelete, handleOpenModalForEdit, handleDeleteClick]);

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
                {canCreate && (<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModalForCreate}>{t('buttons.addVehicle')}</Button>)}
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
                    // FIX: Added sx for Header Styling
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
                <VehicleFormModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    initialData={editingVehicle}
                    isSaving={isSaving}
                />
            )}

            {deleteTarget && (
                <ConfirmationDialog
                    open={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                    title={t('confirmDelete.title')}
                    message={t('confirmDelete.message', { registrationNo: deleteTarget.registrationNo })}
                    isConfirming={isSaving}
                />
            )}
        </Paper>
    );
}