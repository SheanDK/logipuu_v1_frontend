// frontend/src/components/loads/EditConsignmentModal.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Box, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useForm, useFieldArray, Controller, FormProvider } from 'react-hook-form';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { updateLoad } from '@/services/loadService';
import { getCustomerOptions, ICustomerOption } from '@/services/customerService';
import { useSnackbar } from 'notistack';

// Reusing types or define locally
interface IExtendedRahtikirjaItem {
    id?: number; // rahtiId from backend
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
    loadData: any; // Full load object with rahtikirjat
    currentUser: any;
}

export default function EditConsignmentModal({ open, onCloseAction, onSaveSuccessAction, loadData, currentUser }: EditConsignmentModalProps) {
    const { enqueueSnackbar } = useSnackbar();
    const [customers, setCustomers] = useState<ICustomerOption[]>([]);
    
    // Form Setup
    const methods = useForm({
        defaultValues: {
            pvm: '',
            lisatiedot: '',
            rahtikirjat: [] as IExtendedRahtikirjaItem[]
        }
    });
    const { control, handleSubmit, reset, watch } = methods;
    const { fields, append, remove, update } = useFieldArray({ control, name: 'rahtikirjat' });

    // Load Customers
    useEffect(() => {
        getCustomerOptions().then(setCustomers);
    }, []);

    // Load Data into Form
    useEffect(() => {
        if (loadData) {
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
                pvm: loadData.pvm ? loadData.pvm.split('T')[0] : '',
                lisatiedot: loadData.lisatiedot || '',
                rahtikirjat: formattedWaybills
            });
        }
    }, [loadData, reset]);

    const onSubmit = async (data: any) => {
        try {
            // Calculate Aggregates
            const totalM3 = data.rahtikirjat.reduce((sum: number, wb: any) => sum + (Number(wb.m3) || 0), 0);
            const totalKm = data.rahtikirjat.reduce((sum: number, wb: any) => sum + (Number(wb.km) || 0), 0);
            // ... calculate others if needed

            // Payload for Office Update
            // Note: Reuse the same 'updateLoad' service or create a specific one if payload differs greatly
            const payload = {
                pvm: new Date(data.pvm),
                lisatiedot: data.lisatiedot,
                m3: totalM3,
                km: totalKm,
                // We need to send the full waybill list to replace existing ones
                rahtikirjat: data.rahtikirjat.map((wb: any) => ({
                    ...wb,
                    m3: Number(wb.m3),
                    km: Number(wb.km)
                    // ... ensure all fields are converted
                }))
            };

            // You might need to update 'updateLoad' in loadService to handle nested 'rahtikirjat' update
            // Or use the consignmentDriverService's update logic if shared.
            // For now assuming updateLoad can handle it or you create updateConsignmentOffice
            
            // Using the existing updateLoad might strip waybills if not handled in backend.
            // Ensure backend 'updateLoad' supports updating children!
            // If not, use a specific endpoint.
            
            await updateLoad(loadData.kuormaId, payload, currentUser); 
            onSaveSuccessAction('Consignment updated successfully');
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Update failed', { variant: 'error' });
        }
    };

    return (
        <Dialog open={open} onClose={onCloseAction} maxWidth="md" fullWidth>
            <DialogTitle>Edit Consignment #{loadData?.kuormaId}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    {/* Load Level Fields */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <Controller name="pvm" control={control} render={({ field }) => <TextField {...field} type="date" label="Date" size="small" InputLabelProps={{ shrink: true }} />} />
                        <Controller name="lisatiedot" control={control} render={({ field }) => <TextField {...field} label="Global Notes" size="small" />} />
                    </Box>

                    {/* Waybill List (Simplified for brevity - can use the same sub-components as driver if exported) */}
                    <Typography variant="subtitle2">Waybills ({fields.length})</Typography>
                    <TableContainer sx={{ border: '1px solid #eee', maxHeight: 300 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Waybill #</TableCell>
                                    <TableCell>M3</TableCell>
                                    <TableCell>Route</TableCell>
                                    {/* Add Actions if editing lines is allowed here */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {fields.map((wb, idx) => (
                                    <TableRow key={wb.id || idx}>
                                        <TableCell>
                                            {/* Render Input or Text based on edit mode - for now inputs */}
                                            <Controller 
                                                name={`rahtikirjat.${idx}.asiakasId`} 
                                                control={control} 
                                                render={({field}) => (
                                                    <TextField {...field} select SelectProps={{ native: true }} size="small" variant="standard">
                                                        <option value=""></option>
                                                        {customers.map(c => <option key={c.asiakkaanId} value={c.asiakkaanId}>{c.asiakkaanNimi}</option>)}
                                                    </TextField>
                                                )} 
                                            />
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
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    
                    {/* Add Waybill Button could go here */}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCloseAction}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit(onSubmit)}>Save</Button>
            </DialogActions>
        </Dialog>
    );
}