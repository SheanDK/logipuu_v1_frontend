// frontend/src/components/loads/EditConsignmentModal.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress } from '@mui/material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { updateLoad } from '@/services/loadService';
import { useSnackbar } from 'notistack';

interface IExtendedRahtikirjaItem {
    id?: number; 
    asiakasId: string;
    customerName?: string;
    rahtikirjanNumero: string;
    reitti: string;
    m3: string | number;
    km: string | number;
    kpl: string | number;
    jako: string | number;
    tievero: string | number;
    lisatiedot: string;
}

interface EditConsignmentModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSaveSuccessAction: (msg: string) => void;
    loadData: any; 
    currentUser: any;
}

export default function EditConsignmentModal({ open, onCloseAction, onSaveSuccessAction, loadData, currentUser }: EditConsignmentModalProps) {
    const { enqueueSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const methods = useForm({
        defaultValues: {
            pvm: '',
            lisatiedot: '',
            rahtikirjat: [] as IExtendedRahtikirjaItem[]
        }
    });
    const { control, handleSubmit, reset } = methods;
    const { fields } = useFieldArray({ control, name: 'rahtikirjat' });

    useEffect(() => {
        if (loadData && open) {
            const formattedWaybills = (loadData.rahtikirjat || []).map((wb: any) => ({
                id: wb.rahtiId,
                asiakasId: wb.asiakasId ? String(wb.asiakasId) : '',
                customerName: wb.customerName || '',
                rahtikirjanNumero: wb.rahtikirjanNro || '',
                reitti: wb.reitti || '',
                m3: wb.m3, km: wb.km, kpl: wb.kpl, jako: wb.jako, tievero: wb.tievero,
                lisatiedot: wb.lisatiedot || ''
            }));

            reset({
                pvm: loadData.pvm ? new Date(loadData.pvm).toISOString().split('T')[0] : '', 
                lisatiedot: loadData.lisatiedot || '',
                rahtikirjat: formattedWaybills
            });
        }
    }, [loadData, open, reset]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            // 1. Calculate Aggregates
            const totalM3 = data.rahtikirjat.reduce((sum: number, wb: any) => sum + (Number(wb.m3) || 0), 0);
            const totalKm = data.rahtikirjat.reduce((sum: number, wb: any) => sum + (Number(wb.km) || 0), 0);
            const totalKpl = data.rahtikirjat.reduce((sum: number, wb: any) => sum + (Number(wb.kpl) || 0), 0);
            const totalJako = data.rahtikirjat.reduce((sum: number, wb: any) => sum + (Number(wb.jako) || 0), 0);
            

            // 2. Determine Primary Customer
            // Backend expects an integer. Use 0 or null if missing.
            let primaryCustomer = null;
            if (data.rahtikirjat.length > 0 && data.rahtikirjat[0].asiakasId) {
                primaryCustomer = parseInt(data.rahtikirjat[0].asiakasId, 10);
            } else if (loadData.asiakasId) {
                primaryCustomer = parseInt(loadData.asiakasId, 10);
            }

            // 3. Construct Payload
            const payload = {
                tyyppi: 1, 
                pvm: data.pvm, // YYYY-MM-DD string is accepted by @IsDateString or permissive DTO
                lisatiedot: data.lisatiedot,
                asiakasId: isNaN(primaryCustomer!) ? null : primaryCustomer,
                
                // Include other required IDs from original data to satisfy strict validators if any
                kalustoNro: loadData.kalusto_nro || loadData.kalustoNro,
                kuljId: loadData.kulj_id || loadData.kuljId,

                m3: totalM3,
                km: totalKm,
                kpl: totalKpl,
                tunnit: totalJako,
                
                // Waybills Array
                rahtikirjat: data.rahtikirjat.map((wb: any) => ({
                    asiakasId: parseInt(wb.asiakasId, 10) || null,
                    rahtikirjanNumero: wb.rahtikirjanNumero,
                    reitti: wb.reitti,
                    m3: Number(wb.m3),
                    km: Number(wb.km),
                    kpl: Number(wb.kpl),
                    jako: Number(wb.jako),
                    tievero: Number(wb.tievero),
                    lisatiedot: wb.lisatiedot
                }))
            };

            console.log("Sending Payload:", payload); // Verify payload in console

            await updateLoad(loadData.kuormaId, payload, currentUser); 
            onSaveSuccessAction('Consignment updated successfully'); 
            
        } catch (error: any) {
            console.error("Update Error:", error.response?.data || error);
            enqueueSnackbar(error.response?.data?.message || 'Update failed', { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onCloseAction} maxWidth="md" fullWidth>
            <DialogTitle>Edit Consignment #{loadData?.kuormaId}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <Controller name="pvm" control={control} render={({ field }) => <TextField {...field} type="date" label="Date" size="small" InputLabelProps={{ shrink: true }} />} />
                        <Controller name="lisatiedot" control={control} render={({ field }) => <TextField {...field} label="Global Notes" size="small" />} />
                    </Box>

                    <Typography variant="subtitle2">Waybills ({fields.length})</Typography>
                    <TableContainer sx={{ border: '1px solid #eee', maxHeight: 300 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell width="25%">Customer</TableCell>
                                    <TableCell width="20%">Waybill #</TableCell>
                                    <TableCell width="15%">M3</TableCell>
                                    <TableCell width="20%">Route</TableCell>
                                    <TableCell width="20%">Notes</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {fields.map((wb, idx) => (
                                    <TableRow key={wb.id || idx}>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: '500' }}>
                                                {wb.customerName || 'Unknown Customer'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Controller name={`rahtikirjat.${idx}.rahtikirjanNumero`} control={control} render={({field}) => <TextField {...field} size="small" variant="standard" />} />
                                        </TableCell>
                                        <TableCell>
                                            <Controller name={`rahtikirjat.${idx}.m3`} control={control} render={({field}) => <TextField {...field} size="small" variant="standard" type="number" />} />
                                        </TableCell>
                                        <TableCell>
                                            <Controller name={`rahtikirjat.${idx}.reitti`} control={control} render={({field}) => <TextField {...field} size="small" variant="standard" />} />
                                        </TableCell>
                                        <TableCell>
                                            <Controller name={`rahtikirjat.${idx}.lisatiedot`} control={control} render={({field}) => <TextField {...field} size="small" variant="standard" />} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCloseAction} disabled={isSubmitting}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}