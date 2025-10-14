// frontend/src/components/driven-inspection/InspectionFilterBar.tsx
'use client';

import React, { useMemo } from 'react';
import { Grid, TextField, Autocomplete, Paper, Chip, Box } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';

import { IClientBasicInfo, IVehicleBasicInfo, IPuutavaraItem, IDrivenInspectionFilters } from '@/types';

// --- FIX 1: Correctly define the props interface ---
interface InspectionFilterBarProps {
    filters: Partial<IDrivenInspectionFilters>;
    onFilterChangeAction: (name: keyof IDrivenInspectionFilters, value: any) => void;
    clientList: IClientBasicInfo[];
    vehicleList: IVehicleBasicInfo[];
    timberTypeList: IPuutavaraItem[];
}

export default function InspectionFilterBar({
    filters,
    onFilterChangeAction,
    clientList,
    vehicleList,
    timberTypeList
}: InspectionFilterBarProps) {

    // --- NEW: Handler for the multi-select component ---
    const handleTimberTypeChange = (event: React.SyntheticEvent, newValue: IPuutavaraItem[]) => {
        // Extract just the IDs from the selected objects
        const selectedIds = newValue.map(item => item.puutavaraNro);
        onFilterChangeAction('timberGradeIds', selectedIds);
    };

    // Find the full objects for the values currently in the filter state
    const selectedTimberTypeObjects = useMemo(() => {
        if (!filters.timberGradeIds) return [];
        return timberTypeList.filter(type => filters.timberGradeIds!.includes(type.puutavaraNro));
    }, [filters.timberGradeIds, timberTypeList]);

    return (
        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    alignItems: 'center',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(12, 1fr)' },
                }}
            >
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 6', md: 'span 2' } }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Start date"
                            value={filters.startDate || null}
                            onChange={(newValue) => onFilterChangeAction('startDate', newValue)}
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                    </LocalizationProvider>
                </Box>
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 6', md: 'span 2' } }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="End date"
                            value={filters.endDate || null}
                            onChange={(newValue) => onFilterChangeAction('endDate', newValue)}
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                    </LocalizationProvider>
                </Box>
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 6', md: 'span 2' } }}>
                    <Autocomplete
                        fullWidth
                        options={clientList}
                        getOptionLabel={(option: IClientBasicInfo) => option.name}
                        value={clientList.find(c => c.id === filters.customerId) || null}
                        onChange={(event, newValue) => onFilterChangeAction('customerId', newValue ? newValue.id : null)}
                        renderInput={(params) => <TextField {...params} label="Customer" size="small" />}
                    />
                </Box>
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 6', md: 'span 2' } }}>
                    <Autocomplete
                        options={vehicleList}
                        fullWidth
                        getOptionLabel={(option: IVehicleBasicInfo) => option.registrationNo}
                        value={vehicleList.find(v => v.id === filters.vehicleId) || null}
                        onChange={(event, newValue) => onFilterChangeAction('vehicleId', newValue ? newValue.id : null)}
                        renderInput={(params) => <TextField {...params} label="Car" size="small" />}
                    />
                </Box>
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 12', md: 'span 6' } }}>
                    <Autocomplete
                        fullWidth
                        multiple
                        id="timber-grades-filter"
                        options={timberTypeList}
                        getOptionLabel={(option) => option.puutavara}
                        value={selectedTimberTypeObjects}
                        onChange={handleTimberTypeChange}
                        disableCloseOnSelect
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Timber Grades"
                                placeholder="Select grades..."
                                size="small"
                            />
                        )}
                        renderTags={(value, getTagProps) => {
                            // Destructure the key from the props returned by getTagProps
                            return value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return (
                                    <Chip
                                        key={key} // Pass the key directly
                                        variant="outlined"
                                        label={option.puutavara}
                                        size="small"
                                        {...tagProps} // Spread the rest of the props
                                    />
                                );
                            });
                        }}
                    />
                </Box>
            </Box>
        </Paper>
    );
}