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
import { useTranslation } from 'react-i18next';

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

    const { t } = useTranslation(['puulaaniFilterBar']);

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
                        aria-label={t('status.aria')}
                        size="small"
                    >
                        <ToggleButton value="active">{t('status.active')}</ToggleButton>
                        <ToggleButton value="completed">{t('status.completed')}</ToggleButton>
                        <ToggleButton value="all">{t('status.all')}</ToggleButton>
                    </ToggleButtonGroup>
                </Grid>

                {/* Customer Filter */}
                <Grid
                    item
                    xs={12}
                    sm={6}
                    md="auto"
                    sx={{
                        minWidth: { xs: '100%', md: 240 },
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Autocomplete
                        options={clientList}
                        getOptionLabel={(option) => option.name}
                        value={clientList.find(c => c.id === filters.clientId) || null}
                        onChange={(event, newValue) => { onFilterChangeAction('clientId', newValue ? String(newValue.id) : null); }}
                        sx={{
                            width: { xs: '100%', md: 'auto' },
                            minWidth: { xs: '100%', md: 240 },
                            '& .MuiInputBase-root': {
                                width: { xs: '100%', md: 'auto' },
                                minWidth: { xs: '100%', md: 240 },
                                flexWrap: 'nowrap',
                            },
                            '& .MuiAutocomplete-input': {
                                width: 'auto !important',
                            },
                        }}
                        renderInput={(params) => <TextField {...params} label={t('customer')} size="small" />}
                    />
                </Grid>

                {/* Vehicle Filter */}
                <Grid
                    item
                    xs={12}
                    sm={6}
                    md="auto"
                    sx={{
                        minWidth: { xs: '100%', md: 200 },
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                     <Autocomplete
                        options={vehicleList}
                        // --- FIX 3: Use the correct property 'registrationNo' from IVehicleBasicInfo ---
                        getOptionLabel={(option) => option.registrationNo}
                        value={vehicleList.find(v => v.id === filters.vehicleId) || null}
                        onChange={(event, newValue) => { onFilterChangeAction('vehicleId', newValue ? String(newValue.id) : null); }}
                        sx={{
                            width: { xs: '100%', md: 'auto' },
                            minWidth: { xs: '100%', md: 200 },
                            '& .MuiInputBase-root': {
                                width: { xs: '100%', md: 'auto' },
                                minWidth: { xs: '100%', md: 200 },
                                flexWrap: 'nowrap',
                            },
                            '& .MuiAutocomplete-input': {
                                width: 'auto !important',
                            },
                        }}
                        renderInput={(params) => <TextField {...params} label={t('vehicle')} size="small" />}
                    />
                </Grid>

                {/* Timber Type Filter */}
                <Grid
                    item
                    xs={12}
                    sm={6}
                    md="auto"
                    sx={{
                        minWidth: { xs: '100%', md: 220 },
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Autocomplete
                        options={timberTypeList}
                        // --- FIX 4: Use the correct properties from IPuutavaraItem ---
                        getOptionLabel={(option) => option.puutavara} // Use 'puutavara' for the name
                        value={timberTypeList.find(t => String(t.puutavaraNro) === filters.timberTypeId) || null}
                        onChange={(event, newValue) => { onFilterChangeAction('timberTypeId', newValue ? String(newValue.puutavaraNro) : null); }}
                        sx={{
                            width: { xs: '100%', md: 'auto' },
                            minWidth: { xs: '100%', md: 220 },
                            '& .MuiInputBase-root': {
                                width: { xs: '100%', md: 'auto' },
                                minWidth: { xs: '100%', md: 220 },
                                flexWrap: 'nowrap',
                            },
                            '& .MuiAutocomplete-input': {
                                width: 'auto !important',
                            },
                        }}
                        renderInput={(params) => <TextField {...params} label={t('timberType')} size="small" />}
                    />
                </Grid>
            </Grid>
        </Paper>
    );
}
