// frontend/src/components/loads/InspectionFilterBar.tsx 
'use client';

import React from 'react';
import {
    Box, FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton,
    InputAdornment, Tooltip, IconButton
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { IClientBasicInfo, IVehicleBasicInfo, IDriver } from '@/types';
import ClearIcon from '@mui/icons-material/Clear';
import { useTranslation } from 'react-i18next';

export interface ILoadFilters {
    status: 'active' | 'pending_inspection' | 'all' | '';
    asiakasId: string;
    kalustoNro: string;
    kuljId: string;
    loadType: string; // "0", "1" or ""
}

interface InspectionFilterBarProps {
    filters: ILoadFilters;
    onFilterChangeAction: (name: keyof ILoadFilters, value: string | null) => void;
    onResetFiltersAction: () => void;
    clientList: IClientBasicInfo[];
    vehicleList: IVehicleBasicInfo[];
    driverList: IDriver[];
}

export default function InspectionFilterBar({
    filters,
    onFilterChangeAction,
    clientList,
    vehicleList,
    driverList,
}: InspectionFilterBarProps) {

    const { t } = useTranslation('inspectionFilterBar');

    const handleSelectChange = (event: SelectChangeEvent<string>) => {
        onFilterChangeAction(event.target.name as keyof ILoadFilters, event.target.value);
    };

    const handleStatusChange = (event: React.MouseEvent<HTMLElement>, newStatus: string | null) => {
        if (newStatus !== null) {
            onFilterChangeAction('status', newStatus);
        }
    };

    const handleClearFilter = (e: React.MouseEvent, name: keyof ILoadFilters) => {
        e.stopPropagation();
        onFilterChangeAction(name, '');
    };

    return (
        <Box
            sx={{
                display: 'grid',
                gap: 2,
                alignItems: 'center',
                // Grid layout එක සකස් කිරීම: තීරු 12කට බෙදා ඇත
                gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, 
            }}
        >
            {/* Status Toggles */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                <ToggleButtonGroup value={filters.status} exclusive onChange={handleStatusChange} size="small" fullWidth>
                    <ToggleButton value="active">{t('status.active')}</ToggleButton>
                    <ToggleButton value="pending_inspection">{t('status.inspection')}</ToggleButton>
                    <ToggleButton value="all">{t('status.all')}</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* --- FIX: New Type Selector --- */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="load-type-label">Type</InputLabel>
                    <Select
                        labelId="load-type-label"
                        name="loadType"
                        value={filters.loadType || ''}
                        label="Type"
                        onChange={handleSelectChange}
                        // Clear button for Type filter
                        endAdornment={filters.loadType && (<InputAdornment position="end" sx={{ marginRight: '24px' }}><Tooltip title="Clear Type"><IconButton size="small" onClick={(e) => handleClearFilter(e, 'loadType')}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment>)}
                    >
                        <MenuItem value=""><em>All Types</em></MenuItem>
                        <MenuItem value="0">Timber (Puulaani)</MenuItem>
                        <MenuItem value="1">Consignment (Rahti)</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Customer Filter */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="customer-filter-label">{t('labels.customer')}</InputLabel>
                    <Select
                        labelId="customer-filter-label"
                        name="asiakasId"
                        value={filters.asiakasId || ''}
                        label={t('labels.customer')}
                        onChange={handleSelectChange}
                        endAdornment={filters.asiakasId && (<InputAdornment position="end" sx={{ marginRight: '24px' }}><Tooltip title={t('tooltips.clearCustomer')}><IconButton size="small" onClick={(e) => handleClearFilter(e, 'asiakasId')}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment>)}
                    >
                        <MenuItem value=""><em>{t('all.allCustomers')}</em></MenuItem>
                        {clientList.map((client: IClientBasicInfo) => (<MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>))}
                    </Select>
                </FormControl>
            </Box>

            {/* Vehicle Filter */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="vehicle-filter-label">{t('labels.vehicle')}</InputLabel>
                    <Select
                        labelId="vehicle-filter-label"
                        name="kalustoNro"
                        value={filters.kalustoNro || ''}
                        label={t('labels.vehicle')}
                        onChange={handleSelectChange}
                        endAdornment={filters.kalustoNro && (<InputAdornment position="end" sx={{ marginRight: '24px' }}><Tooltip title={t('tooltips.clearVehicle')}><IconButton size="small" onClick={(e) => handleClearFilter(e, 'kalustoNro')}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment>)}
                    >
                        <MenuItem value=""><em>{t('all.allVehicles')}</em></MenuItem>
                        {vehicleList.map((vehicle: IVehicleBasicInfo) => (<MenuItem key={vehicle.id} value={vehicle.id}>{vehicle.registrationNo}</MenuItem>))}
                    </Select>
                </FormControl>
            </Box>

            {/* Driver Filter */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="driver-filter-label">{t('labels.driver')}</InputLabel>
                    <Select
                        labelId="driver-filter-label"
                        name="kuljId"
                        value={filters.kuljId || ''}
                        label={t('labels.driver')}
                        onChange={handleSelectChange}
                        endAdornment={filters.kuljId && (<InputAdornment position="end" sx={{ marginRight: '24px' }}><Tooltip title={t('tooltips.clearDriver')}><IconButton size="small" onClick={(e) => handleClearFilter(e, 'kuljId')}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment>)}
                    >
                        <MenuItem value=""><em>{t('all.allDrivers')}</em></MenuItem>
                        {driverList.map((driver: IDriver) => (<MenuItem key={driver.driverId} value={driver.driverId}>{driver.name}</MenuItem>))}
                    </Select>
                </FormControl>
            </Box>
        </Box>
    );
}