// frontend/src/components/map/dialogs/DetailsDialog.tsx
'use client';

import React, { useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
    FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel,
    FormHelperText, IconButton, Typography, Stack, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { IClientBasicInfo, PuulaaniBasicDetailsFormData } from '@/types';

interface DetailsDialogProps {
    open: boolean;
    onCancelAction: () => void;
    onNextAction: (data: PuulaaniBasicDetailsFormData) => void;
    clientList: IClientBasicInfo[];
}

const detailsSchema = yup.object({
    name: yup.string().required('Object Name is required'),
    clientId: yup.string().nullable().required('Customer is required'),
    dispatchOrderNo: yup.string().ensure().default(''),
    isActive: yup.boolean().default(true),
    isCompleted: yup.boolean().default(false),
    additionalInfo: yup.string().ensure().default(''),
});

export default function DetailsDialog({ open, onCancelAction, onNextAction, clientList }: DetailsDialogProps) {
    
    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<PuulaaniBasicDetailsFormData>({
        resolver: yupResolver(detailsSchema) as any,
        defaultValues: { name: '', clientId: null, dispatchOrderNo: '', isActive: true, isCompleted: false, additionalInfo: '' }
    });

    useEffect(() => {
        if (open) {
            // Reset to default values every time the modal opens
            reset({ name: '', clientId: null, dispatchOrderNo: '', isActive: true, isCompleted: false, additionalInfo: '' });
        }
    }, [open, reset]);

    const onSubmit: SubmitHandler<PuulaaniBasicDetailsFormData> = (data) => {
        onNextAction(data);
    };

    return (
        <Dialog open={open} onClose={onCancelAction} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">Create New Puulaani (Step 1)</Typography>
                <IconButton aria-label="close" onClick={onCancelAction} sx={{ color: (theme) => theme.palette.grey[500] }}><CloseIcon /></IconButton>
            </DialogTitle>
            <Box component="form" id="basic-details-form" onSubmit={handleSubmit(onSubmit)}>
                <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack spacing={2.5}>
                        <Controller name="name" control={control} render={({ field }) => (
                            <TextField {...field} label="Object Name" fullWidth required autoFocus error={!!errors.name} helperText={errors.name?.message} />
                        )}/>
                        
                        <FormControl fullWidth required error={!!errors.clientId}>
                            <InputLabel>Customer</InputLabel>
                            <Controller name="clientId" control={control} render={({ field }) => (
                                <Select {...field} label="Customer" value={field.value || ''}>
                                    {clientList.map((c) => ( <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem> ))}
                                </Select>
                            )}/>
                            {errors.clientId && <FormHelperText>{errors.clientId.message}</FormHelperText>}
                        </FormControl>

                        <Controller name="dispatchOrderNo" control={control} render={({ field }) => (
                            <TextField {...field} value={field.value ?? ''} label="Driving Order No." fullWidth />
                        )}/>
                        
                        <Controller name="additionalInfo" control={control} render={({ field }) => (
                            <TextField {...field} value={field.value ?? ''} label="Additional Information" multiline rows={3} fullWidth />
                        )}/>

                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>Status</Typography>
                            <FormControlLabel control={<Controller name="isActive" control={control} render={({ field }) => <Checkbox {...field} checked={!!field.value} />}/>} label="Active" />
                            <FormControlLabel control={<Controller name="isCompleted" control={control} render={({ field }) => <Checkbox {...field} checked={!!field.value} />}/>} label="Ready" />
                        </Box>

                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={onCancelAction}>Cancel</Button>
                    <Button type="submit" form="basic-details-form" variant="contained" disabled={!isValid}>
                        Save & Next
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}