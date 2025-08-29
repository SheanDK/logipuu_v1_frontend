// frontend/src/components/map/lists/AutoSelect.tsx
'use client';

import React, { useMemo } from 'react';
import {
    FormControl, InputLabel, Select, MenuItem, Chip, Box, SelectChangeEvent, OutlinedInput
} from '@mui/material';
import { IVehicleBasicInfo } from '@/types';

interface AutoSelectProps {
    selectedAutoIds: number[];
    onSelectionChangeAction: (ids: number[]) => void;
    vehicleList: IVehicleBasicInfo[];
    disabled?: boolean;
}

const AutoSelect: React.FC<AutoSelectProps> = ({ selectedAutoIds, onSelectionChangeAction, vehicleList, disabled = false }) => {
    
    // --- CORRECTION: Remove duplicate vehicles from the list ---
    const uniqueVehicleList = useMemo(() => {
        const seen = new Set();
        return vehicleList.filter(vehicle => {
            const duplicate = seen.has(vehicle.id);
            seen.add(vehicle.id);
            return !duplicate;
        });
    }, [vehicleList]);
    // --- END CORRECTION ---

    const handleChange = (event: SelectChangeEvent<typeof selectedAutoIds>) => {
        const { target: { value } } = event;
        const newValues = typeof value === 'string' ? value.split(',').map(Number) : value;
        onSelectionChangeAction(newValues);
    };


    return (
        <FormControl fullWidth size="small" disabled={disabled}>
            <InputLabel id="vehicles-select-label">All Cars</InputLabel>
            <Select
                labelId="vehicles-select-label"
                multiple
                value={selectedAutoIds}
                onChange={handleChange}
                input={<OutlinedInput id="select-multiple-chip" label="All Cars" sx={{ backgroundColor: 'white' }} />}
                renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => {
                            const vehicleName = vehicleList.find(v => Number(v.id) === id)?.name;
                            return <Chip key={id} label={vehicleName || `ID: ${id}`} size="small" />;
                        })}
                    </Box>
                )}
            >
                {vehicleList.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={Number(vehicle.id)}>
                        {vehicle.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default AutoSelect;