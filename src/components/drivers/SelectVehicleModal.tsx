// frontend/src/components/drivers/SelectVehicleModal.tsx
'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Button, FormControl, InputLabel,
    Select, MenuItem, Box, Typography, Stack
} from '@mui/material';
import { IVehicleBasicInfo } from '@/types';
import { useTranslation } from 'react-i18next';

import { CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';

interface SelectVehicleModalProps {
    open: boolean;
    vehicles: IVehicleBasicInfo[];
    onVehicleSelectAction: (vehicleId: string, regNo: string) => Promise<void>;
}

export default function SelectVehicleModal({ open, vehicles, onVehicleSelectAction }: SelectVehicleModalProps) {
    const [selectedId, setSelectedId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslation('selectVehicleModal');

    const handleConfirm = async () => {
        const selectedIdToUse = selectedId;
        const selectedVehicle = vehicles.find(v => v.id === selectedIdToUse);
        if (selectedVehicle) {
            setIsSubmitting(true);
            try {
                await onVehicleSelectAction(selectedVehicle.id, selectedVehicle.registrationNo);
            } catch (error: any) {
                const errorMsg = error.response?.data?.message || error.message || "Failed to select vehicle.";
                enqueueSnackbar(errorMsg, { variant: 'error' });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <Dialog
            open={open}
            // Prevent closing the modal accidentally
            disableEscapeKeyDown
            PaperProps={{ sx: { minWidth: { xs: '90%', sm: 400 } } }}
            aria-labelledby="select-vehicle-title"
            aria-describedby="select-vehicle-description"
        >
            <DialogTitle id="select-vehicle-title">{t('selectVehicleTitle')}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography id="select-vehicle-description" color="text.secondary">
                        {t('selectVehicleHelp')}
                    </Typography>
                    <FormControl fullWidth required>
                        <InputLabel id="vehicle-label">{t('vehicleLabel')}</InputLabel>
                        <Select
                            value={selectedId}
                            label={t('vehicleLabel')}
                            onChange={(e) => setSelectedId(e.target.value as string)}
                            inputProps={{ 'aria-label': t('vehicleAria') }}
                            disabled={isSubmitting}
                        >
                            {vehicles.map((v) => {
                                const isInUse = !!(v.currentDriverTunnus && v.currentDriverTunnus !== "" && v.currentDriverTunnus !== null);
                                
                                return (
                                    <MenuItem key={v.id} value={v.id} disabled={isInUse}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                            <Typography>{v.registrationNo}</Typography>
                                            {isInUse && (
                                                <Typography variant="caption" sx={{ color: 'error.main', fontStyle: 'italic', ml: 2 }}>
                                                    {t('alreadyInUse', { defaultValue: 'In use by: ' })}{v.currentDriverName}
                                                </Typography>
                                            )}
                                        </Box>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleConfirm}
                        disabled={!selectedId || isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isSubmitting ? t('pleaseWait', { defaultValue: 'Please wait...' }) : t('confirmAndStart')}
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}