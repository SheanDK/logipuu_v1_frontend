'use client'; 

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper, Chip, AlertColor, Tooltip
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowParams, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { useAuth } from '../../../contexts/AuthContext';
import { IDriver, IDriverGridRow, ICreateDriverDto, IUpdateDriverDto, IBackendDriver } from '../../../types'; 
import { fetchAllDrivers, createDriver, updateDriver, deleteDriver } from '../../../services/driverService';
import DriverFormModal from '../../../components/drivers/DriverFormModal';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

export default function DriversPage() {
    const { user } = useAuth();
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

    const loadDrivers = useCallback(async () => {
        if (!canView) {
            setFeedback({ type: 'error', message: "You do not have permission to view drivers." });
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const rawData: IBackendDriver[] = await fetchAllDrivers(); 
            
            const transformedDrivers: IDriver[] = rawData.map((backendDriver: IBackendDriver) => ({
                driverId: backendDriver.kuljId,
                name: backendDriver.nimi,
                phoneNo: backendDriver.puhelinNro,
                email: backendDriver.email,
                hasAlerts: backendDriver.halytys,
            }));
            
            setDrivers(transformedDrivers);

        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || "Failed to load drivers." });
        } finally {
            setIsLoading(false);
        }
    }, [canView]);

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

    const handleOpenModalForEdit = (row: IDriverGridRow) => {
        setEditingDriver(row); 
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (row: IDriverGridRow) => {
        setDeleteTarget(row);
    };

    const handleSave = async (data: ICreateDriverDto | IUpdateDriverDto, driverId?: number) => {
        setIsSaving(true);
        setModalError(null); 
        try {
            if (driverId) {
                await updateDriver(driverId, data as IUpdateDriverDto);
                setFeedback({ type: 'success', message: 'Driver updated successfully.' });
            } else {
                await createDriver(data as ICreateDriverDto);
                setFeedback({ type: 'success', message: 'Driver created successfully.' });
            }
            setIsModalOpen(false);
            await loadDrivers();
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Failed to save driver.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsSaving(true);
        setFeedback(null);
        try {
            await deleteDriver(deleteTarget.driverId);
            setFeedback({ type: 'success', message: `Driver "${deleteTarget.name}" deleted successfully.` });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete driver.' });
        } finally {
            setIsSaving(false);
            setDeleteTarget(null);
            await loadDrivers();
        }
    };

    const columns: GridColDef<IDriverGridRow>[] = useMemo(() => {
        const baseColumns: GridColDef<IDriverGridRow>[] = [
            { field: 'driverId', headerName: 'ID', width: 90 },
            { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
            { field: 'phoneNo', headerName: 'Phone', width: 150 },
            { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
            {
                field: 'hasAlerts',
                headerName: 'Status', // Changed header to 'Status' for generic meaning
                width: 120,
                renderCell: (params) => (
                    <Chip 
                        icon={params.value ? <CheckCircleIcon /> : <CancelIcon />} 
                        // --- KEY CORRECTION: Change label text here ---
                        label={params.value ? 'Active' : 'Inactive'} 
                        // --- END CORRECTION ---
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
                headerName: 'Actions',
                width: 100,
                getActions: ({ row }) => {
                    const actions = [];
                    if (canEdit) {
                        actions.push(<GridActionsCellItem key={`edit-${row.id}`} icon={<Tooltip title="Edit"><EditIcon /></Tooltip>} label="Edit" onClick={() => handleOpenModalForEdit(row)} />);
                    }
                    if (canDelete) {
                        actions.push(<GridActionsCellItem key={`delete-${row.id}`} icon={<Tooltip title="Delete"><DeleteIcon color="error" /></Tooltip>} label="Delete" onClick={() => handleDeleteClick(row)} />);
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
        return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">You do not have permission to view drivers.</Alert></Paper>;
    }

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, height: 'calc(100vh - 128px)', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h1">Driver Management</Typography>
                {canCreate && (<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModalForCreate}>Add New Driver</Button>)}
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
                    title="Delete Driver"
                    message={`Are you sure you want to delete driver "${deleteTarget.name}"? This action cannot be undone.`}
                    isConfirming={isSaving}
                />
            )}
        </Paper>
    );
}