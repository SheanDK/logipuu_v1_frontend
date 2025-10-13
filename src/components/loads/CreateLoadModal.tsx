// frontend/src/components/loads/CreateLoadModal.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, IconButton, Button,
    Stack, FormControl, InputLabel, Select, MenuItem, TextField, Divider, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormHelperText,
    Grid, Chip, Fade
} from '@mui/material';
import { useForm, Controller, useFieldArray, FormProvider } from 'react-hook-form';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { IWoodEntry, PuulaaniDetails } from '@/types';
import { useTranslation } from 'react-i18next';

// --- Form Types ---
interface LoadLegForm {
    puutavaraId: string;
    receptionNo: string;
    volume: string;
    route: string;
    km: string;
    notes: string;
}
interface CreateLoadForm {
    legs: any[];
}

interface CreateLoadModalProps {
    open: boolean;
    onCloseAction: () => void;
    puulaaniDetails: PuulaaniDetails | null;
    onSubmitAction: (data: any, isEdit: boolean) => void;
    initialLoadData?: any;
}

export default function CreateLoadModal({ open, onCloseAction, puulaaniDetails, onSubmitAction, initialLoadData }: CreateLoadModalProps) {
    const isEditMode = !!initialLoadData;
    const { t } = useTranslation(['createLoadModal', 'common']);

    // Form for adding/editing a single leg
    const legMethods = useForm<LoadLegForm>({
        defaultValues: { puutavaraId: '', receptionNo: '', volume: '', route: '', km: '', notes: '' }
    });
    const { reset: resetLegForm, control: legControl, watch, handleSubmit: handleLegSubmit } = legMethods;

    // Form for managing the list of legs in create mode
    const mainMethods = useForm<CreateLoadForm>({ defaultValues: { legs: [] } });
    const { reset: resetMainForm, control: mainControl, handleSubmit: handleMainSubmit } = mainMethods;
    const { fields, append, remove } = useFieldArray({ control: mainControl, name: "legs" });

    // Directly derive availableTasks from props using useMemo. This is more reliable.
    const availableTasks: IWoodEntry[] = useMemo(() => puulaaniDetails?.timberEntries || [], [puulaaniDetails]);

    // Watch for changes in the 'Timber Type' dropdown and 'Hauled' input
    const watchedPuutavaraId = watch('puutavaraId');
    const watchedVolume = watch('volume');

    // Find the selected task object based on the watched ID
    const selectedTask = useMemo(() => {
        if (!watchedPuutavaraId) return undefined;
        return availableTasks.find(t => String(t.puutavaraId) === String(watchedPuutavaraId));
    }, [watchedPuutavaraId, availableTasks]);

    // Calculate the new remaining volume in real-time
    const calculatedRemaining = useMemo(() => {
        if (!selectedTask) return '';
        const originalHauled = isEditMode ? Number(initialLoadData?.m3) || 0 : 0;
        const currentRemaining = Number(selectedTask.jaljella) + originalHauled;
        const newHauled = Number(watchedVolume) || 0;
        return (currentRemaining - newHauled).toFixed(2);
    }, [selectedTask, watchedVolume, isEditMode, initialLoadData]);

    // Effect to reset forms when the modal's open state or mode changes
    useEffect(() => {
        if (open) {
            if (isEditMode && initialLoadData) {
                resetLegForm({
                    puutavaraId: String(initialLoadData.puutavaraId || ''),
                    receptionNo: initialLoadData.vastaanottoNro || '',
                    volume: String(initialLoadData.m3 || ''),
                    km: String(initialLoadData.km || '0'),
                    route: initialLoadData.reitti || '',
                    notes: initialLoadData.lisatiedot || ''
                });
            } else {
                resetLegForm({ puutavaraId: '', receptionNo: '', volume: '', route: '', km: '', notes: '' });
                resetMainForm({ legs: [] });
            }
        }
    }, [open, isEditMode, initialLoadData, resetLegForm, resetMainForm]);

    const handleAddLeg = (data: LoadLegForm) => {
        const foundTask = availableTasks.find(t => String(t.puutavaraId) === String(data.puutavaraId));
        if (foundTask) {
            append({ ...data, taskDetails: foundTask });
            resetLegForm({ puutavaraId: '', receptionNo: '', volume: '', route: '', km: '', notes: '' });
        }
    };

    const onFormError = (errors: any) => { console.error("Form validation failed:", errors); };
    const handleFinalCreateSubmit = (data: CreateLoadForm) => onSubmitAction(data.legs, false);
    const handleUpdateSubmit = (data: LoadLegForm) => onSubmitAction({ ...data, kuormaId: initialLoadData.kuormaId }, true);

    if (!open || (!puulaaniDetails && !isEditMode)) return null;

    return (
        <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth={isEditMode ? "sm" : "md"} TransitionComponent={Fade} PaperProps={{ sx: { background: 'linear-gradient(to top, #eef1f5 0%, #ffffff 100%)', borderRadius: 4, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', bgcolor: '#37474f', color: 'white', py: 2 }}>
                <LocalShippingIcon sx={{ mr: 1.5 }} />
                <Box>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>{isEditMode ? t('title.edit') : t('title.create')}</Typography>
                    {!isEditMode && <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>{t('title.from')} {puulaaniDetails?.puulaani.nimi}</Typography>}
                </Box>
                <IconButton onClick={onCloseAction} sx={{ color: 'white', position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, backgroundColor: '#f4f6f8' }}>
                <FormProvider {...legMethods}>
                    <Box component="form" id="leg-form" onSubmit={isEditMode ? handleLegSubmit(handleUpdateSubmit, onFormError) : handleLegSubmit(handleAddLeg, onFormError)}>
                        <Paper elevation={0} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2.5, color: '#1565c0', display: 'flex', alignItems: 'center', gap: 1 }}> {isEditMode ? t('section.editDetails') : t('section.addLeg')}</Typography>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',       
                                        sm: 'repeat(2, 1fr)', 
                                        md: 'repeat(3, 1fr)'  
                                    },
                                    gap: 2.5,
                                    alignItems: 'center'
                                }}
                            >
                                {/* Timber type */}
                                <Box>
                                    <Controller
                                        name="puutavaraId"
                                        control={legControl}
                                        rules={{ required: t('validation.required') as string }}
                                        render={({ field, fieldState }) => (
                                            <FormControl fullWidth error={!!fieldState.error} disabled={isEditMode}>
                                                <InputLabel>{t('form.timberType')} *</InputLabel>
                                                <Select {...field} label={`${t('form.timberType')} *`}>
                                                    {(puulaaniDetails?.timberEntries || []).map(task => (
                                                        <MenuItem key={task.puutavaraId} value={String(task.puutavaraId)}>
                                                            {task.laji}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Box>

                                {/* Drop-off location (disabled) */}
                                <Box>
                                    <TextField
                                        label={t('form.dropoff')}
                                        value={selectedTask?.purkupaikkaName || ''}
                                        fullWidth
                                        disabled
                                        variant="filled"
                                    />
                                </Box>

                                {/* Reception number */}
                                <Box>
                                    <Controller
                                        name="receptionNo"
                                        control={legControl}
                                        render={({ field }) => <TextField {...field} label={t('form.receptionNo')} fullWidth />}
                                    />
                                </Box>

                                {/* Totals */}
                                <Box>
                                    <TextField
                                        label={t('form.total')}
                                        value={selectedTask ? Number(selectedTask.kuutiot).toFixed(2) : ''}
                                        fullWidth
                                        disabled
                                        variant="filled"
                                    />
                                </Box>

                                {/* Hauled (required) */}
                                <Box>
                                    <Controller
                                        name="volume"
                                        control={legControl}
                                        rules={{ required: t('validation.required') as string }}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                label={t('form.hauled')}
                                                type="number"
                                                fullWidth
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        )}
                                    />
                                </Box>

                                {/* Remaining (disabled) */}
                                <Box>
                                    <TextField
                                        label={t('form.remaining')}
                                        value={calculatedRemaining}
                                        fullWidth
                                        disabled
                                        variant="filled"
                                    />
                                </Box>

                                {/* Route */}
                                <Box>
                                    <Controller
                                        name="route"
                                        control={legControl}
                                        render={({ field }) => <TextField {...field} label={t('form.route')} fullWidth />}
                                    />
                                </Box>

                                {/* Freight km */}
                                <Box>
                                    <Controller
                                        name="km"
                                        control={legControl}
                                        render={({ field }) => (
                                            <TextField {...field} label={t('form.freightKm')} type="number" fullWidth />
                                        )}
                                    />
                                </Box>

                                {/* Notes */}
                                <Box>
                                    <Controller
                                        name="notes"
                                        control={legControl}
                                        render={({ field }) => <TextField {...field} label={t('form.notes')} fullWidth />}
                                    />
                                </Box>
                            </Box>

                            {!isEditMode && (
                                <Button
                                    type="submit"
                                    startIcon={<AddCircleIcon />}
                                    variant="contained"
                                    sx={{ mt: 3, width: '100%', py: 1.5, backgroundColor: '#607d8b', '&:hover': { backgroundColor: '#546e7a' } }}
                                    aria-label={t('actions.addToTrip')}
                                >
                                    {t('actions.addToTrip')}
                                </Button>
                            )}
                        </Paper>
                    </Box>
                </FormProvider>
                {!isEditMode && (<>
                    <Divider sx={{ my: 2 }}><Chip label={t('legs.title')} icon={<LocalShippingIcon fontSize="small" />} /></Divider>
                    <TableContainer component={Paper} elevation={0} variant='outlined' sx={{ borderRadius: 2 }}><Table size="small"><TableHead><TableRow sx={{ bgcolor: 'action.hover' }}><TableCell>{t('legs.columns.timber')}</TableCell><TableCell align="right">{t('legs.columns.volume')}</TableCell><TableCell>{t('legs.columns.reception')}</TableCell><TableCell align="center">{t('legs.columns.actions')}</TableCell></TableRow></TableHead><TableBody>{(fields as any[]).length > 0 ? (fields as any[]).map((field, index) => (<TableRow key={field.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}><TableCell sx={{ fontWeight: 500 }}>{field.taskDetails.laji}</TableCell><TableCell align="right" sx={{ fontWeight: 600, color: '#1976d2' }}>{field.volume}</TableCell><TableCell>{field.receptionNo || '—'}</TableCell><TableCell align="center"><IconButton size="small" color="error" title={t('actions.removeLeg')} onClick={() => remove(index)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>)) : (<TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary', fontStyle: 'italic' }}><Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}><Typography variant="body2" color="text.secondary">📦 {t('legs.empty.title')}</Typography><Typography variant="caption" color="text.disabled">{t('legs.empty.subtitle')}</Typography></Box></TableCell></TableRow>)}</TableBody></Table></TableContainer>
                </>)}
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: '#f4f6f8' }}>
                <Button onClick={onCloseAction} variant="text" color="secondary">{t('common:buttons.cancel')}</Button>
                {isEditMode ? (<Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleLegSubmit(handleUpdateSubmit)}>{t('common:buttons.save')}</Button>) : (<Button variant="contained" color="success" startIcon={<SendIcon />} onClick={handleMainSubmit(handleFinalCreateSubmit)} disabled={fields.length === 0}>{t('actions.confirmCreate')}</Button>)}
            </DialogActions>
        </Dialog>
    );
}