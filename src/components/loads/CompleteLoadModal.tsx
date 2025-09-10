// frontend/src/components/loads/CompleteLoadModal.tsx
'use client';

import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField,
    Stack, Typography, IconButton, CircularProgress, Alert
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import CloseIcon from '@mui/icons-material/Close';

interface CompleteLoadFormData {
    actualM3: number;
    actualKm: number;
}

interface CompleteLoadModalProps {
    open: boolean;
    onCloseAction: () => void;
    onSubmitAction: (data: CompleteLoadFormData) => Promise<void>;
    isSubmitting: boolean;
    initialVolume: number;
}

const schema = yup.object({
    actualM3: yup
        .number()
        .typeError('Must be a valid number')
        .required('Actual volume is required')
        .min(0, 'Volume cannot be negative'),
    actualKm: yup
        .number()
        .typeError('Must be a valid number')
        .required('Actual kilometers are required')
        .min(0, 'Kilometers cannot be negative'),
});

export default function CompleteLoadModal({
    open,
    onCloseAction,
    onSubmitAction,
    isSubmitting,
    initialVolume
}: CompleteLoadModalProps) {

    const { control, handleSubmit, formState: { errors, isValid } } = useForm<CompleteLoadFormData>({
        resolver: yupResolver(schema),
        mode: 'onChange',
        defaultValues: {
            actualM3: initialVolume, // Pre-fill with the assigned volume
            actualKm: 0,
        }
    });

    const handleFormSubmit: SubmitHandler<CompleteLoadFormData> = (data) => {
        onSubmitAction(data);
    };

    return (
        <Dialog open={open} onClose={onCloseAction} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">Complete Trip</Typography>
                <IconButton aria-label="close" onClick={onCloseAction} sx={{ color: (theme) => theme.palette.grey[500] }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Box component="form" id="complete-load-form" onSubmit={handleSubmit(handleFormSubmit)}>
                <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Please enter the final metrics for this trip before completing.
                    </Alert>
                    <Stack spacing={2.5}>
                        <Controller
                            name="actualM3"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    autoFocus
                                    label="Actual Volume Unloaded (m³)"
                                    type="number"
                                    fullWidth
                                    required
                                    error={!!errors.actualM3}
                                    helperText={errors.actualM3?.message}
                                    inputProps={{ step: "0.01" }} // Allows decimal input
                                />
                            )}
                        />
                        <Controller
                            name="actualKm"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Actual Kilometers Driven (km)"
                                    type="number"
                                    fullWidth
                                    required
                                    error={!!errors.actualKm}
                                    helperText={errors.actualKm?.message}
                                />
                            )}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                     <Button onClick={onCloseAction} disabled={isSubmitting}>Cancel</Button>
                     <Button 
                        type="submit" 
                        form="complete-load-form" 
                        variant="contained" 
                        color="success"
                        disabled={isSubmitting || !isValid}
                    >
                        {isSubmitting ? <CircularProgress size={24} color="inherit"/> : 'Confirm & Complete'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}