// frontend/src/components/timber-management/PuulaaniFilterBar.tsx
'use client';

import React from 'react';
import {
    Paper,
    Grid,
    ToggleButtonGroup,
    ToggleButton,
    Autocomplete,
    TextField
} from '@mui/material';
// --- FIX 1: Import the REAL types from the main types file ---
import { IClientBasicInfo, ITimberStackListFilters, IVehicleBasicInfo, IPuutavaraItem } from '@/types';


// --- FIX 2: Update the props interface to use the REAL types ---
interface PuulaaniFilterBarProps {
    filters: ITimberStackListFilters;
    onFilterChangeAction: (name: keyof ITimberStackListFilters, value: string | null) => void;
    clientList: IClientBasicInfo[];
    vehicleList: IVehicleBasicInfo[]; // Use the real vehicle type
    timberTypeList: IPuutavaraItem[]; // Use the real timber type
}

export default function PuulaaniFilterBar({
    filters,
    onFilterChangeAction,
    clientList,
    vehicleList,
    timberTypeList
}: PuulaaniFilterBarProps) {
    return (
        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
            <Grid container spacing={2} alignItems="center">
                {/* Status Filter */}
                <Grid item xs={12} sm={12} md={3}>
                    <ToggleButtonGroup
                        color="error"
                        value={filters.status || 'active'}
                        exclusive
                        onChange={(e, newValue) => { if (newValue !== null) { onFilterChangeAction('status', newValue); } }}
                        aria-label="Status"
                        size="small"
                    >
                        <ToggleButton value="active">Active</ToggleButton>
                        <ToggleButton value="completed">Completed</ToggleButton>
                        <ToggleButton value="all">All</ToggleButton>
                    </ToggleButtonGroup>
                </Grid>

                {/* Customer Filter */}
                <Grid item xs={12} sm={12} md={3} sx={{ minWidth: 120 }}>
                    <Autocomplete
                        options={clientList}
                        getOptionLabel={(option) => option.name}
                        value={clientList.find(c => c.id === filters.clientId) || null}
                        onChange={(event, newValue) => { onFilterChangeAction('clientId', newValue ? String(newValue.id) : null); }}
                        renderInput={(params) => <TextField {...params} label="Customer" size="small" />}
                    />
                </Grid>

                {/* Vehicle Filter */}
                <Grid item xs={12} sm={12} md={3} sx={{ minWidth: 120 }}>
                     <Autocomplete
                        options={vehicleList}
                        // --- FIX 3: Use the correct property 'registrationNo' from IVehicleBasicInfo ---
                        getOptionLabel={(option) => option.registrationNo}
                        value={vehicleList.find(v => v.id === filters.vehicleId) || null}
                        onChange={(event, newValue) => { onFilterChangeAction('vehicleId', newValue ? String(newValue.id) : null); }}
                        renderInput={(params) => <TextField {...params} label="Car" size="small" />}
                    />
                </Grid>

                {/* Timber Type Filter */}
                <Grid item xs={12} sm={12} md={3} sx={{ minWidth: 150 }}>
                    <Autocomplete
                        options={timberTypeList}
                        // --- FIX 4: Use the correct properties from IPuutavaraItem ---
                        getOptionLabel={(option) => option.puutavara} // Use 'puutavara' for the name
                        value={timberTypeList.find(t => String(t.puutavaraNro) === filters.timberTypeId) || null}
                        onChange={(event, newValue) => { onFilterChangeAction('timberTypeId', newValue ? String(newValue.puutavaraNro) : null); }}
                        renderInput={(params) => <TextField {...params} label="Type of timber" size="small" />}
                    />
                </Grid>
            </Grid>
        </Paper>
    );
}