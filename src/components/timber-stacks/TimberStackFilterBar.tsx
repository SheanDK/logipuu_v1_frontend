// frontend/src/components/timber-stacks/TimberStackFilterBar.tsx
'use client';

import React from 'react';
import {
    FormControl, Autocomplete, TextField, Paper,
    RadioGroup, FormControlLabel, Radio, Typography,
    Stack, // Import Stack
    Box    // Import Box for layout structure
} from '@mui/material';
import { IMapFilterState, IClientBasicInfo, IVehicleBasicInfo } from '../../types';
import { useTranslation } from '@/i18n/useTranslation';

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

    const { t } = useTranslation('mapFilterBar');

    return (
        <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', borderRadius: 2 }}>
            {/* FIX: Replaced Grid with a responsive Stack component */}
            <Stack 
                direction={{ xs: 'column', md: 'row' }} // Stacks vertically on small screens, horizontally on medium and up
                spacing={2} 
                alignItems={{ xs: 'flex-start', md: 'center' }} // Align items to the start on small screens
            >
                <Typography 
                    variant="body2" 
                    sx={{ fontWeight: 'medium', color: 'text.secondary', mr: 2, flexShrink: 0 }}
                >
                    {t('filters.title')}
                </Typography>

                <FormControl component="fieldset">
                    <RadioGroup 
                        row 
                        name="status" 
                        value={filters.status}
                        onChange={(e) => onFilterChange('status', e.target.value as 'all' | 'active')}
                    >
                        <FormControlLabel value="all" control={<Radio size="small" />} label={t('filters.status.all')} disabled={isLoading} />
                        <FormControlLabel value="active" control={<Radio size="small" />} label={t('filters.status.active')} disabled={isLoading} />
                    </RadioGroup>
                </FormControl>

                <Box sx={{ minWidth: 240, flexGrow: 1 }}>
                    <Autocomplete
                        fullWidth
                        size="small"
                        options={clientList}
                        getOptionLabel={(option) => option.name || ''}
                        value={clientList.find(c => c.id === filters.clientId) || null}
                        onChange={(_event, newValue) => {
                            onFilterChange('clientId', newValue ? newValue.id : null);
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        disabled={isLoading}
                        renderInput={(params) => <TextField {...params} label={t('filters.client')} variant="outlined" fullWidth />}
                    />
                </Box>
                
                <Box sx={{ minWidth: 200, flexGrow: 1 }}>
                    <Autocomplete
                        fullWidth
                        size="small"
                        options={vehicleList}
                        getOptionLabel={(option) => option.name || ''}
                        value={vehicleList.find(v => v.id === filters.vehicleId) || null}
                        onChange={(_event, newValue) => {
                            onFilterChange('vehicleId', newValue ? newValue.id : null);
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        disabled={isLoading}
                        renderInput={(params) => <TextField {...params} label={t('filters.vehicle')} variant="outlined" fullWidth />}
                    />
                </Box>
            </Stack>
        </Paper>
    );
};

export default TimberStackFilterBar;