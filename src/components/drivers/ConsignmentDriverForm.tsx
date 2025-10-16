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
import dynamic from 'next/dynamic'; // FIX: Import 'dynamic' from 'next/dynamic'

// FIX: Correctly import the ConfirmationDialog dynamically.
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
            <Typography variant="h6" gutterBottom>{isEditMode ? 'Edit Waybill' : 'New Waybill'}</Typography>
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
                <Controller name="rahtikirjanNumero" control={control} rules={{ required: "Waybill number is required" }} render={({ field, fieldState: { error } }) => <TextField {...field} label="Waybill Number" size="small" error={!!error} helperText={error?.message} />} />
                <Controller name="reitti" control={control} rules={{ required: "Route is required" }} render={({ field, fieldState: { error } }) => <TextField {...field} label="Route" size="small" error={!!error} helperText={error?.message} />} />
                <Grid container spacing={2}>
                    <Grid item xs={4}><Controller name="m3" control={control} render={({ field }) => <TextField {...field} label="m³" type="number" size="small" />} /></Grid>
                    <Grid item xs={4}><Controller name="kpl" control={control} render={({ field }) => <TextField {...field} label="Pcs" type="number" size="small" />} /></Grid>
                    <Grid item xs={4}><Controller name="jako" control={control} render={({ field }) => <TextField {...field} label="Dist" type="number" size="small" />} /></Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={6}><Controller name="km" control={control} render={({ field }) => <TextField {...field} label="Km" type="number" size="small" />} /></Grid>
                    <Grid item xs={6}><Controller name="tievero" control={control} render={({ field }) => <TextField {...field} label="Road Toll" type="number" size="small" />} /></Grid>
                </Grid>
                <Controller name="lisatiedot" control={control} render={({ field }) => <TextField {...field} label="Notes" size="small" multiline rows={2} />} />
            </Stack>
             <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button variant="contained" onClick={handleSubmit(onSubmit)} fullWidth>
                    {isEditMode ? 'Update Waybill' : 'Add Waybill'}
                </Button>
                {isEditMode && (
                    <Button variant="outlined" onClick={onCancelEdit} fullWidth>
                        Cancel
                    </Button>
                )}
            </Stack>
        </Paper>
    );
};

// FIX: The component now receives 'onAttemptDelete' prop instead of 'remove'.
const WaybillsList = ({ fields, onAttemptDelete, onEdit }: { fields: Record<string, any>[], onAttemptDelete: (index: number) => void, onEdit: (index: number) => void }) => {
    return (
        <Paper variant="outlined" sx={{ p: 2.5, flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>Waybills</Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>No.</TableCell>
                            <TableCell>m³</TableCell>
                            <TableCell>Km</TableCell>
                            <TableCell>Pcs</TableCell>
                            <TableCell>Action</TableCell>
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
                .catch(() => enqueueSnackbar('Failed to load consignment.', { variant: 'error' }))
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
                enqueueSnackbar('Consignment updated!', { variant: 'success' });
            } else {
                if (!selectedVehicleId) {
                    enqueueSnackbar('Vehicle not selected.', { variant: 'error' });
                    return;
                }
                const finalPayload = { ...payload, vehicleId: selectedVehicleId };
                await createConsignment(finalPayload);
                enqueueSnackbar('Consignment created!', { variant: 'success' });
            }
            onBackToListAction();
        } catch (error: any) {
            console.error("API Error Response:", error.response?.data || error);
            enqueueSnackbar(error.response?.data?.message || 'Submission failed.', { variant: 'error' });
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
            enqueueSnackbar('Waybill removed.', { variant: 'info' });
        }
    };
    const handleCancelDelete = () => { setWaybillToDeleteIndex(null); };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

     return (
        // FIX: The ConfirmationDialog must be placed OUTSIDE the <form> but INSIDE the FormProvider
        // to have access to the form's state (`fields`).
        <FormProvider {...methods}>
             <Box component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: { xs: 1, sm: 2 }, flexGrow: 1, overflowY: 'auto' }}>
                    <Grid container spacing={2}>
                         <Grid item xs={12} md={4}>
                             <Paper variant="outlined" sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" gutterBottom>Load Details</Typography>
                                <Stack spacing={2.5} sx={{ flexGrow: 1 }}>
                                    <Controller name="pvm" control={control} render={({ field }) => <TextField {...field} label="Date" type="date" size="small" InputLabelProps={{ shrink: true }} />} />
                                    <Controller 
                                        name="asiakasId" 
                                        control={control} 
                                        rules={{ required: 'Customer is required' }} 
                                        render={({ field, fieldState: { error } }) => (
                                            <TextField 
                                                {...field} 
                                                label="Select Customer" 
                                                select 
                                                SelectProps={{ native: true }} 
                                                size="small" 
                                                error={!!error} 
                                                helperText={error?.message} 
                                            >
                                                <option value=""></option>
                                                {/* --- THE FIX IS HERE --- */}
                                                {customers.map((customer) => ( 
                                                    // Use the correct property names from the ICustomerOption interface
                                                    <option key={customer.asiakkaanId} value={customer.asiakkaanId}>
                                                        {customer.asiakkaanNimi}
                                                    </option>
                                                ))}
                                            </TextField>
                                        )}
                                    />
                                    <Controller name="lisatiedot" control={control} render={({ field }) => <TextField {...field} label="Notes" multiline rows={8} fullWidth />} />
                                 </Stack>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={8}>
                           <Stack spacing={2} sx={{height: '100%'}}>
                                <WaybillEditorForm 
                                    key={editingWaybillIndex ?? 'new'}
                                    onAddWaybill={(data) => append(data)}
                                    onUpdateWaybill={handleUpdateWaybill}
                                    editingWaybill={editingWaybillIndex !== null ? fields[editingWaybillIndex] as IRahtikirjaItem : null}
                                    onCancelEdit={handleCancelEdit}
                                />
                                {/* FIX: Only ONE WaybillsList is needed, and it receives the correct 'onAttemptDelete' prop */}
                                <WaybillsList fields={fields} onEdit={handleEditWaybill} onAttemptDelete={handleAttemptDelete} />
                           </Stack>
                        </Grid>
                    </Grid>
                </Box>
                <Paper elevation={3} sx={{ p: 2, borderTop: '1px solid #ddd', flexShrink: 0 }}>
                     <Stack direction="row" spacing={2}>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Save Changes' : 'Send Load')}
                        </Button>
                        <Button variant="outlined" onClick={onBackToListAction}>Back</Button>
                    </Stack>
                </Paper>
            </Box>
            
            <ConfirmationDialog
                open={waybillToDeleteIndex !== null}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirm Waybill Deletion"
                message={`Are you sure you want to remove this waybill? (No: ${waybillToDeleteIndex !== null && fields[waybillToDeleteIndex] ? fields[waybillToDeleteIndex].rahtikirjanNumero : ''})`}
                confirmButtonText="Delete"
                confirmButtonColor="error"
             />
        </FormProvider>
    );
}