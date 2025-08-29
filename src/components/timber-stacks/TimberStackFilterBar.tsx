// frontend/src/components/timber-stacks/TimberStackFilterBar.tsx
'use client';

import React from 'react';
import {
    FormControl, Autocomplete, TextField, Paper, Grid,
    RadioGroup, FormControlLabel, Radio, Typography
} from '@mui/material';
import { IMapFilterState, IClientBasicInfo, IVehicleBasicInfo } from '../../types';

interface TimberStackFilterBarProps {
    filters: IMapFilterState;
    onFilterChange: (name: keyof IMapFilterState, value: any) => void;
    clientList: IClientBasicInfo[];
    vehicleList: IVehicleBasicInfo[];
    isLoading: boolean;
}

const TimberStackFilterBar: React.FC<TimberStackFilterBarProps> = ({
    filters, onFilterChange, clientList, vehicleList, isLoading,
}) => {

    const handleCustomerChange = (_event: any, newValue: IClientBasicInfo | null) => {
        console.log("FilterBar: Customer changed to:", newValue);
        onFilterChange('clientId', newValue ? newValue.id : null);
    };

    const handleVehicleChange = (_event: any, newValue: IVehicleBasicInfo | null) => {
        console.log("FilterBar: Vehicle changed to:", newValue);
        onFilterChange('vehicleId', newValue ? newValue.id : null);
    };

    return (
        <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        Filter options:
                    </Typography>
                </Grid>
                <Grid item>
                    <FormControl component="fieldset">
                        <RadioGroup row name="status" value={filters.status}
                            onChange={(e) => onFilterChange('status', e.target.value as 'all' | 'active')}
                        >
                            <FormControlLabel value="all" control={<Radio size="small" />} label="All" disabled={isLoading} />
                            <FormControlLabel value="active" control={<Radio size="small" />} label="Active" disabled={isLoading} />
                        </RadioGroup>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                    {/* --- CORRECTION FOR CUSTOMER FILTER --- */}
                    <Autocomplete 
                        size="small"
                        options={clientList} 
                        getOptionLabel={(option) => option.name || ''} 
                        // Find the selected object from the list to pass as the value
                        value={clientList.find(c => c.id === filters.clientId) || null} 
                        onChange={(_event, newValue) => {
                            // When an item is selected (newValue is an object) or cleared (newValue is null),
                            // call onFilterChange with the new ID or null.
                            onFilterChange('clientId', newValue ? newValue.id : null);
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        disabled={isLoading} 
                        renderInput={(params) => <TextField {...params} label="Customer" variant="outlined" />} 
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                    {/* --- CORRECTION FOR VEHICLE FILTER --- */}
                    <Autocomplete 
                        size="small"
                        options={vehicleList} 
                        getOptionLabel={(option) => option.name || ''} 
                        value={vehicleList.find(v => v.id === filters.vehicleId) || null} 
                        onChange={(_event, newValue) => {
                            onFilterChange('vehicleId', newValue ? newValue.id : null);
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        disabled={isLoading} 
                        renderInput={(params) => <TextField {...params} label="Car" variant="outlined" />} 
                    />
                </Grid>
            </Grid>
        </Paper>
    );
};

export default TimberStackFilterBar;