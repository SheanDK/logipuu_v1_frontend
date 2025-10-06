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
import { useTranslation } from '@/i18n/useTranslation';

interface PurkupaikkaFormModalProps {
    open: boolean;
    // --- FIX: Correctly type the function to accept the boolean ---
    onCloseAction: (didChange: boolean) => void;
    clientList: IClientBasicInfo[];
    onDataChangeAction: () => void;
    initialCoords: { lat: number, lng: number } | null;
    siteToEdit: IMapDropoffLocation | null;
}

type AddSiteFormData = {
    name: string;
    latitude?: number | null;
    longitude?: number | null;
};


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

    const [hasChanges, setHasChanges] = useState(false);

    const { successMessage, errorMessage, setSuccessMessage, setErrorMessage } = useMessage();
    const isEditMode = useMemo(() => !!siteToEdit, [siteToEdit]);

    const { t } = useTranslation(['purkupaikkaFormModal', 'common'])

    // Localized schema
    const addSchema = useMemo(() => yup.object({
        name: yup.string().required(t('errors.nameRequired')).min(3, t('errors.nameMin', { count: 3 })),
        latitude: yup
            .number()
            .transform(value => (isNaN(value as any) ? undefined : (value as number)))
            .required(t('errors.latitudeRequired')),
        longitude: yup
            .number()
            .transform(value => (isNaN(value as any) ? undefined : (value as number)))
            .required(t('errors.longitudeRequired')),
    }), [t]);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<AddSiteFormData>({
        resolver: yupResolver(addSchema) as any,
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
            setErrorMessage(err.response?.data?.message || t('errors.loadSitesFailed'));
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
            setSuccessMessage(t('messages.added', { name: data.name }));
            reset({ name: '', latitude: data.latitude, longitude: data.longitude });
            await loadSitesForClient(selectedClientId);
            setHasChanges(true);
            //onDataChangeAction();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || t('errors.addFailed'));
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
            setSuccessMessage(t('messages.deleted', { name: deleteTarget.purkupaikka }));
            await loadSitesForClient(selectedClientId!);
            setHasChanges(true);
        } catch (err: any) {
            const detailedError = err.response?.data?.message || err.message;
            if (detailedError.includes(('is still referenced'))) {
                setErrorMessage(detailedError || t('errors.deleteFailed'));
            } else {
                setErrorMessage(detailedError || t('errors.deleteFailed'));

            }
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
            setErrorMessage(t('errors.updateVisibilityFailed'));
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
            setSuccessMessage(t('messages.nameUpdated'));
            await loadSitesForClient(selectedClientId!);
            setHasChanges(true);
            handleCancelEdit();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || t('errors.updateNameFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={() => onCloseAction(hasChanges)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">
                        {isEditMode ? t('title.edit') : t('title.create')}
                    </Typography>
                    <IconButton aria-label="close" onClick={() => onCloseAction(hasChanges)} sx={{ color: (theme) => theme.palette.grey[500] }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3, backgroundColor: '#f7f7f7' }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="overline" color="text.secondary">{t('sections.selectCustomer')}</Typography>
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>{t('fields.customer')}</InputLabel>
                                <Select value={selectedClientId || ''} label={t('fields.customer')} onChange={(e) => setSelectedClientId(e.target.value as string)} sx={{ backgroundColor: 'background.paper' }}>
                                    {(clientList || []).map(c => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Box>

                        {selectedClientId && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="overline" color="text.secondary">{t('sections.manageSites')}</Typography>
                                    <Paper variant="outlined" sx={{ mt: 1, maxHeight: 200, overflowY: 'auto' }}>
                                        {isListLoading ? (<Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
                                        ) : sitesForClient.length > 0 ? (
                                            <List dense>
                                                {sitesForClient.map(site => {
                                                    const isCurrentlyEditing = editingSiteId === site.purkupaikkaId;
                                                    return (
                                                        <ListItem key={site.purkupaikkaId} divider>
                                                            <Tooltip title={site.isVisibleOnMap ?  t('tooltips.visibleOnMap') : t('tooltips.hiddenFromMap')}>
                                                                <Box component="span" sx={{ display: 'inline-block' }}><Switch edge="start" checked={!!site.isVisibleOnMap} onChange={() => handleVisibilityToggle(site)} size="small" disabled={isCurrentlyEditing} /></Box>
                                                            </Tooltip>

                                                            {isCurrentlyEditing ? (
                                                                <TextField value={editingSiteName} onChange={(e) => setEditingSiteName(e.target.value)} variant="standard" size="small" autoFocus fullWidth sx={{ ml: 1 }} />
                                                            ) : (
                                                                <ListItemText primary={site.purkupaikka} sx={{ ml: 1 }} />
                                                            )}

                                                            <ListItemSecondaryAction>
                                                                {isCurrentlyEditing ? (
                                                                    <><Tooltip title={t('common:buttons.save')}><IconButton edge="end" onClick={handleSaveEdit} disabled={isSaving}><SaveIcon color="primary" /></IconButton></Tooltip><Tooltip title={t('common:buttons.cancel')}><IconButton edge="end" onClick={handleCancelEdit}><CancelIcon /></IconButton></Tooltip></>
                                                                ) : (
                                                                    <><Tooltip title={t('actions.editName')}><IconButton edge="end" onClick={() => handleStartEdit(site)}><EditIcon fontSize="small" /></IconButton></Tooltip><Tooltip title={t('actions.deleteSite')}><IconButton edge="end" onClick={() => initiateDelete(site)}><DeleteIcon color="error" /></IconButton></Tooltip></>
                                                                )}
                                                            </ListItemSecondaryAction>
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                        ) : (<Typography sx={{ p: 3, textAlign: 'center' }} color="text.secondary">{t('empty.noSites')}</Typography>)}
                                    </Paper>
                                </Box>

                                {!isEditMode && (
                                    <>
                                        <Divider />
                                        <Box component="form" onSubmit={handleSubmit(handleAddSite as SubmitHandler<FieldValues>)}>
                                            <Typography variant="overline" color="text.secondary" gutterBottom>{t('sections.addNewSite')}</Typography>
                                            {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
                                            {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={12} sm={5}><Controller name="name" control={control} render={({ field }) => (<TextField {...field} label={t('fields.newSiteName')} fullWidth required error={!!errors.name} helperText={errors.name?.message} />)} /></Grid>
                                                <Grid item xs={6} sm={3.5}><Controller name="latitude" control={control} render={({ field }) => (<TextField {...field} value={field.value ?? ''} label={t('fields.latitude')} type="number" fullWidth required error={!!errors.latitude} helperText={errors.latitude?.message} />)} /></Grid>
                                                <Grid item xs={6} sm={3.5}><Controller name="longitude" control={control} render={({ field }) => (<TextField {...field} value={field.value ?? ''} label={t('fields.longitude')} type="number" fullWidth required error={!!errors.longitude} helperText={errors.longitude?.message} />)} /></Grid>
                                            </Grid>
                                            <Button type="submit" variant="contained" fullWidth disabled={isSaving} sx={{ mt: 2, backgroundColor: '#A98E71', '&:hover': { backgroundColor: '#8E735B' } }}>
                                                {isSaving ? <CircularProgress size={24} color="inherit" /> : t('actions.addToList')}
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button variant="contained" onClick={() => onCloseAction(hasChanges)} color="primary">{t('common:buttons.done')}</Button>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title={t('confirm.title')} message={t('confirm.message', { name: deleteTarget?.purkupaikka ?? '' })} isConfirming={isSaving} />
        </>
    );
}