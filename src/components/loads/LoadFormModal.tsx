// frontend/src/components/loads/LoadFilterBar.tsx
'use client';

import React from 'react';
import { 
    Grid, FormControl, InputLabel, Select, MenuItem,
    IconButton, InputAdornment, Tooltip 
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { IClientBasicInfo, IVehicleBasicInfo, IDriver } from '@/types';

export interface ILoadFilters {
    asiakasId: string;
    kalustoNro: string;
    kuljId: string;
}

interface LoadFilterBarProps {
    filters: ILoadFilters;
    onFilterChange: (name: keyof ILoadFilters, value: string) => void;
    clientList: IClientBasicInfo[];
    vehicleList: IVehicleBasicInfo[];
    driverList: IDriver[];
}

export default function LoadFilterBar({
    filters,
    onFilterChange,
    clientList,
    vehicleList,
    driverList,
}: LoadFilterBarProps) {
    
    const handleSelectChange = (event: any) => {
        const { name, value } = event.target;
        onFilterChange(name as keyof ILoadFilters, value);
    };

    const handleClearFilter = (e: React.MouseEvent, name: keyof ILoadFilters) => {
        e.stopPropagation();
        onFilterChange(name, '');
    };

    return (
        <Grid container spacing={2} alignItems="center">
            {/* --- FIX: Updated Grid item props for better responsiveness --- */}
            <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
                    <InputLabel>Customer</InputLabel>
                    <Select
                        name="asiakasId"
                        value={filters.asiakasId}
                        label="Customer"
                        onChange={handleSelectChange}
                        endAdornment={
                            filters.asiakasId && (
                                <InputAdornment position="end" sx={{ marginRight: '24px' }}>
                                    <Tooltip title="Clear Customer">
                                        <IconButton size="small" onClick={(e) => handleClearFilter(e, 'asiakasId')}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            )
                        }
                    >
                        <MenuItem value=""><em>All Customers</em></MenuItem>
                        {clientList.map((client) => (
                            <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* --- FIX: Updated Grid item props for better responsiveness --- */}
            <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
                    <InputLabel>Vehicle</InputLabel>
                    <Select
                        name="kalustoNro"
                        value={filters.kalustoNro}
                        label="Vehicle"
                        onChange={handleSelectChange}
                        endAdornment={
                            filters.kalustoNro && (
                                <InputAdornment position="end" sx={{ marginRight: '24px' }}>
                                    <Tooltip title="Clear Vehicle">
                                        <IconButton size="small" onClick={(e) => handleClearFilter(e, 'kalustoNro')}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            )
                        }
                    >
                        <MenuItem value=""><em>All Vehicles</em></MenuItem>
                        {vehicleList.map((vehicle) => (
                            <MenuItem key={vehicle.id} value={vehicle.id}>{vehicle.registrationNo}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* --- FIX: Updated Grid item props for better responsiveness --- */}
            <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
                    <InputLabel>Driver</InputLabel>
                    <Select
                        name="kuljId"
                        value={filters.kuljId}
                        label="Driver"
                        onChange={handleSelectChange}
                        endAdornment={
                            filters.kuljId && (
                                <InputAdornment position="end" sx={{ marginRight: '24px' }}>
                                    <Tooltip title="Clear Driver">
                                        <IconButton size="small" onClick={(e) => handleClearFilter(e, 'kuljId')}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            )
                        }
                    >
                        <MenuItem value=""><em>All Drivers</em></MenuItem>
                        {driverList.map((driver) => (
                            <MenuItem key={driver.driverId} value={driver.driverId}>{driver.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
    );
}