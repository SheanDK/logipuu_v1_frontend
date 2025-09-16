// frontend/src/components/drivers/SelectVehicleModal.tsx
'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Button, FormControl, InputLabel,
    Select, MenuItem, Box, Typography, Stack
} from '@mui/material';
import { IVehicleBasicInfo } from '@/types';

interface SelectVehicleModalProps {
    open: boolean;
    vehicles: IVehicleBasicInfo[];
    onVehicleSelectAction: (vehicleId: string, regNo: string) => void;
}

export default function SelectVehicleModal({ open, vehicles, onVehicleSelectAction }: SelectVehicleModalProps) {
    const [selectedId, setSelectedId] = useState<string>('');

    const handleConfirm = () => {
        const selectedVehicle = vehicles.find(v => v.id === selectedId);
        if (selectedVehicle) {
            onVehicleSelectAction(selectedVehicle.id, selectedVehicle.registrationNo);
        }
    };

    return (
        <Dialog 
            open={open}
            // Prevent closing the modal accidentally
            disableEscapeKeyDown
            PaperProps={{ sx: { minWidth: { xs: '90%', sm: 400 } } }}
        >
            <DialogTitle>Select Your Vehicle for this Session</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography color="text.secondary">
                        Please select the vehicle you will be operating. This can be changed later if needed.
                    </Typography>
                    <FormControl fullWidth required>
                        <InputLabel>Vehicle</InputLabel>
                        <Select
                            value={selectedId}
                            label="Vehicle"
                            onChange={(e) => setSelectedId(e.target.value as string)}
                        >
                            {vehicles.map((v) => (
                                <MenuItem key={v.id} value={v.id}>
                                    {v.registrationNo}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleConfirm}
                        disabled={!selectedId}
                    >
                        Confirm and Start
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}