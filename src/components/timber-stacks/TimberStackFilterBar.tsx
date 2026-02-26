// frontend/src/components/timber-stacks/TimberStackFilterBar.tsx
'use client';

import React from 'react';
import {
    Autocomplete, TextField, Paper, Typography,
    Stack, Box, Divider, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import ForestIcon from '@mui/icons-material/Forest';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { IMapFilterState, IClientBasicInfo, IVehicleBasicInfo } from '../../types';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme, alpha } from '@mui/material/styles';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

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
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const handleMarkerTypeChange = (
        event: React.MouseEvent<HTMLElement>,
        newTypes: string[],
    ) => {
        onFilterChange('markerTypes', newTypes);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: isDarkMode
                    ? alpha(theme.palette.background.paper, 0.8)
                    : 'rgba(255, 255, 255, 0.49)',
                border: isDarkMode ? `1px solid ${theme.palette.divider}` : 'none'
            }}
        >
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'flex-start', md: 'center' }}
            >
                {/* Status Filter (All/Active) */}
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 'medium',
                            color: 'text.primary',
                            flexShrink: 0
                        }}>
                        {t('filters.status.title', 'Status:')}
                    </Typography>
                    <ToggleButtonGroup
                        value={filters.status || 'active'}
                        exclusive
                        onChange={(e, value) => value && onFilterChange('status', value)}
                        size="small"
                        disabled={isLoading}
                    >
                        <ToggleButton value="all">{t('filters.status.all', 'All')}</ToggleButton>
                        <ToggleButton value="active">{t('filters.status.active', 'Active')}</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                {/* Marker Type Filter (Puulaani/Purkupaikka) */}
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary', flexShrink: 0 }}>
                        {t('filters.markerType.title', 'Show:')}
                    </Typography>
                    <ToggleButtonGroup
                        value={filters.markerTypes || []}
                        onChange={handleMarkerTypeChange}
                        size="small"
                        aria-label="marker type filter"
                        disabled={isLoading}
                    >
                        <ToggleButton value="puulaani" aria-label="timber stacks">
                            <ForestIcon sx={{ mr: 1 }} />
                            {t('filters.markerType.puulaani', 'Timber Stacks')}
                        </ToggleButton>
                        <ToggleButton value="purkupaikka" aria-label="drop-off sites">
                            <WarehouseIcon sx={{ mr: 1 }} />
                            {t('filters.markerType.purkupaikka', 'Drop-offs')}
                        </ToggleButton>
                        <ToggleButton value="chip-transport" aria-label="chip transports">
                            <LocalShippingIcon sx={{ mr: 1 }} />
                            {t('filters.markerType.chipTransport', 'Chip Transports')}
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

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