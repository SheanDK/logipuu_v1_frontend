// frontend/src/components/driven-inspection/InspectionFilterBar.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { Box, Chip, Paper, TextField, Autocomplete } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { 
    IClientBasicInfo, 
    IVehicleBasicInfo, 
    IPuutavaraItem, 
    IDrivenInspectionFilters 
} from '@/types';

interface InspectionFilterBarProps {
    filters: Partial<IDrivenInspectionFilters>;
    onFilterChangeAction: (name: keyof IDrivenInspectionFilters, value: any) => void;  // FIX: Use consistent name
    clientList: IClientBasicInfo[];
    vehicleList: IVehicleBasicInfo[];
    timberTypeList: IPuutavaraItem[];
}

export default function InspectionFilterBar({
    filters,
    onFilterChangeAction,  // FIX: Consistent name
    clientList,
    vehicleList,
    timberTypeList
}: InspectionFilterBarProps) {

    // --- FIX: Validate callback and memoize ---
    const safeFilterChange = useCallback(
        (name: keyof IDrivenInspectionFilters, value: any) => {
            try {
                if (typeof onFilterChangeAction === 'function') {
                    onFilterChangeAction(name, value);
                } else {
                    console.warn(
                        `[InspectionFilterBar] onFilterChange is not a function. Received: ${typeof onFilterChangeAction}`
                    );
                }
            } catch (error) {
                console.error(`[InspectionFilterBar] Error in onFilterChange:`, error);
            }
        },
        [onFilterChangeAction]
    );

    const handleTimberTypeChange = useCallback(
        (event: React.SyntheticEvent, newValue: IPuutavaraItem[]) => {
            const selectedIds = newValue.map(item => item.puutavaraNro);
            safeFilterChange('timberGradeIds', selectedIds);
        },
        [safeFilterChange]
    );

    const selectedTimberTypeObjects = useMemo(() => {
        if (!filters.timberGradeIds || !Array.isArray(filters.timberGradeIds)) {
            return [];
        }
        return timberTypeList.filter(type => 
            filters.timberGradeIds!.includes(type.puutavaraNro)
        );
    }, [filters.timberGradeIds, timberTypeList]);

    const selectedClient = useMemo(() => {
        return clientList.find(c => c.id === filters.customerId) || null;
    }, [filters.customerId, clientList]);

    const selectedVehicle = useMemo(() => {
        return vehicleList.find(v => v.id === filters.vehicleId) || null;
    }, [filters.vehicleId, vehicleList]);

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
                {/* Start Date Filter */}
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 6', md: 'span 2' } }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Start date"
                            value={filters.startDate || null}
                            onChange={(newValue) => {
                                safeFilterChange('startDate', newValue);
                            }}
                            slotProps={{ 
                                textField: { 
                                    size: 'small', 
                                    fullWidth: true,
                                    error: false,
                                } 
                            }}
                        />
                    </LocalizationProvider>
                </Box>

                {/* End Date Filter */}
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 6', md: 'span 2' } }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="End date"
                            value={filters.endDate || null}
                            onChange={(newValue) => {
                                safeFilterChange('endDate', newValue);
                            }}
                            slotProps={{ 
                                textField: { 
                                    size: 'small', 
                                    fullWidth: true,
                                    error: false,
                                } 
                            }}
                        />
                    </LocalizationProvider>
                </Box>

                {/* Customer Filter */}
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 6', md: 'span 2' } }}>
                    <Autocomplete
                        fullWidth
                        size="small"
                        options={clientList}
                        getOptionLabel={(option) => option.name || ''}
                        value={selectedClient}
                        onChange={(_event, newValue) => {
                            safeFilterChange('customerId', newValue ? newValue.id : null);
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Customer" size="small" />
                        )}
                        noOptionsText="No customers"
                    />
                </Box>

                {/* Vehicle Filter */}
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 6', md: 'span 2' } }}>
                    <Autocomplete
                        fullWidth
                        size="small"
                        options={vehicleList}
                        getOptionLabel={(option) => option.registrationNo || ''}
                        value={selectedVehicle}
                        onChange={(_event, newValue) => {
                            safeFilterChange('vehicleId', newValue ? newValue.id : null);
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Vehicle" size="small" />
                        )}
                        noOptionsText="No vehicles"
                    />
                </Box>

                {/* Timber Types Filter */}
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 12', md: 'span 4' } }}>
                    <Autocomplete
                        multiple
                        size="small"
                        options={timberTypeList}
                        getOptionLabel={(option) => option.puutavara || ''}
                        value={selectedTimberTypeObjects}
                        onChange={handleTimberTypeChange}
                        disableCloseOnSelect
                        renderInput={(params) => (
                            <TextField {...params} label="Timber Grades" size="small" />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return (
                                    <Chip 
                                        key={key} 
                                        label={option.puutavara} 
                                        size="small" 
                                        {...tagProps} 
                                    />
                                );
                            })
                        }
                        noOptionsText="No timber types"
                    />
                </Box>
            </Box>
        </Paper>
    );
}