// frontend/src/components/drivers/ConsignmentDriverForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, TextField, Stack, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { useForm, useFieldArray, Controller, FormProvider, SubmitHandler } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { getCustomerOptions, ICustomerOption } from '@/services/customerService';
import { getConsignmentById, createConsignment, updateConsignment } from '@/services/consignmentDriverService';
import { IRahtikirjaItem } from '@/types';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/i18n/useTranslation';

const ConfirmationDialog = dynamic(() => import('@/components/common/ConfirmationDialog'), { ssr: false });

interface IExtendedRahtikirjaItem extends IRahtikirjaItem {
    asiakasId: string;
    customerName?: string;
}

const EMPTY_WAYBILL_VALUES: IExtendedRahtikirjaItem = {
    asiakasId: '',
    rahtikirjanNumero: '',
    reitti: '',
    m3: '',
    km: '',
    kpl: '',
    jako: '',
    tievero: '',
    lisatiedot: '',
};

/* ----------------------------------------------------------------------------------
 * Waybill Editor Sub-component
 * --------------------------------------------------------------------------------*/
const WaybillEditorForm = ({
    onAddWaybill,
    onUpdateWaybill,
    editingWaybill,
    onCancelEdit,
    customers
}: {
    onAddWaybill: (data: IExtendedRahtikirjaItem) => void;
    onUpdateWaybill: (data: IExtendedRahtikirjaItem) => void;
    editingWaybill: IExtendedRahtikirjaItem | null;
    onCancelEdit: () => void;
    customers: ICustomerOption[];
}) => {
    const isEditMode = editingWaybill !== null;
    const methods = useForm<IExtendedRahtikirjaItem>({ defaultValues: { ...EMPTY_WAYBILL_VALUES } });
    const { handleSubmit, reset, control } = methods;
    const { t } = useTranslation(['consignmentForm']);

    useEffect(() => {
        if (isEditMode && editingWaybill) {
            reset({
                asiakasId: editingWaybill.asiakasId ?? '',
                rahtikirjanNumero: editingWaybill.rahtikirjanNumero ?? '',
                reitti: editingWaybill.reitti ?? '',
                m3: editingWaybill.m3 ?? '',
                kpl: editingWaybill.kpl ?? '',
                jako: editingWaybill.jako ?? '',
                km: editingWaybill.km ?? '',
                tievero: editingWaybill.tievero ?? '',
                lisatiedot: editingWaybill.lisatiedot ?? ''
            });
        } else {
            reset({ ...EMPTY_WAYBILL_VALUES });
        }
    }, [editingWaybill, isEditMode, reset]);

    const onSubmit = (data: IExtendedRahtikirjaItem) => {
        const selectedCustomer = customers.find(c => String(c.asiakkaanId) === String(data.asiakasId));
        const dataWithDisplay = {
            ...data,
            customerName: selectedCustomer ? selectedCustomer.asiakkaanNimi : ''
        };

        if (isEditMode) {
            onUpdateWaybill(dataWithDisplay);
        } else {
            onAddWaybill(dataWithDisplay);
            reset({ ...EMPTY_WAYBILL_VALUES });
        }
    };

    return (
        <Paper variant="outlined" sx={{ p: 2.5, display: 'flex', flexDirection: 'column', bgcolor: '#f9f9f9' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                {isEditMode ? t('waybillEditor.titleEdit') : t('waybillEditor.titleNew')}
            </Typography>
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
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
                            fullWidth
                        >
                            <option value=""></option>
                            {customers.map((c) => (<option key={c.asiakkaanId} value={c.asiakkaanId}>{c.asiakkaanNimi}</option>))}
                        </TextField>
                    )}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Controller name="rahtikirjanNumero" control={control} rules={{ required: t('validation.waybillNumberRequired') as string }} render={({ field, fieldState: { error } }) => <TextField {...field} label={t('fields.waybillNumber')} size="small" error={!!error} helperText={error?.message} />} />
                    <Controller name="reitti" control={control} rules={{ required: t('validation.routeRequired') as string }} render={({ field, fieldState: { error } }) => <TextField {...field} label={t('fields.route')} size="small" error={!!error} helperText={error?.message} />} />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                    <Controller name="m3" control={control} render={({ field }) => <TextField {...field} label={t('common:units.m3', { defaultValue: 'm³' })} type="number" size="small" />} />
                    <Controller name="km" control={control} render={({ field }) => <TextField {...field} label={t('common:units.km', { defaultValue: 'km' })} type="number" size="small" />} />
                    <Controller name="kpl" control={control} render={({ field }) => <TextField {...field} label={t('common:units.pcs', { defaultValue: 'kpl' })} type="number" size="small" />} />
                    <Controller name="jako" control={control} render={({ field }) => <TextField {...field} label={t('common:units.hours', { defaultValue: 'h' })} type="number" size="small" />} />
                </Box>

                <Controller name="tievero" control={control} render={({ field }) => <TextField {...field} label={t('consignmentForm:fields.roadToll', { defaultValue: 'Road Toll' })} type="number" size="small" />} />
                <Controller name="lisatiedot" control={control} render={({ field }) => <TextField {...field} label={t('consignmentForm:fields.notes', { defaultValue: 'Notes' })} size="small" multiline rows={2} />} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button variant="contained" onClick={handleSubmit(onSubmit)} fullWidth color="secondary">
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

/* ----------------------------------------------------------------------------------
 * Waybills List Sub-component
 * --------------------------------------------------------------------------------*/
const WaybillsList = ({ fields, onAttemptDelete, onEdit }: { fields: Record<string, any>[], onAttemptDelete: (index: number) => void, onEdit: (index: number) => void }) => {
    const { t } = useTranslation(['consignmentForm']);
    return (
        <Paper variant="outlined" sx={{ p: 2.5, flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>{t('waybillsList.title')}</Typography>
            <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('fields.customer')}</TableCell>
                            <TableCell>{t('table.numberShort')}</TableCell>
                            <TableCell>{t('consignmentForm:fields.m3')}</TableCell>
                            <TableCell>{t('consignmentForm:fields.km')}</TableCell>
                            <TableCell align="right">{t('common:table.action', { defaultValue: 'Action' })}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                    {t('messages.noWaybillsAdded')}
                                </TableCell>
                            </TableRow>
                        )}
                        {fields.map((field, index) => (
                            <TableRow key={field.id} hover sx={{ cursor: 'pointer' }} onClick={() => onEdit(index)}>
                                <TableCell><strong>{field.customerName || '-'}</strong></TableCell>
                                <TableCell>{field.rahtikirjanNumero}</TableCell>
                                <TableCell>{field.m3}</TableCell>
                                <TableCell>{field.km}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); onEdit(index); }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onAttemptDelete(index); }}>
                                        <DeleteIcon fontSize="small" />
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

/* ----------------------------------------------------------------------------------
 * MAIN COMPONENT: ConsignmentDriverForm
 * --------------------------------------------------------------------------------*/
export default function ConsignmentDriverForm({ onBackToListAction, consignmentId }: ConsignmentFormProps) {
    const isEditMode = consignmentId !== null;
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVehicleId } = useDriverSession();
    const [isLoading, setIsLoading] = useState(false);
    const [customers, setCustomers] = useState<ICustomerOption[]>([]);
    const defaultDate = new Date().toISOString().split('T')[0];
    const { t } = useTranslation(['consignmentForm', 'common']);

    const [editingWaybillIndex, setEditingWaybillIndex] = useState<number | null>(null);
    const [waybillToDeleteIndex, setWaybillToDeleteIndex] = useState<number | null>(null);
    const [sendConfirmOpen, setSendConfirmOpen] = useState(false);

    const [pendingFormData, setPendingFormData] = useState<any>(null);

    const methods = useForm<any>({
        defaultValues: { pvm: defaultDate, lisatiedot: '', rahtikirjat: [] },
    });

    const { control, handleSubmit, reset, formState: { isSubmitting }, watch } = methods;
    const { fields, append, remove, update } = useFieldArray({ control, name: 'rahtikirjat' });
    const currentWaybills = watch('rahtikirjat');

    useEffect(() => {
        getCustomerOptions().then(data => setCustomers(data)).catch(() => enqueueSnackbar('Failed to load customers.', { variant: 'warning' }));
    }, [enqueueSnackbar]);

    useEffect(() => {
        if (isEditMode && consignmentId) {
            setIsLoading(true);
            getConsignmentById(consignmentId)
                .then((data) => {
                    const formattedWaybills = (data.rahtikirjat || []).map((wb: any) => ({
                        asiakasId: wb.asiakasId ? String(wb.asiakasId) : '',
                        customerName: wb.customerName || '',
                        rahtiId: wb.rahtiId ?? null,
                        rahtikirjanNumero: wb.rahtikirjanNro ?? '',
                        reitti: wb.reitti ?? '',
                        m3: String(wb.m3 ?? ''),
                        km: String(wb.km ?? ''),
                        kpl: String(wb.kpl ?? ''),
                        jako: String(wb.jako ?? ''),
                        tievero: String(wb.tievero ?? ''),
                        lisatiedot: wb.lisatiedot ?? ''
                    }));

                    reset({
                        ...data,
                        pvm: data.pvm ? data.pvm.split('T')[0] : defaultDate,
                        lisatiedot: data.lisatiedot ?? '',
                        rahtikirjat: formattedWaybills
                    });
                })
                .catch((err) => {
                    console.error(err);
                    enqueueSnackbar(t('errors.loadFailed'), { variant: 'error' });
                })
                .finally(() => setIsLoading(false));
        } else {
            reset({ pvm: defaultDate, lisatiedot: '', rahtikirjat: [] });
        }
    }, [consignmentId, isEditMode, reset, enqueueSnackbar, defaultDate, t]);

    const onSubmitProcess = async (formData: any, status: 'Draft' | 'Completed') => {
        if (!selectedVehicleId) {
            enqueueSnackbar(t('errors.vehicleNotSelected'), { variant: 'error' });
            return;
        }

        try {
            // Aggregates
            const totalM3 = formData.rahtikirjat.reduce((sum: number, wb: any) => sum + (Number(wb.m3) || 0), 0);
            const totalKm = formData.rahtikirjat.reduce((sum: number, wb: any) => sum + (Number(wb.km) || 0), 0);
            const totalKpl = formData.rahtikirjat.reduce((sum: number, wb: any) => sum + (Number(wb.kpl) || 0), 0);
            const totalJako = formData.rahtikirjat.reduce((sum: number, wb: any) => sum + (Number(wb.jako) || 0), 0);

            // If empty, set primary customer to 0 or null (backend handles this)
            const primaryCustomer = formData.rahtikirjat.length > 0 ? formData.rahtikirjat[0].asiakasId : 0;

            const payload = {
                vehicleId: selectedVehicleId,
                asiakasId: primaryCustomer,
                pvm: formData.pvm,
                lisatiedot: formData.lisatiedot,
                m3: totalM3,
                km: totalKm,
                kpl: totalKpl,
                tunnit: totalJako,
                status: status,
                rahtikirjat: formData.rahtikirjat.map((waybill: any) => ({
                    ...waybill,
                    m3: Number(waybill.m3) || 0,
                    km: Number(waybill.km) || 0,
                    kpl: Number(waybill.kpl) || 0,
                    jako: Number(waybill.jako) || 0,
                    tievero: Number(waybill.tievero) || 0,
                }))
            };

            if (isEditMode) {
                await updateConsignment(consignmentId!, payload as any);
                enqueueSnackbar(status === 'Completed' ? t('toasts.loadSent') : t('toasts.draftSaved'), { variant: 'success' });
            } else {
                await createConsignment(payload as any);
                enqueueSnackbar(status === 'Completed' ? t('toasts.loadSent') : t('toasts.draftSaved'), { variant: 'success' });
            }
            onBackToListAction();
        } catch (error: any) {
            console.error("API Error Response:", error.response?.data || error);
            enqueueSnackbar(error.response?.data?.message || t('errors.submissionFailed'), { variant: 'error' });
        }
    };

    // 1. SAVE DRAFT Button Handler
    const handleSaveDraft = handleSubmit((data) => {
        // FIX: REMOVED Validation for empty waybills on draft
        onSubmitProcess(data, 'Draft');
    });

    // 2. SEND LOAD Button Handler
    const handleSendLoadClick = handleSubmit((data) => {
        // Validation remains for sending
        if (fields.length === 0) {
            enqueueSnackbar(t('validation.atLeastOneWaybill'), { variant: 'warning' });
            return;
        }
        setPendingFormData(data);
        setSendConfirmOpen(true);
    });

    const handleConfirmSend = () => {
        if (pendingFormData) {
            setSendConfirmOpen(false);
            onSubmitProcess(pendingFormData, 'Completed');
        }
    };
    const handleCancelSend = () => {
        setSendConfirmOpen(false);
        setPendingFormData(null);
    };

    const handleEditWaybill = (index: number) => { setEditingWaybillIndex(index); };
    const handleUpdateWaybill = (data: IExtendedRahtikirjaItem) => {
        if (editingWaybillIndex !== null) {
            update(editingWaybillIndex, data);
            setEditingWaybillIndex(null);
        }
    };
    const handleCancelEdit = () => { setEditingWaybillIndex(null); };

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
            <Box component="form" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: { xs: 1, sm: 2 }, flexGrow: 1, overflowY: 'auto' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 2, alignItems: 'start' }}>

                        <Paper variant="outlined" sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" gutterBottom>{t('sections.loadDetails')}</Typography>
                            <Stack spacing={2.5} sx={{ flexGrow: 1 }}>
                                <Controller name="pvm" control={control} render={({ field }) => <TextField {...field} label={t('fields.date')} type="date" size="small" InputLabelProps={{ shrink: true }} />} />

                                <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 1, border: '1px dashed #1976d2' }}>
                                    <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>{t('labels.summary')}</Typography>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                                        <Typography variant="body2">{t('common:units.m3', { defaultValue: 'm³' })}: <strong>{(currentWaybills || []).reduce((s: number, i: any) => s + (Number(i.m3) || 0), 0).toFixed(2)}</strong></Typography>
                                        <Typography variant="body2">{t('consignmentForm:fields.waybills', { defaultValue: 'Waybills' })}: <strong>{fields.length}</strong></Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Paper>

                        <Box sx={{ display: 'grid', gap: 2, minWidth: 0 }}>
                            <Stack spacing={2} sx={{ height: '100%' }}>
                                <WaybillEditorForm
                                    key={editingWaybillIndex ?? 'new'}
                                    onAddWaybill={(data) => append(data)}
                                    onUpdateWaybill={handleUpdateWaybill}
                                    editingWaybill={editingWaybillIndex !== null ? (fields[editingWaybillIndex] as unknown as IExtendedRahtikirjaItem) : null}
                                    onCancelEdit={handleCancelEdit}
                                    customers={customers}
                                />
                                <WaybillsList fields={fields} onEdit={handleEditWaybill} onAttemptDelete={handleAttemptDelete} />
                            </Stack>
                        </Box>
                    </Box>
                </Box>

                <Paper elevation={3} sx={{ p: 2, borderTop: '1px solid #ddd', flexShrink: 0 }}>
                    <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                        <Button
                            variant="outlined"
                            onClick={onBackToListAction}
                            size="large"
                            color="inherit"
                        >
                            {t('common:buttons.back')}
                        </Button>

                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleSaveDraft}
                                disabled={isSubmitting} // FIX: Removed 'fields.length === 0'
                                size="large"
                                startIcon={<SaveIcon />}
                            >
                                {t('buttons.saveDraft', { defaultValue: 'SAVE DRAFT' })}
                            </Button>

                            <Button
                                variant="contained"
                                color="warning"
                                onClick={handleSendLoadClick}
                                disabled={isSubmitting || fields.length === 0} // Keep validation for Send
                                size="large"
                                startIcon={<SendIcon />}
                                sx={{ px: 3, fontWeight: 'bold' }}
                            >
                                {t('buttons.sendLoad', { defaultValue: 'SEND LOAD' })}
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            </Box>

            <ConfirmationDialog
                open={waybillToDeleteIndex !== null}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title={t('dialog.confirmDeleteTitle')}
                message={t('dialog.confirmDeleteMessage')}
                confirmButtonText={t('common:buttons.delete')}
                confirmButtonColor="error"
            />

            <ConfirmationDialog
                open={sendConfirmOpen}
                onClose={handleCancelSend}
                onConfirm={handleConfirmSend}
                title={t('dialog.confirmSendTitle', { defaultValue: 'Send to Office?' })}
                message={t('dialog.confirmSendMessage', { defaultValue: 'This load will be sent to inspection. Once sent, you cannot edit it anymore. Are you sure?' })}
                confirmButtonText="CONFIRM & SEND"
                confirmButtonColor="warning"
            />
        </FormProvider>
    );
}