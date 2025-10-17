// frontend/src/components/drivers/ConsignmentDriverForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Grid, TextField, Stack, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { useForm, useFieldArray, Controller, FormProvider, SubmitHandler } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { getCustomerOptions, ICustomerOption } from '@/services/customerService';
import { getConsignmentById, createConsignment, updateConsignment } from '@/services/consignmentDriverService';
import { IConsignmentForm, IRahtikirjaItem } from '@/types';
import DeleteIcon from '@mui/icons-material/Delete';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/i18n/useTranslation';

const ConfirmationDialog = dynamic(() => import('@/components/common/ConfirmationDialog'), { ssr: false });

const WaybillEditorForm = ({
    onAddWaybill,
    onUpdateWaybill,
    editingWaybill,
    onCancelEdit
}: {
    onAddWaybill: (data: IRahtikirjaItem) => void;
    onUpdateWaybill: (data: IRahtikirjaItem) => void;
    editingWaybill: IRahtikirjaItem | null;
    onCancelEdit: () => void;
}) => {
    const isEditMode = editingWaybill !== null;
    const methods = useForm<IRahtikirjaItem>();
    const { handleSubmit, reset, control } = methods;
    const { t } = useTranslation(['consignmentForm']);

    useEffect(() => {
        if (isEditMode && editingWaybill) {
            // Ensure all fields have string values, never null or undefined
            const defaultValues = {
                rahtikirjanNumero: editingWaybill.rahtikirjanNumero ?? '',
                reitti: editingWaybill.reitti ?? '',
                m3: editingWaybill.m3 ?? '',
                kpl: editingWaybill.kpl ?? '',
                jako: editingWaybill.jako ?? '',
                km: editingWaybill.km ?? '',
                tievero: editingWaybill.tievero ?? '',
                lisatiedot: editingWaybill.lisatiedot ?? ''
            };
            reset(defaultValues);
        } else {
            reset({ rahtikirjanNumero: '', reitti: '', m3: '', km: '', kpl: '', jako: '', tievero: '', lisatiedot: '' });
        }
    }, [editingWaybill, isEditMode, reset]);

    const onSubmit = (data: IRahtikirjaItem) => {
        if (isEditMode) {
            onUpdateWaybill(data);
        } else {
            onAddWaybill(data);
            // Reset the form ONLY when in 'add' mode.
            reset({ rahtikirjanNumero: '', reitti: '', m3: '', km: '', kpl: '', jako: '', tievero: '', lisatiedot: '' });
        }
    };

    return (
        <Paper variant="outlined" sx={{ p: 2.5, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>{isEditMode ? t('waybillEditor.titleEdit') : t('waybillEditor.titleNew')}</Typography>
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
                <Controller name="rahtikirjanNumero" control={control} rules={{ required: t('validation.waybillNumberRequired') as string }} render={({ field, fieldState: { error } }) => <TextField {...field} label={t('fields.waybillNumber')} size="small" error={!!error} helperText={error?.message} />} />
                <Controller name="reitti" control={control} rules={{ required: t('validation.routeRequired') as string }} render={({ field, fieldState: { error } }) => <TextField {...field} label={t('fields.route')} size="small" error={!!error} helperText={error?.message} />} />
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
                        gap: 2,
                    }}
                >
                    <Controller name="m3" control={control} render={({ field }) => <TextField {...field} label={t('fields.m3')} type="number" size="small" />} />
                    <Controller name="kpl" control={control} render={({ field }) => <TextField {...field} label={t('fields.pcs')} type="number" size="small" />} />
                    <Controller name="jako" control={control} render={({ field }) => <TextField {...field} label={t('fields.dist')} type="number" size="small" />} />
                </Box>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        gap: 2,
                    }}
                >
                    <Controller name="km" control={control} render={({ field }) => <TextField {...field} label={t('fields.km')} type="number" size="small" />} />
                    <Controller name="tievero" control={control} render={({ field }) => <TextField {...field} label={t('fields.roadToll')} type="number" size="small" />} />
                </Box>
                <Controller name="lisatiedot" control={control} render={({ field }) => <TextField {...field} label={t('fields.notes')} size="small" multiline rows={2} />} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button variant="contained" onClick={handleSubmit(onSubmit)} fullWidth>
                    {isEditMode ? t('buttons.updateWaybill') : t('buttons.addWaybill')}
                </Button>
                {isEditMode && (
                    <Button variant="outlined" onClick={onCancelEdit} fullWidth>
                        {t('buttons.cancel')}
                    </Button>
                )}
            </Stack>
        </Paper>
    );
};

// FIX: The component now receives 'onAttemptDelete' prop instead of 'remove'.
const WaybillsList = ({ fields, onAttemptDelete, onEdit }: { fields: Record<string, any>[], onAttemptDelete: (index: number) => void, onEdit: (index: number) => void }) => {
    const { t } = useTranslation(['consignmentForm']);
    return (
        <Paper variant="outlined" sx={{ p: 2.5, flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>{t('waybillsList.title')}</Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('table.numberShort')}</TableCell>
                            <TableCell>{t('fields.m3')}</TableCell>
                            <TableCell>{t('fields.km')}</TableCell>
                            <TableCell>{t('fields.pcs')}</TableCell>
                            <TableCell>{t('table.action')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(fields || []).map((field, index) => (
                            <TableRow key={field.id} hover sx={{ cursor: 'pointer' }} onClick={() => onEdit(index)}>
                                <TableCell>{field.rahtikirjanNumero}</TableCell>
                                <TableCell>{field.m3}</TableCell>
                                <TableCell>{field.km}</TableCell>
                                <TableCell>{field.kpl}</TableCell>
                                <TableCell align="left">
                                    {/* FIX: The onClick now calls onAttemptDelete to open the dialog. */}
                                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onAttemptDelete(index); }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

interface ConsignmentFormProps {
    onBackToListAction: () => void;
    consignmentId: number | null;
}

export default function ConsignmentDriverForm({ onBackToListAction, consignmentId }: ConsignmentFormProps) {
    const isEditMode = consignmentId !== null;
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVehicleId } = useDriverSession();
    const [isLoading, setIsLoading] = useState(false);
    const [customers, setCustomers] = useState<ICustomerOption[]>([]);
    const defaultDate = new Date().toISOString().split('T')[0];
    const { t } = useTranslation(['consignmentForm', 'common']);

    // State for the edit-waybill feature
    const [editingWaybillIndex, setEditingWaybillIndex] = useState<number | null>(null);
    // State for the delete-waybill feature
    const [waybillToDeleteIndex, setWaybillToDeleteIndex] = useState<number | null>(null);

    const methods = useForm<IConsignmentForm>({
        defaultValues: { asiakasId: '', pvm: defaultDate, lisatiedot: '', rahtikirjat: [] },
    });

    const { control, handleSubmit, reset, formState: { isSubmitting } } = methods;

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'rahtikirjat'
    });

    useEffect(() => {
        getCustomerOptions().then(data => setCustomers(data)).catch(() => enqueueSnackbar('Failed to load customers.', { variant: 'warning' }));
    }, [enqueueSnackbar]);

    useEffect(() => {
        if (isEditMode && consignmentId) {
            setIsLoading(true);
            getConsignmentById(consignmentId)
                .then((data) => {
                    // --- THE FINAL FIX ---
                    // The data from the backend is already camelCased by our db wrapper.
                    // We must access the correct camelCased property name.
                    const formattedWaybills = (data.rahtikirjat || []).map((wb: any) => ({
                        rahtiId: wb.rahtiId,
                        // FIX: Use 'rahtikirjanNro' (camelCase) which comes from the backend.
                        rahtikirjanNumero: wb.rahtikirjanNro,
                        reitti: wb.reitti,
                        m3: wb.m3,
                        km: wb.km,
                        kpl: wb.kpl,
                        jako: wb.jako,
                        tievero: wb.tievero,
                        lisatiedot: wb.lisatiedot
                    }));

                    const formattedData = {
                        ...data,
                        pvm: data.pvm.split('T')[0],
                        rahtikirjat: formattedWaybills
                    };
                    reset(formattedData);

                })
                .catch(() => enqueueSnackbar(t('errors.customersLoadFailed'), { variant: 'error' }))
                .finally(() => setIsLoading(false));
        } else {
            reset({ asiakasId: '', pvm: defaultDate, lisatiedot: '', rahtikirjat: [] });
        }
    }, [consignmentId, isEditMode, reset, enqueueSnackbar, defaultDate]);

    const onFormSubmit: SubmitHandler<IConsignmentForm> = async (data) => {
        try {
            // Send the form's camelCase data directly to the backend.
            const payload = {
                ...data,
                rahtikirjat: data.rahtikirjat.map((waybill) => ({
                    ...waybill,
                    m3: Number(waybill.m3) || 0,
                    km: Number(waybill.km) || 0,
                    kpl: Number(waybill.kpl) || 0,
                    jako: Number(waybill.jako) || 0,
                    tievero: Number(waybill.tievero) || 0,
                }))
            };

            if (isEditMode) {
                await updateConsignment(consignmentId!, payload);
                enqueueSnackbar(t('toasts.consignmentUpdated'), { variant: 'success' });
            } else {
                if (!selectedVehicleId) {
                    enqueueSnackbar(t('errors.vehicleNotSelected'), { variant: 'error' });
                    return;
                }
                const finalPayload = { ...payload, vehicleId: selectedVehicleId };
                await createConsignment(finalPayload);
                enqueueSnackbar(t('toasts.consignmentCreated'), { variant: 'success' });
            }
            onBackToListAction();
        } catch (error: any) {
            console.error("API Error Response:", error.response?.data || error);
            enqueueSnackbar(error.response?.data?.message || t('errors.submissionFailed'), { variant: 'error' });
        }
    };

    // --- Handlers for EDITING a waybill ---
    const handleEditWaybill = (index: number) => { setEditingWaybillIndex(index); };
    const handleUpdateWaybill = (data: IRahtikirjaItem) => {
        if (editingWaybillIndex !== null) {
            update(editingWaybillIndex, data);
            setEditingWaybillIndex(null);
        }
    };
    const handleCancelEdit = () => { setEditingWaybillIndex(null); };

    // --- Handlers for DELETING a waybill ---
    const handleAttemptDelete = (index: number) => { setWaybillToDeleteIndex(index); };
    const handleConfirmDelete = () => {
        if (waybillToDeleteIndex !== null) {
            remove(waybillToDeleteIndex);
            setWaybillToDeleteIndex(null);
            enqueueSnackbar(t('toasts.waybillRemoved'), { variant: 'info' });
        }
    };
    const handleCancelDelete = () => { setWaybillToDeleteIndex(null); };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    return (
        <FormProvider {...methods}>
            <Box component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: { xs: 1, sm: 2 }, flexGrow: 1, overflowY: 'auto' }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
                            gap: 2,
                            alignItems: 'start'
                        }}
                    >
                        <Paper variant="outlined" sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" gutterBottom>{t('sections.loadDetails')}</Typography>
                            <Stack spacing={2.5} sx={{ flexGrow: 1 }}>
                                <Controller name="pvm" control={control} render={({ field }) => <TextField {...field} label={t('fields.date')} type="date" size="small" InputLabelProps={{ shrink: true }} />} />
                                <Controller
                                    name="asiakasId"
                                    control={control}
                                    rules={{ required: t('validation.customerRequired') as string }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label={t('fields.selectCustomer')}
                                            select
                                            SelectProps={{ native: true }}
                                            size="small"
                                            error={!!error}
                                            helperText={error?.message}
                                        >
                                            <option value=""></option>
                                            {customers.map((customer) => (
                                                // Use the correct property names from the ICustomerOption interface
                                                <option key={customer.asiakkaanId} value={customer.asiakkaanId}>
                                                    {customer.asiakkaanNimi}
                                                </option>
                                            ))}
                                        </TextField>
                                    )}
                                />
                                <Controller name="lisatiedot" control={control} render={({ field }) => <TextField {...field} label={t('fields.notes')} multiline rows={8} fullWidth />} />
                            </Stack>
                        </Paper>

                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                minWidth: 0,
                            }}
                        >
                            <Stack spacing={2} sx={{ height: '100%' }}>
                                <WaybillEditorForm
                                    key={editingWaybillIndex ?? 'new'}
                                    onAddWaybill={(data) => append(data)}
                                    onUpdateWaybill={handleUpdateWaybill}
                                    editingWaybill={editingWaybillIndex !== null ? fields[editingWaybillIndex] as IRahtikirjaItem : null}
                                    onCancelEdit={handleCancelEdit}
                                />
                                <WaybillsList fields={fields} onEdit={handleEditWaybill} onAttemptDelete={handleAttemptDelete} />
                            </Stack>
                        </Box>
                    </Box>
                </Box>
                <Paper elevation={3} sx={{ p: 2, borderTop: '1px solid #ddd', flexShrink: 0 }}>
                    <Stack direction="row" spacing={2}>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? t('buttons.saveChanges') : t('buttons.sendLoad'))}
                        </Button>
                        <Button variant="outlined" onClick={onBackToListAction}>{t('common:buttons.back')}</Button>
                    </Stack>
                </Paper>
            </Box>

            <ConfirmationDialog
                open={waybillToDeleteIndex !== null}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title={t('dialog.confirmDeleteTitle')}
                message={t('dialog.confirmDeleteMessage', {
                    number: waybillToDeleteIndex !== null && fields[waybillToDeleteIndex] ? fields[waybillToDeleteIndex].rahtikirjanNumero : '',
                })}
                confirmButtonText={t('common:buttons.delete')}
                confirmButtonColor="error"
            />
        </FormProvider>
    );
}