// frontend/src/components/timber-management/PuulaaniFilterBar.tsx
'use client';

import React from 'react';
import {
    Paper,
    ToggleButtonGroup,
    ToggleButton,
    Autocomplete,
    TextField,
    Stack, // Import Stack
    Box    // Import Box for layout structure
} from '@mui/material';
import { IClientBasicInfo, ITimberStackListFilters, IVehicleBasicInfo, IPuutavaraItem } from '@/types';
import { useTranslation } from 'react-i18next';

interface PuulaaniFilterBarProps {
    filters: ITimberStackListFilters;
    onFilterChangeAction: (name: keyof ITimberStackListFilters, value: string | null) => void;
    clientList: IClientBasicInfo[];
    vehicleList: IVehicleBasicInfo[];
    timberTypeList: IPuutavaraItem[];
}

export default function PuulaaniFilterBar({
    filters,
    onFilterChangeAction,
    clientList,
    vehicleList,
    timberTypeList
}: PuulaaniFilterBarProps) {

    const { t } = useTranslation(['puulaaniFilterBar']);

    return (
        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
            {/* FIX: Replaced Grid with a responsive Stack component */}
            <Stack
                direction={{ xs: 'column', md: 'row' }} // Stacks vertically on small screens, horizontally on medium and up
                spacing={2}
                alignItems={{ xs: 'stretch', md: 'center' }} // Stretch items to full width on small screens
            >
                {/* Status Filter */}
                <Box>
                    <ToggleButtonGroup
                        color="primary"
                        value={filters.status || 'active'}
                        exclusive
                        onChange={(e, newValue) => { if (newValue !== null) { onFilterChangeAction('status', newValue); } }}
                        aria-label={t('status.aria')}
                        size="small"
                    >
                        <ToggleButton value="active">{t('status.active')}</ToggleButton>
                        <ToggleButton value="completed">{t('status.completed')}</ToggleButton>
                        <ToggleButton value="all">{t('status.all')}</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Customer Filter */}
                <Box sx={{ minWidth: 240, flexGrow: 1 }}>
                    <Autocomplete
                        options={clientList}
                        getOptionLabel={(option) => option.name}
                        value={clientList.find(c => c.id === filters.clientId) || null}
                        onChange={(event, newValue) => { onFilterChangeAction('clientId', newValue ? String(newValue.id) : null); }}
                        fullWidth
                        renderInput={(params) => <TextField {...params} label={t('customer')} size="small" />}
                    />
                </Box>

                {/* Vehicle Filter */}
                <Box sx={{ minWidth: 200, flexGrow: 1 }}>
                     <Autocomplete
                        options={vehicleList}
                        getOptionLabel={(option) => option.registrationNo}
                        value={vehicleList.find(v => v.id === filters.vehicleId) || null}
                        onChange={(event, newValue) => { onFilterChangeAction('vehicleId', newValue ? String(newValue.id) : null); }}
                        fullWidth
                        renderInput={(params) => <TextField {...params} label={t('vehicle')} size="small" />}
                    />
                </Box>

                {/* Timber Type Filter */}
                <Box sx={{ minWidth: 220, flexGrow: 1 }}>
                    <Autocomplete
                        options={timberTypeList}
                        getOptionLabel={(option) => option.puutavara}
                        value={timberTypeList.find(t => String(t.puutavaraNro) === filters.timberTypeId) || null}
                        onChange={(event, newValue) => { onFilterChangeAction('timberTypeId', newValue ? String(newValue.puutavaraNro) : null); }}
                        fullWidth
                        renderInput={(params) => <TextField {...params} label={t('timberType')} size="small" />}
                    />
                </Box>
            </Stack>
        </Paper>
    );
}
