// frontend/src/components/drivers/ConsignmentDriverForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, TextField, Stack, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Divider } from '@mui/material';
import { Grid } from '@mui/material';
import { useForm, useFieldArray, Controller, FormProvider, useFormContext } from 'react-hook-form';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { getConsignmentById, createConsignment, updateConsignment } from '@/services/consignmentDriverService';
import { IConsignmentForm, IRahtikirjaItem } from '@/types';

// Middle Column: Form for adding a single new waybill
const NewWaybillForm = ({ onAddWaybill }: { onAddWaybill: (data: IRahtikirjaItem) => void }) => {
    // This form is temporary and just for adding items to the main form's array
    const methods = useForm<IRahtikirjaItem>({
        defaultValues: { rahtikirjanNumero: '', reitti: '', m3: '', km: '', kpl: '', jako: '' }
    });

    const { handleSubmit, reset, control } = methods;

    const handleAdd = (data: IRahtikirjaItem) => {
        onAddWaybill(data);
        reset(); // Clear the form after adding
    };

    return (
        <Paper variant="outlined" sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f7f9fc' }}>
            <Typography variant="h6" gutterBottom>Uusi rahtikirja</Typography>
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
                <Controller name="rahtikirjanNumero" control={control} render={({ field }) => <TextField {...field} label="Rahtikirjan numero" size="small" />} />
                <Controller name="reitti" control={control} render={({ field }) => <TextField {...field} label="Ajoreitti" size="small" />} />
                <Grid container spacing={2}>
                    <Grid item xs={4}><Controller name="m3" control={control} render={({ field }) => <TextField {...field} label="m3" type="number" size="small" />} /></Grid>
                    <Grid item xs={4}><Controller name="kpl" control={control} render={({ field }) => <TextField {...field} label="Kpl" type="number" size="small" />} /></Grid>
                    <Grid item xs={4}><Controller name="jako" control={control} render={({ field }) => <TextField {...field} label="Jako" type="number" size="small" />} /></Grid>
                </Grid>
                 <Controller name="km" control={control} render={({ field }) => <TextField {...field} label="Km" type="number" size="small" />} />
            </Stack>
            <Button variant="contained" onClick={handleSubmit(handleAdd)} sx={{ mt: 2, backgroundColor: '#0d47a1' }}>Lisää rahtikirja</Button>
        </Paper>
    );
};

// Right Column: Table of added waybills
const WaybillsList = () => {
    const { control } = useFormContext<IConsignmentForm>(); // Connects to the main form
    const { fields, remove } = useFieldArray({ control, name: 'rahtikirjat' });

    return (
        <Paper variant="outlined" sx={{ p: 2.5, height: '100%', backgroundColor: '#f7f9fc' }}>
            <Typography variant="h6" gutterBottom>Rahtikirjat</Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead><TableRow><TableCell>Nro</TableCell><TableCell>m3</TableCell><TableCell>Km</TableCell><TableCell>Kpl</TableCell><TableCell></TableCell></TableRow></TableHead>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell>{field.rahtikirjanNumero}</TableCell>
                                <TableCell>{field.m3}</TableCell>
                                <TableCell>{field.km}</TableCell>
                                <TableCell>{field.kpl}</TableCell>
                                <TableCell align="right"><IconButton size="small" color="error" onClick={() => remove(index)}><DeleteIcon /></IconButton></TableCell>
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
    const [isLoading, setIsLoading] = useState(false);

    // This is the main form that holds all the data to be submitted
    const methods = useForm<IConsignmentForm>({
        defaultValues: { asiakasId: null, pvm: new Date().toISOString().split('T')[0], lisatiedot: '', rahtikirjat: [] },
    });

    const { control, handleSubmit, reset, formState: { isSubmitting } } = methods;
    const { append } = useFieldArray({ control, name: 'rahtikirjat' });

    useEffect(() => {
        if (isEditMode) {
            setIsLoading(true);
            getConsignmentById(consignmentId)
                .then((data) => reset(data))
                .catch(() => enqueueSnackbar('Failed to load consignment data.', { variant: 'error' }))
                .finally(() => setIsLoading(false));
        }
    }, [consignmentId, isEditMode, reset, enqueueSnackbar]);

    const onFormSubmit = async (data: IConsignmentForm) => {
        try {
            if (isEditMode) {
                await updateConsignment(consignmentId, data);
                enqueueSnackbar('Consignment updated!', { variant: 'success' });
            } else {
                await createConsignment(data);
                enqueueSnackbar('Consignment created!', { variant: 'success' });
            }
            onBackToListAction();
        } catch (error) {
            enqueueSnackbar('Submission failed.', { variant: 'error' });
        }
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    return (
        <FormProvider {...methods}>
            <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#eef2f6' }}>
                <Box component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ p: 2, flexGrow: 1 }}>
                    <Grid container spacing={2} sx={{ height: '100%' }}>
                        
                        {/* Left Column: Main Kuorma Details */}
                        <Grid item xs={12} md={3}>
                            <Paper variant="outlined" sx={{ p: 2.5, height: '100%', backgroundColor: '#f7f9fc' }}>
                                <Typography variant="h6" gutterBottom>Kuorma</Typography>
                                <Stack spacing={2.5}>
                                    <Controller name="pvm" control={control} render={({ field }) => <TextField {...field} label="Päivämäärä" type="date" size="small" InputLabelProps={{ shrink: true }} />} />
                                    <Controller name="asiakasId" control={control} rules={{ required: true }} render={({ field }) => <TextField {...field} label="Valitse asiakas" select SelectProps={{ native: true }} size="small"><option value=""></option><option value="1">Scanpole Oy Kotimaa</option></TextField>} />
                                    <Controller name="lisatiedot" control={control} render={({ field }) => <TextField {...field} label="Lisätiedot" multiline rows={6} fullWidth />} />
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* Middle Column: Form to add a new waybill */}
                        <Grid item xs={12} md={5}><NewWaybillForm onAddWaybill={(data) => append(data)} /></Grid>

                        {/* Right Column: List of added waybills */}
                        <Grid item xs={12} md={4}><WaybillsList /></Grid>
                    </Grid>
                </Box>
                
                <Paper elevation={3} sx={{ p: 2, borderTop: '1px solid #ccc' }}>
                     <Stack direction="row" spacing={2}>
                        <Button type="submit" variant="contained" startIcon={isSubmitting ? <CircularProgress size={20}/> : <SaveIcon />} disabled={isSubmitting} sx={{ backgroundColor: '#0d47a1' }} onClick={handleSubmit(onFormSubmit)}>
                            {isEditMode ? 'Tallenna muutokset' : 'Lähetä'}
                        </Button>
                        <Button variant="outlined" onClick={onBackToListAction}>Palaa</Button>
                    </Stack>
                </Paper>
            </Box>
        </FormProvider>
    );
}