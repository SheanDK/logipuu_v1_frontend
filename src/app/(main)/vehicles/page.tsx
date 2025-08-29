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
// Import GridToolbar
import { GridToolbar } from '@mui/x-data-grid';


import {
    fetchAllVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle
} from '../../../services/vehicleService';
import { IVehicle, ICreateVehicleDto, IUpdateVehicleDto, IVehicleBackendResponse } from '../../../types';
import VehicleFormModal from '../../../components/vehicles/VehicleFormModal';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import { useAuth } from '../../../contexts/AuthContext';

// This interface is for the data structure used within the DataGrid.
interface IVehicleGridRow extends IVehicle {
    id: string; // ID is now a string
}

export default function VehiclesPage() {
    const { user } = useAuth();

    const [vehicles, setVehicles] = useState<IVehicle[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<IVehicle | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IVehicle | null>(null);
    
    const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);

    const canView = useMemo(() => user?.permissions?.includes('vehicle_view'), [user]);
    const canCreate = useMemo(() => user?.permissions?.includes('vehicle_create'), [user]);
    const canEdit = useMemo(() => user?.permissions?.includes('vehicle_edit'), [user]);
    const canDelete = useMemo(() => user?.permissions?.includes('vehicle_delete'), [user]);

    const loadVehicles = useCallback(async () => {
        if (!canView) {
            setFeedback({ type: 'error', message: "You do not have permission to view vehicles." });
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            // Fetch raw backend data.
            const rawData: IVehicleBackendResponse[] = await fetchAllVehicles();
            
            // --- KEY CORRECTION: Transform IVehicleBackendResponse to IVehicle ---
            const transformedVehicles: IVehicle[] = rawData.map((backendVehicle: IVehicleBackendResponse) => ({
                vehicleNo: String(backendVehicle.kalustoNro), // Ensure it's a string
                registrationNo: backendVehicle.rekNro,
                previousInspectionDate: backendVehicle.edKatsastus,
                nextInspectionDate: backendVehicle.katsastusAik,
                isActive: backendVehicle.aktiivinen,
            }));
            setVehicles(transformedVehicles);
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || "Failed to load vehicles." });
        } finally {
            setIsLoading(false);
        }
    }, [canView]);

    useEffect(() => {
        if(user) {
            loadVehicles();
        }
    }, [user, loadVehicles]);

    // This hook transforms the standardized IVehicle data into IVehicleGridRow, adding the 'id' property.
    const rowsForGrid: IVehicleGridRow[] = useMemo(() => {
        return vehicles.map((vehicle: IVehicle) => { 
            return {
                ...vehicle, // Copy all properties from IVehicle
                id: vehicle.vehicleNo, // Assign vehicleNo (string) as ID
            };
        });
    }, [vehicles]);


    // --- ACTION HANDLERS ---
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
                setFeedback({ type: 'success', message: 'Vehicle updated successfully.' });
            } else {
                await createVehicle(data as ICreateVehicleDto);
                setFeedback({ type: 'success', message: 'Vehicle created successfully.' });
            }
            setIsModalOpen(false);
            await loadVehicles();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to save vehicle.' });
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
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete vehicle.' });
        } finally {
            setIsSaving(false);
            setDeleteTarget(null);
            await loadVehicles();
        }
    };

    const columns: GridColDef<IVehicleGridRow>[] = useMemo(() => {
        const baseColumns: GridColDef<IVehicleGridRow>[] = [
            { field: 'vehicleNo', headerName: 'Vehicle No', width: 120 },
            { field: 'registrationNo', headerName: 'Registration No.', flex: 1, minWidth: 150 },
            { 
                field: 'nextInspectionDate', 
                headerName: 'Next Inspection', 
                width: 180, 
                type: 'date',
                // valueGetter will ensure the date string is converted to a Date object for display.
                valueGetter: (value) => value ? new Date(value) : null,
            },
            {
                field: 'isActive',
                headerName: 'Status',
                width: 120,
                renderCell: (params) => (
                    <Chip 
                        icon={params.value ? <CheckCircleIcon /> : <CancelIcon />} 
                        label={params.value ? 'Active' : 'Inactive'} 
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
        return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">You do not have permission to view this page.</Alert></Paper>;
    }

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, height: 'calc(100vh - 128px)', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h1">Vehicle Management</Typography>
                {canCreate && (<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModalForCreate}>Add New Vehicle</Button>)}
            </Box>

            {feedback && <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ mb: 2 } }>{feedback.message}</Alert>}

            <Box sx={{ height: `calc(100% - ${feedback ? '112px' : '56px'})`, width: '100%' }}>
                <DataGrid
                    rows={rowsForGrid}
                    columns={columns}
                    density="compact"
                    loading={isLoading}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.id}
                    slots={{ toolbar: GridToolbar }} // GridToolbar is used here
                    slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
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
                    title="Delete Vehicle"
                    message={`Are you sure you want to delete vehicle "${deleteTarget.registrationNo}"? This action cannot be undone.`}
                    isConfirming={isSaving}
                />
            )}
        </Paper>
    );
}