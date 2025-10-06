// frontend/src/components/loads/InspectionFilterBar.tsx
'use client';

import React from 'react';
import { 
    Grid, FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton,
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
}

// --- FIX: Correct the prop names and add missing ones ---
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
        <Grid container spacing={2} alignItems="center">
            <Grid item>
                <ToggleButtonGroup value={filters.status} exclusive onChange={handleStatusChange} size="small">
                    <ToggleButton value="active">{t('status.active')}</ToggleButton>
                    <ToggleButton value="pending_inspection">{t('status.inspection')}</ToggleButton>
                    <ToggleButton value="all">{t('status.all')}</ToggleButton>
                </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} sm={12} md={3} sx={{ minWidth: 120 }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="customer-filter-label">{t('labels.customer')}</InputLabel>
                    <Select
                        labelId="customer-filter-label"
                        name="asiakasId"
                        value={filters.asiakasId || ''}
                        label={t('labels.customer')}
                        onChange={handleSelectChange}
                        endAdornment={ filters.asiakasId && ( <InputAdornment position="end" sx={{ marginRight: '24px' }}><Tooltip title={t('tooltips.clearCustomer')}><IconButton size="small" onClick={(e) => handleClearFilter(e, 'asiakasId')}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment> )}
                    >
                        <MenuItem value=""><em>{t('all.allCustomers')}</em></MenuItem>
                        {clientList.map((client: IClientBasicInfo) => (<MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={3} sx={{ minWidth: 120 }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="vehicle-filter-label">{t('labels.vehicle')}</InputLabel>
                    <Select
                        labelId="vehicle-filter-label"
                        name="kalustoNro"
                        value={filters.kalustoNro || ''}
                        label={t('labels.vehicle')}
                        onChange={handleSelectChange}
                        endAdornment={ filters.kalustoNro && ( <InputAdornment position="end" sx={{ marginRight: '24px' }}><Tooltip title={t('tooltips.clearVehicle')}><IconButton size="small" onClick={(e) => handleClearFilter(e, 'kalustoNro')}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment> )}
                    >
                        <MenuItem value=""><em>{t('all.allVehicles')}</em></MenuItem>
                        {vehicleList.map((vehicle: IVehicleBasicInfo) => (<MenuItem key={vehicle.id} value={vehicle.id}>{vehicle.registrationNo}</MenuItem>))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={3} sx={{ minWidth: 120 }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="driver-filter-label">{t('labels.driver')}</InputLabel>
                    <Select
                        labelId="driver-filter-label"
                        name="kuljId"
                        value={filters.kuljId || ''}
                        label={t('labels.driver')}
                        onChange={handleSelectChange}
                        endAdornment={ filters.kuljId && ( <InputAdornment position="end" sx={{ marginRight: '24px' }}><Tooltip title={t('tooltips.clearDriver')}><IconButton size="small" onClick={(e) => handleClearFilter(e, 'kuljId')}><ClearIcon fontSize="small" /></IconButton></Tooltip></InputAdornment> )}
                    >
                        <MenuItem value=""><em>{t('all.allDrivers')}</em></MenuItem>
                        {driverList.map((driver: IDriver) => (<MenuItem key={driver.driverId} value={driver.driverId}>{driver.name}</MenuItem>))}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
    );
}

//<Grid item xs={12} sm={12} md={3} sx={{ minWidth: 120 }}>