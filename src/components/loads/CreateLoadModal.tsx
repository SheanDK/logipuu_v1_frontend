// frontend/src/components/loads/CreateLoadModal.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, IconButton, Button,
    FormControl, InputLabel, Select, MenuItem, TextField, Divider, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Fade, Alert
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
import { alpha, useTheme } from '@mui/material/styles';

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
    isOffline?: boolean;
}

export default function CreateLoadModal({
    open,
    onCloseAction,
    puulaaniDetails,
    onSubmitAction,
    initialLoadData,
    isOffline = false,
}: CreateLoadModalProps) {
    const isEditMode = !!initialLoadData;
    const { t } = useTranslation(['createLoadModal', 'common']);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const dialogSurface = alpha(theme.palette.background.paper, isDarkMode ? 0.94 : 0.98);
    const headerSurface = alpha(theme.palette.primary.main, isDarkMode ? 0.35 : 0.12);
    const headerTextColor = theme.palette.getContrastText(theme.palette.primary.main);
    const contentSurface = alpha(theme.palette.background.paper, isDarkMode ? 0.88 : 0.97);
    const dividerColor = alpha(theme.palette.divider, isDarkMode ? 0.7 : 0.25);
    const tableHeaderBg = alpha(theme.palette.primary.main, isDarkMode ? 0.22 : 0.08);
    const rowHoverBg = alpha(theme.palette.primary.main, isDarkMode ? 0.18 : 0.08);
    const actionSurface = alpha(theme.palette.background.paper, isDarkMode ? 0.82 : 0.94);
    const dialogShadow = isDarkMode ? '0px 24px 72px rgba(0,0,0,0.7)' : '0px 20px 48px rgba(15,23,42,0.16)';

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
    const availableTasks: IWoodEntry[] = useMemo(
        () => (puulaaniDetails?.timberEntries || []).map(e => JSON.parse(JSON.stringify(e))),
        [puulaaniDetails]
    );
    // Watch for changes in the 'Timber Type' dropdown and 'Hauled' input
    const watchedPuutavaraId = watch('puutavaraId');
    const watchedVolume = watch('volume');

    const showOfflinePlaceholders = isOffline && isEditMode;
    const offlineUnavailableText = t('form.offlineUnavailable', { defaultValue: 'Data unavailable offline' });

    // Find the selected task object based on the watched ID
    const selectedTask = useMemo(() => {
        if (showOfflinePlaceholders) return undefined;
        if (!watchedPuutavaraId) return undefined;
        return availableTasks.find(t => String(t.puutavaraId) === String(watchedPuutavaraId));
    }, [watchedPuutavaraId, availableTasks, showOfflinePlaceholders]);

    // Calculate the new remaining volume in real-time
    const calculatedRemaining = useMemo(() => {
        if (showOfflinePlaceholders) return offlineUnavailableText;
        if (!selectedTask) return '';
        const originalHauled = isEditMode ? Number(initialLoadData?.m3) || 0 : 0;
        const currentRemaining = Number(selectedTask.jaljella) + originalHauled;
        const newHauled = Number(watchedVolume) || 0;
        return (currentRemaining - newHauled).toFixed(2);
    }, [selectedTask, watchedVolume, showOfflinePlaceholders, initialLoadData, offlineUnavailableText]);

    const confirmActionLabel = isOffline ? t('actions.queueCreate') : t('actions.confirmCreate');

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
            const taskSnapshot = {
                asiakasId: Number(foundTask.asiakasId ?? 0),
                puulaaniId: Number(foundTask.puulaaniId ?? 0),
                puutavaraId: Number(foundTask.puutavaraId ?? 0),
                purkupaikkaId: Number(foundTask.purkupaikkaId ?? 0),
                laji: foundTask.laji ?? '',
                purkupaikkaName: foundTask.purkupaikkaName ?? '',
                kuutiot: Number(foundTask.kuutiot ?? 0),
                haettu: Number(foundTask.haettu ?? 0),
                jaljella: Number(foundTask.jaljella ?? 0),
                km: Number(data.km ?? foundTask.km ?? 0),
                notes: data.notes ?? '',
                reitti: data.route ?? '',
            };

            append({ ...data, taskDetails: taskSnapshot }); // no functions/getters
        resetLegForm({ puutavaraId: '', receptionNo: '', volume: '', route: '', km: '', notes: '' });
    }
};

const onFormError = (errors: any) => { console.error("Form validation failed:", errors); };
    const handleFinalCreateSubmit = (data: CreateLoadForm) => {

        const legs = (data.legs || []).map((l: any) => {
            const routeValue = l.route ?? l.taskDetails?.reitti ?? l.taskDetails?.route ?? '';
            const kmValue = l.km ?? l.taskDetails?.km ?? '0';
            const notesValue = l.notes ?? l.taskDetails?.notes ?? '';

            return {
                puutavaraId: String(l.puutavaraId ?? l.taskDetails?.puutavaraId ?? ''),
                receptionNo: l.receptionNo ?? '',
                volume: String(l.volume ?? ''),
                route: routeValue,
                km: String(kmValue),
                notes: notesValue,
                taskDetails: l.taskDetails
                    ? {
                        asiakasId: Number(l.taskDetails.asiakasId ?? 0),
                        puulaaniId: Number(l.taskDetails.puulaaniId ?? 0),
                        puutavaraId: Number(l.taskDetails.puutavaraId ?? 0),
                        purkupaikkaId: Number(l.taskDetails.purkupaikkaId ?? 0),
                        laji: l.taskDetails.laji ?? '',
                        purkupaikkaName: l.taskDetails.purkupaikkaName ?? '',
                        kuutiot: Number(l.taskDetails.kuutiot ?? 0),
                        haettu: Number(l.taskDetails.haettu ?? 0),
                        jaljella: Number(l.taskDetails.jaljella ?? 0),
                        km: Number(l.taskDetails.km ?? l.km ?? 0),
                        notes: l.taskDetails.notes ?? l.notes ?? '',
                        reitti: l.taskDetails.reitti ?? l.route ?? '',
                        route: l.taskDetails.route ?? l.route ?? '',
                    }
                    : undefined,
            };
        });

        onSubmitAction(legs, false);
    };
    const handleUpdateSubmit = (data: LoadLegForm) => onSubmitAction({ ...data, kuormaId: initialLoadData.kuormaId }, true);

    if (!open || (!puulaaniDetails && !isEditMode)) return null;

    return (
        <Dialog
            open={open}
            onClose={onCloseAction}
            fullWidth
            maxWidth={isEditMode ? "sm" : "md"}
            TransitionComponent={Fade}
            PaperProps={{
                sx: {
                    backgroundColor: dialogSurface,
                    backdropFilter: 'blur(16px)',
                    borderRadius: 3,
                    border: `1px solid ${dividerColor}`,
                    boxShadow: dialogShadow
                }
            }}
        >
            <DialogTitle
                 sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    bgcolor: theme.palette.mode === 'light' 
                        ? theme.palette.grey[100] // A light grey for light mode
                        : alpha(theme.palette.primary.main, 0.35), // Your existing dark mode color
                    color: theme.palette.text.primary, // Use the primary text color for both modes for consistency
                    py: 1.75,
                    position: 'relative',
                    borderBottom: `1px solid ${theme.palette.divider}` // Add a subtle border
                }}
            >
                <LocalShippingIcon sx={{ fontSize: 28 }} />
                <Box>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>{isEditMode ? t('title.edit') : t('title.create')}</Typography>
                    {!isEditMode && <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>{t('title.from')} {puulaaniDetails?.puulaani.nimi}</Typography>}
                </Box>
                <IconButton onClick={onCloseAction} sx={{ color: headerTextColor, position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, backgroundColor: contentSurface }}>
                {isOffline && (
                    <Alert severity="warning" color="warning" sx={{ mb: 2 }}>
                        {t('offline.notice')}
                    </Alert>
                )}
                <FormProvider {...legMethods}>
                    <Box component="form" id="leg-form" onSubmit={isEditMode ? handleLegSubmit(handleUpdateSubmit, onFormError) : handleLegSubmit(handleAddLeg, onFormError)}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                mb: 3,
                                backgroundColor: contentSurface,
                                border: `1px solid ${dividerColor}`,
                                borderRadius: 2,
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2.5, color: theme.palette.primary.main, display: 'flex', alignItems: 'center', gap: 1 }}> {isEditMode ? t('section.editDetails') : t('section.addLeg')}</Typography>
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
                                        render={({ field, fieldState }) => {
                                            if (showOfflinePlaceholders) {
                                                return (
                                                    <>
                                                        <input
                                                            type="hidden"
                                                            name={field.name}
                                                            value={field.value ?? ''}
                                                            ref={field.ref}
                                                            onChange={field.onChange}
                                                            onBlur={field.onBlur}
                                                        />
                                                        <TextField
                                                            label={`${t('form.timberType')} *`}
                                                            value={offlineUnavailableText}
                                                            fullWidth
                                                            disabled
                                                            InputProps={{ readOnly: true }}
                                                        />
                                                    </>
                                                );
                                            }
                                            return (
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
                                            );
                                        }}
                                    />
                                </Box>

                                {/* Drop-off location (disabled) */}
                                <Box>
                                    <TextField
                                        label={t('form.dropoff')}
                                        value={showOfflinePlaceholders ? offlineUnavailableText : selectedTask?.purkupaikkaName || ''}
                                        fullWidth
                                        disabled
                                        variant="filled"
                                        InputProps={{ readOnly: true }}
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
                                        value={showOfflinePlaceholders ? offlineUnavailableText : selectedTask ? Number(selectedTask.kuutiot).toFixed(2) : ''}
                                        fullWidth
                                        disabled
                                        variant="filled"
                                        InputProps={{ readOnly: true }}
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
                                        InputProps={{ readOnly: true }}
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
                                    color="primary"
                                    sx={{ mt: 3, width: '100%', py: 1.5 }}
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
                    <TableContainer
                        component={Paper}
                        elevation={0}
                        variant='outlined'
                        sx={{
                            borderRadius: 2,
                            backgroundColor: contentSurface,
                            border: `1px solid ${dividerColor}`
                        }}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: tableHeaderBg }}>
                                    <TableCell>{t('legs.columns.timber')}</TableCell>
                                    <TableCell align="right">{t('legs.columns.volume')}</TableCell>
                                    <TableCell>{t('legs.columns.reception')}</TableCell>
                                    <TableCell align="center">{t('legs.columns.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(fields as any[]).length > 0 ? (fields as any[]).map((field, index) => (
                                    <TableRow
                                        key={field.id}
                                        hover
                                        sx={{
                                            '&:last-child td': { borderBottom: 0 },
                                            '&:hover': { backgroundColor: rowHoverBg }
                                        }}
                                    >
                                        <TableCell sx={{ fontWeight: 500 }}>{field.taskDetails.laji}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>{field.volume}</TableCell>
                                        <TableCell>{field.receptionNo || '—'}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" color="error" title={t('actions.removeLeg')} onClick={() => remove(index)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary', fontStyle: 'italic' }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary">📦 {t('legs.empty.title')}</Typography>
                                                <Typography variant="caption" color="text.disabled">{t('legs.empty.subtitle')}</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>)}
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: `1px solid ${dividerColor}`, backgroundColor: actionSurface }}>
                <Button onClick={onCloseAction} variant="text" color="secondary">
                    {t('common:buttons.cancel')}
                </Button>
                {isEditMode ? (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleLegSubmit(handleUpdateSubmit)}

                    >
                        {t('common:buttons.save')}
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<SendIcon />}
                        onClick={handleMainSubmit(handleFinalCreateSubmit)}
                        disabled={fields.length === 0}
                    >
                        {confirmActionLabel}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}




