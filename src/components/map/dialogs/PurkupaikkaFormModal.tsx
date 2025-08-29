// frontend/src/components/map/dialogs/PurkupaikkaFormModal.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Button, Box, TextField,
    FormControl, InputLabel, Select, MenuItem, Grid, CircularProgress, Alert,
    Stack, Typography, IconButton, Paper, Divider, List, ListItem, ListItemText, ListItemSecondaryAction, Tooltip, Switch, DialogActions
} from '@mui/material';
import { useForm, Controller, SubmitHandler, FieldValues } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

import ConfirmationDialog from '@/components/common/ConfirmationDialog'; 
import { IClientBasicInfo, ICreatePurkupaikkaDto, IBackendPurkupaikkaResponse, IMapDropoffLocation } from '@/types';
import { fetchUnloadingSitesByClientId, createDropoffLocation, deleteDropoffLocation, updateUnloadingSiteVisibility, updateDropoffLocation } from '@/services/unloadingSiteService'; 
import { useMessage } from '@/utils/useMessage';

interface PurkupaikkaFormModalProps {
    open: boolean;
    // --- FIX: Correctly type the function to accept the boolean ---
    onCloseAction: (didChange: boolean) => void; 
    clientList: IClientBasicInfo[];
    onDataChangeAction: () => void;
    initialCoords: { lat: number, lng: number } | null;
    siteToEdit: IMapDropoffLocation | null;
}

const addSchema = yup.object({
    name: yup.string().required('Name is required').min(3),
    latitude: yup.number().transform(value => (isNaN(value) ? undefined : value)).required('Latitude is required'),
    longitude: yup.number().transform(value => (isNaN(value) ? undefined : value)).required('Longitude is required'),
});

type AddSiteFormData = yup.InferType<typeof addSchema>;

export default function PurkupaikkaFormModal({ 
    open, onCloseAction, clientList, onDataChangeAction, initialCoords, siteToEdit 
}: PurkupaikkaFormModalProps) {
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [sitesForClient, setSitesForClient] = useState<IBackendPurkupaikkaResponse[]>([]);
    const [isListLoading, setIsListLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<IBackendPurkupaikkaResponse | null>(null);
    const [editingSiteId, setEditingSiteId] = useState<number | null>(null);
    const [editingSiteName, setEditingSiteName] = useState<string>('');
    
    // --- FIX: Declare 'hasChanges' state only ONCE ---
    const [hasChanges, setHasChanges] = useState(false);

    const { successMessage, errorMessage, setSuccessMessage, setErrorMessage } = useMessage();
    const isEditMode = useMemo(() => !!siteToEdit, [siteToEdit]);
    
    const { control, handleSubmit, reset, formState: { errors } } = useForm<AddSiteFormData>({
        resolver: yupResolver(addSchema),
        defaultValues: { name: '', latitude: undefined, longitude: undefined },
    });
    
    useEffect(() => {
        if (open) {
            setHasChanges(false);
            if (isEditMode && siteToEdit) {
                setSelectedClientId(String(siteToEdit.clientId));
            } else {
                setSelectedClientId(null);
                reset({
                    name: '',
                    latitude: initialCoords?.lat,
                    longitude: initialCoords?.lng,
                });
            }
        }
    }, [open, isEditMode, siteToEdit, initialCoords, reset]);

    const loadSitesForClient = useCallback(async (clientId: string) => {
        if (!clientId) return;
        setIsListLoading(true);
        setErrorMessage('');
        try {
            const sites = await fetchUnloadingSitesByClientId(Number(clientId));
            setSitesForClient(sites);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to load unloading sites.');
            setSitesForClient([]);
        } finally {
            setIsListLoading(false);
        }
    }, [setErrorMessage]);

    useEffect(() => {
        if (selectedClientId) {
            loadSitesForClient(selectedClientId);
        } else {
            setSitesForClient([]);
        }
    }, [selectedClientId, loadSitesForClient]);

    const handleAddSite: SubmitHandler<AddSiteFormData> = async (data) => {
        if (!selectedClientId) return;
        setErrorMessage(''); setSuccessMessage('');
        setIsSaving(true);
        const payload: ICreatePurkupaikkaDto = { name: data.name, clientId: Number(selectedClientId), latitude: Number(data.latitude), longitude: Number(data.longitude) };
        try {
            await createDropoffLocation(payload);
            setSuccessMessage(`Site "${data.name}" added successfully.`);
            reset({ name: '', latitude: data.latitude, longitude: data.longitude });
            await loadSitesForClient(selectedClientId);
            setHasChanges(true);
            //onDataChangeAction();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to add site.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const initiateDelete = (site: IBackendPurkupaikkaResponse) => {
        setDeleteTarget(site);
    };
    
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setErrorMessage(''); setSuccessMessage('');
        setIsSaving(true);
        try {
            await deleteDropoffLocation(deleteTarget.purkupaikkaId);
            setSuccessMessage(`Site "${deleteTarget.purkupaikka}" deleted successfully.`);
            await loadSitesForClient(selectedClientId!);
            setHasChanges(true);
        } catch (err: any) {
            const detailedError = err.response?.data?.message || err.message || 'Failed to delete site.';
            if (detailedError.includes("is still referenced")) {
                setErrorMessage("This site cannot be deleted because it is in use.");
            } else { setErrorMessage(detailedError); }
        } finally {
            setIsSaving(false);
            setDeleteTarget(null);
        }
    };

    const handleVisibilityToggle = async (site: IBackendPurkupaikkaResponse) => {
        const newVisibility = !site.isVisibleOnMap;
        try {
            await updateUnloadingSiteVisibility(site.purkupaikkaId, newVisibility);
            await loadSitesForClient(selectedClientId!);
            setHasChanges(true);
        } catch (err) {
            setErrorMessage("Failed to update visibility.");
        }
    };

    const handleStartEdit = (site: IBackendPurkupaikkaResponse) => {
        setEditingSiteId(site.purkupaikkaId);
        setEditingSiteName(site.purkupaikka);
    };

    const handleCancelEdit = () => {
        setEditingSiteId(null);
        setEditingSiteName('');
    };

    const handleSaveEdit = async () => {
        if (!editingSiteId || !editingSiteName.trim()) return;
        setIsSaving(true);
        setErrorMessage(''); setSuccessMessage('');
        try {
            await updateDropoffLocation(editingSiteId, { name: editingSiteName.trim() });
            setSuccessMessage(`Site name updated successfully.`);
            await loadSitesForClient(selectedClientId!);
            setHasChanges(true);
            handleCancelEdit();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || "Failed to update site name.");
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <>
            <Dialog open={open} onClose={() => onCloseAction(hasChanges)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">
                        {isEditMode ? 'Edit Customer Sites' : 'Create New Unloading Site'}
                    </Typography>
                    <IconButton aria-label="close" onClick={() => onCloseAction(hasChanges)} sx={{ color: (theme) => theme.palette.grey[500] }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent dividers sx={{ p: 3, backgroundColor: '#f7f7f7' }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="overline" color="text.secondary">Step 1: Select a Customer</Typography>
                            <FormControl fullWidth>
                                <InputLabel>Customer</InputLabel>
                                <Select value={selectedClientId || ''} label="Customer" onChange={(e) => setSelectedClientId(e.target.value as string)} disabled={isEditMode} sx={{ backgroundColor: 'background.paper' }}>
                                    {(clientList || []).map(c => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Box>

                        {selectedClientId && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="overline" color="text.secondary">Step 2: Manage Sites</Typography>
                                    <Paper variant="outlined" sx={{ mt: 1, maxHeight: 200, overflowY: 'auto' }}>
                                        {isListLoading ? ( <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
                                        ) : sitesForClient.length > 0 ? (
                                            <List dense>
                                                {sitesForClient.map(site => {
                                                    const isCurrentlyEditing = editingSiteId === site.purkupaikkaId;
                                                    return (
                                                        <ListItem key={site.purkupaikkaId} divider>
                                                            <Tooltip title={site.isVisibleOnMap ? "Visible on map" : "Hidden from map"}>
                                                                <Box component="span" sx={{ display: 'inline-block' }}><Switch edge="start" checked={!!site.isVisibleOnMap} onChange={() => handleVisibilityToggle(site)} size="small" disabled={isCurrentlyEditing} /></Box>
                                                            </Tooltip>
                                                            
                                                            {isCurrentlyEditing ? (
                                                                <TextField value={editingSiteName} onChange={(e) => setEditingSiteName(e.target.value)} variant="standard" size="small" autoFocus fullWidth sx={{ ml: 1 }}/>
                                                            ) : (
                                                                <ListItemText primary={site.purkupaikka} sx={{ ml: 1 }}/>
                                                            )}
                                                            
                                                            <ListItemSecondaryAction>
                                                                {isCurrentlyEditing ? (
                                                                    <><Tooltip title="Save"><IconButton edge="end" onClick={handleSaveEdit} disabled={isSaving}><SaveIcon color="primary" /></IconButton></Tooltip><Tooltip title="Cancel"><IconButton edge="end" onClick={handleCancelEdit}><CancelIcon /></IconButton></Tooltip></>
                                                                ) : (
                                                                    <><Tooltip title="Edit Name"><IconButton edge="end" onClick={() => handleStartEdit(site)}><EditIcon fontSize="small"/></IconButton></Tooltip><Tooltip title="Delete Site"><IconButton edge="end" onClick={() => initiateDelete(site)}><DeleteIcon color="error" /></IconButton></Tooltip></>
                                                                )}
                                                            </ListItemSecondaryAction>
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                        ) : ( <Typography sx={{ p: 3, textAlign: 'center' }} color="text.secondary">No sites found. Add one below.</Typography> )}
                                    </Paper>
                                </Box>
                                
                                {!isEditMode && (
                                    <>
                                        <Divider />
                                        <Box component="form" onSubmit={handleSubmit(handleAddSite as SubmitHandler<FieldValues>)}>
                                            <Typography variant="overline" color="text.secondary" gutterBottom>Add a New Site to the List</Typography>
                                            {errorMessage && <Alert severity="error" sx={{mb: 2}}>{errorMessage}</Alert>}
                                            {successMessage && <Alert severity="success" sx={{mb: 2}}>{successMessage}</Alert>}
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={12} sm={5}><Controller name="name" control={control} render={({ field }) => ( <TextField {...field} label="New Site Name" fullWidth required error={!!errors.name} helperText={errors.name?.message} /> )}/></Grid>
                                                <Grid item xs={6} sm={3.5}><Controller name="latitude" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Latitude" type="number" fullWidth required error={!!errors.latitude} helperText={errors.latitude?.message} /> )}/></Grid>
                                                <Grid item xs={6} sm={3.5}><Controller name="longitude" control={control} render={({ field }) => ( <TextField {...field} value={field.value ?? ''} label="Longitude" type="number" fullWidth required error={!!errors.longitude} helperText={errors.longitude?.message} /> )}/></Grid>
                                            </Grid>
                                            <Button type="submit" variant="contained" fullWidth disabled={isSaving} sx={{ mt: 2, backgroundColor: '#A98E71', '&:hover': { backgroundColor: '#8E735B' } }}>
                                                {isSaving ? <CircularProgress size={24} color="inherit"/> : 'Add Site to List'}
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </>
                        )}
                    </Stack>
                </DialogContent>
                
                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button variant="contained" onClick={() => onCloseAction(hasChanges)} color="primary">Done</Button>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Confirm Site Deletion" message={`Are you sure you want to delete the site "${deleteTarget?.purkupaikka}"? This action cannot be undone.`} isConfirming={isSaving}/>
        </>
    );
}