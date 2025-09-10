// src/app/(main)/clients/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Button, CircularProgress, Alert, AlertColor, Paper, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DataGrid, GridColDef, GridRenderCellParams, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { useAuth } from '../../../contexts/AuthContext';
import { IClient, IBackendClient, ICreateClientDto, IUpdateClientDto, ClientTypeEnum } from '../../../types';
import { fetchAllClients, createClient, updateClient, deleteClient } from '../../../services/clientService';
import ClientFormModal from '../../../components/clients/ClientFormModal';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import { getClientTypeString } from '../../../utils/displayHelpers';
import { GridToolbar } from '@mui/x-data-grid';

export default function ClientsPage() {
    const { user, isLoading: authLoadingState } = useAuth();
    const [clients, setClients] = useState<IClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<IClient | null>(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<IClient | null>(null);

    // This state is not needed here anymore as it's passed from the page to the modal
    // const [usedColors, setUsedColors] = useState<string[]>([]);
    // const [currentClientColor, setCurrentClientColor] = useState<string | null>(null);

    const canView = useMemo(() => user?.permissions?.includes('clients_view'), [user]);
    const canCreate = useMemo(() => user?.permissions?.includes('clients_create'), [user]);
    const canEdit = useMemo(() => user?.permissions?.includes('clients_edit'), [user]);
    const canDelete = useMemo(() => user?.permissions?.includes('clients_delete'), [user]);

    const loadClients = useCallback(async () => {
        if (!canView) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const rawData: IBackendClient[] = await fetchAllClients();

            // --- KEY CORRECTION 1: Ensure transformation is robust ---
            const transformedClients: IClient[] = rawData.map(c => ({
                id: String(c.asiakkaanId),
                clientId: String(c.asiakkaanId),
                clientName: c.asiakkaanNimi,
                address: c.osoite,
                postalCode: c.postiNro,
                city: c.paikkakunta,
                phoneNo: c.puhelinNro,
                vatId: c.ytunnus,
                // Trim whitespace from color value, which can cause issues
                targetColor: c.kohteenVari ? c.kohteenVari.trim() : null,
                type: c.tyyppi,
                isActive: c.aktiivinen,
                contactPerson: c.yhteyshenkilo,
                email: c.sahkoposti,
                additionalInfo: c.lisatietoja,
            }));
            setClients(transformedClients);

        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || "Failed to load clients." });
        } finally {
            setIsLoading(false);
        }
    }, [canView]);

    useEffect(() => {
        if (!authLoadingState && user) { loadClients(); }
    }, [authLoadingState, user, loadClients]);

    const handleOpenCreateModal = () => {
        setEditingClient(null);
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (client: IClient) => {
        setEditingClient(client);
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
    };

    const handleSaveClient = async (data: ICreateClientDto | IUpdateClientDto, clientId?: string) => {
        setIsSaving(true);
        setModalError(null);
        try {
            if (clientId) {
                await updateClient(clientId, data as IUpdateClientDto);
                setFeedback({ type: 'success', message: 'Client updated successfully.' });
            } else {
                await createClient(data as ICreateClientDto);
                setFeedback({ type: 'success', message: `Client created successfully.` });
            }
            handleCloseModal();
            await loadClients();
        } catch (err: any) {
            setModalError(err.response?.data?.message || "An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (client: IClient) => {
        setClientToDelete(client);
        setDeleteConfirmOpen(true);
    };

    const confirmDeleteHandler = async () => {
        if (!clientToDelete?.clientId) return;
        setIsSaving(true);
        try {
            await deleteClient(clientToDelete.clientId);
            setFeedback({ type: 'success', message: `Client "${clientToDelete.clientName}" deleted successfully.` });
            setDeleteConfirmOpen(false);
            setClientToDelete(null);
            await loadClients();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || "Failed to delete client." });
            setDeleteConfirmOpen(false);
            setClientToDelete(null);
        } finally {
            setIsSaving(false);
        }
    };

    const columns: GridColDef<IClient>[] = useMemo(() => [
        { field: 'clientName', headerName: 'Client Name', flex: 1, minWidth: 200 },
        { field: 'city', headerName: 'City', width: 150, valueGetter: (value) => value || '–' },
        { field: 'phoneNo', headerName: 'Phone', width: 150, valueGetter: (value) => value || '–' },
        {
            field: 'type',
            headerName: 'Type',
            width: 130,
            renderCell: (params) => getClientTypeString(params.value as ClientTypeEnum),
        },
        {
            field: 'targetColor',
            headerName: 'Target Color',
            width: 150,
            sortable: false, // Colors are not easily sortable
            renderCell: (params: GridRenderCellParams<IClient, string | null>) => {
                const colorValue = params.value;
                if (!colorValue ) return '–';
                
                // Return only a colored box, making it wider for better visibility
                return (
                    <Box sx={{
                        width: '80%', // Make the box wider, e.g., 80% of the cell width
                        height: 22,
                        backgroundColor: colorValue,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '4px',
                    }} />
                );
            },
        },
        { field: 'isActive', headerName: 'Active', width: 120, type: 'boolean' },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            getActions: ({ row }) => {
                const actions = [];
                if (canEdit) {
                    actions.push(<GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => handleOpenEditModal(row)} />);
                }
                if (canDelete) {
                    actions.push(<GridActionsCellItem icon={<DeleteIcon color="error" />} label="Delete" onClick={() => handleDeleteClick(row)} />);
                }
                return actions;
            },
        },
    ], [canEdit, canDelete]);

    if (isLoading || authLoadingState) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    if (!canView) {
        return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">You do not have permission to view clients.</Alert></Paper>;
    }

    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, height: 'calc(100vh - 128px)', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h1">Client Management</Typography>
                {canCreate && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateModal}>
                        Add New Client
                    </Button>
                )}
            </Box>

            {feedback && <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>{feedback.message}</Alert>}

            <Box sx={{ height: `calc(100% - ${feedback ? '112px' : '56px'})`, width: '100%' }}>
                <DataGrid
                    rows={clients}
                    columns={columns}
                    getRowId={(row) => row.id}
                    density="compact"
                    loading={isLoading}
                    disableRowSelectionOnClick
                    slots={{ toolbar: GridToolbar }}
                />
            </Box>

            {isModalOpen && (
                <ClientFormModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveClient}
                    initialData={editingClient}
                    isSaving={isSaving}
                    apiError={modalError}
                    // Pass the necessary props that were missing before
                    usedColors={clients.map(c => c.targetColor).filter(Boolean) as string[]}
                    currentClientColor={editingClient?.targetColor || null}
                />
            )}

            {deleteConfirmOpen && (
                <ConfirmationDialog
                    open={deleteConfirmOpen}
                    onClose={() => setDeleteConfirmOpen(false)}
                    onConfirm={confirmDeleteHandler}
                    title="Delete Client"
                    message={`Are you sure you want to delete client "${clientToDelete?.clientName}"?`}
                    isConfirming={isSaving}
                />
            )}
        </Paper>
    );
}