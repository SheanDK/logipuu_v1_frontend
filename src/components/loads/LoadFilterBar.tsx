// frontend/src/components/loads/LoadFilterBar.tsx
'use client';

import React from 'react';
import { 
    Grid, FormControl, InputLabel, Select, MenuItem,
    IconButton, InputAdornment, Tooltip, Box, Typography 
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import BusinessIcon from '@mui/icons-material/Business'; // Icon for Customer
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'; // Icon for Vehicle
import BadgeIcon from '@mui/icons-material/Badge'; // Icon for Driver
import { IClientBasicInfo, IVehicleBasicInfo, IDriver } from '@/types';
import { SxProps, Theme } from '@mui/system';

export interface ILoadFilters {
    asiakasId: string;
    kalustoNro: string;
    kuljId: string;
}

interface LoadFilterBarProps {
    filters: ILoadFilters;
    onFilterChangeAction: (name: keyof ILoadFilters, value: string) => void;
    clientList: IClientBasicInfo[];
    vehicleList: IVehicleBasicInfo[];
    driverList: IDriver[];
}

// --- Reusable Style Objects to keep the code DRY ---
const selectStyles: SxProps<Theme> = {
    borderRadius: 2,
    fontSize: '0.95rem',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#e2e8f0',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#94a3b8',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#3b82f6',
        borderWidth: '2px',
    },
};

const menuPaperStyles: SxProps<Theme> = {
    borderRadius: 3,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    mt: 1,
    maxHeight: 360,
    minWidth: 320,
    '& .MuiList-root': { padding: '8px' }
};

const menuItemStyles: SxProps<Theme> = {
    fontSize: '0.95rem',
    borderRadius: 2,
    mb: 0.5,
    py: 1.25,
    px: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    '&:hover': { backgroundColor: '#eff6ff', color: '#1e40af' },
    '&.Mui-selected': { backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 600, '&:hover': { backgroundColor: '#bfdbfe' } }
};

const clearButtonStyles: SxProps<Theme> = { 
    color: '#64748b', width: 32, height: 32, backgroundColor: '#f1f5f9', borderRadius: 2,
    '&:hover': { color: '#ffffff', backgroundColor: '#ef4444', transform: 'scale(1.05)' },
    transition: 'all 0.2s ease-in-out'
};


export default function LoadFilterBar({ filters, onFilterChangeAction, clientList, vehicleList, driverList }: LoadFilterBarProps) {
    
    const handleSelectChange = (event: any) => {
        const { name, value } = event.target;
        onFilterChangeAction(name as keyof ILoadFilters, value);
    };

    const handleClearFilter = (e: React.MouseEvent, name: keyof ILoadFilters) => {
        e.stopPropagation();
        onFilterChangeAction(name, '');
    };

    return (
        <Grid container spacing={2} alignItems="center">
            {/* Customer Filter */}
            <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Customer</InputLabel>
                    <Select
                        name="asiakasId"
                        value={filters.asiakasId}
                        label="Customer"
                        onChange={handleSelectChange}
                        IconComponent={KeyboardArrowDownIcon}
                        sx={selectStyles}
                        MenuProps={{ PaperProps: { sx: menuPaperStyles } }}
                        renderValue={(selected) => {
                            if (!selected) return <Typography sx={{ fontStyle: 'italic', color: '#94a3b8' }}>Select a customer</Typography>;
                            const clientName = clientList.find(c => c.id === selected)?.name;
                            return ( <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BusinessIcon sx={{ fontSize: 18, color: 'primary.main' }} />{clientName}</Box> );
                        }}
                        endAdornment={ filters.asiakasId && ( <InputAdornment position="end" sx={{mr: '24px'}}><Tooltip title="Clear"><IconButton sx={clearButtonStyles} onClick={(e) => handleClearFilter(e, 'asiakasId')}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment> )}
                    >
                        {clientList.map((client) => ( <MenuItem key={client.id} value={client.id} sx={menuItemStyles}><BusinessIcon sx={{opacity: 0.7}} />{client.name}</MenuItem> ))}
                    </Select>
                </FormControl>
            </Grid>
            {/* Vehicle Filter */}
            <Grid item xs={12} sm={4}>
                 <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Vehicle</InputLabel>
                    <Select
                        name="kalustoNro"
                        value={filters.kalustoNro}
                        label="Vehicle"
                        onChange={handleSelectChange}
                        IconComponent={KeyboardArrowDownIcon}
                        sx={selectStyles}
                        MenuProps={{ PaperProps: { sx: menuPaperStyles } }}
                        renderValue={(selected) => {
                            if (!selected) return <Typography sx={{ fontStyle: 'italic', color: '#94a3b8' }}>Select a vehicle</Typography>;
                            const vehicleName = vehicleList.find(v => v.id === selected)?.registrationNo;
                            return ( <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><DirectionsCarIcon sx={{ fontSize: 18, color: 'primary.main' }} />{vehicleName}</Box> );
                        }}
                        endAdornment={ filters.kalustoNro && ( <InputAdornment position="end" sx={{mr: '24px'}}><Tooltip title="Clear"><IconButton sx={clearButtonStyles} onClick={(e) => handleClearFilter(e, 'kalustoNro')}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment> )}
                    >
                        {vehicleList.map((vehicle) => ( <MenuItem key={vehicle.id} value={vehicle.id} sx={menuItemStyles}><DirectionsCarIcon sx={{opacity: 0.7}} />{vehicle.registrationNo}</MenuItem> ))}
                    </Select>
                </FormControl>
            </Grid>
            {/* Driver Filter */}
            <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Driver</InputLabel>
                    <Select
                        name="kuljId"
                        value={filters.kuljId}
                        label="Driver"
                        onChange={handleSelectChange}
                        IconComponent={KeyboardArrowDownIcon}
                        sx={selectStyles}
                        MenuProps={{ PaperProps: { sx: menuPaperStyles } }}
                        renderValue={(selected) => {
                            if (!selected) return <Typography sx={{ fontStyle: 'italic', color: '#94a3b8' }}>Select a driver</Typography>;
                            const driverName = driverList.find(d => String(d.driverId) === selected)?.name;
                            return ( <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BadgeIcon sx={{ fontSize: 18, color: 'primary.main' }} />{driverName}</Box> );
                        }}
                        endAdornment={ filters.kuljId && ( <InputAdornment position="end" sx={{mr: '24px'}}><Tooltip title="Clear"><IconButton sx={clearButtonStyles} onClick={(e) => handleClearFilter(e, 'kuljId')}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment> )}
                    >
                        {driverList.map((driver) => ( <MenuItem key={driver.driverId} value={driver.driverId} sx={menuItemStyles}><BadgeIcon sx={{opacity: 0.7}} />{driver.name}</MenuItem> ))}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
    );
}