// frontend/src/app/(main)/completed-trips/page.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Box, Typography, Tabs, Tab, Stack, TextField, Autocomplete,
    useTheme, alpha, Paper, InputAdornment, Button
} from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

// Icons
import ForestIcon from '@mui/icons-material/Forest';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// Services & Components
import { getCompletedTripDetails } from '@/services/driverViewService';
import { fetchMyCompletedLoads } from '@/services/loadService';
import chipPlanningService from '@/services/chipPlanningService';
import { useDriverSession } from '@/contexts/DriverSessionContext';

import TimberHistoryTab from '@/components/drivers/history/TimberHistoryTab';
import ConsignmentHistoryTab from '@/components/drivers/history/ConsignmentHistoryTab';
import ChipHistoryTab from '@/components/drivers/history/ChipHistoryTab';
import CompletedTripDetailsModal from '@/components/drivers/CompletedTripDetailsModal';

export default function CompletedTripsPage() {
    const { t } = useTranslation(['completedTrips', 'common']);
    const theme = useTheme();
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVehicleId } = useDriverSession();

    // --- MAIN STATES ---
    const [transportType, setTransportType] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [customerOptions, setCustomerOptions] = useState<string[]>([]); // 🚀 FIX: Customer list state
    const [startDate, setStartDate] = useState<string>(dayjs().subtract(5, 'year').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState<string>(dayjs().add(1, 'day').format('YYYY-MM-DD'));

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTripDetails, setSelectedTripDetails] = useState<any | null>(null);


    useEffect(() => {
        const loadCustomers = async () => {
            try {

                const timberData = await fetchMyCompletedLoads();
                const chipData = await chipPlanningService.searchLoads({
                    status: 'completed',
                    kalustoNro: selectedVehicleId ? Number(selectedVehicleId) : undefined
                });

                const allNames = [
                    ...timberData.map((r: any) => r.asiakkaanNimi),
                    ...chipData.map((r: any) => r.titleName || r.title_name)
                ];

                setCustomerOptions(Array.from(new Set(allNames.filter(Boolean))));
            } catch (err) {
                console.error("Failed to load customer list", err);
            }
        };
        loadCustomers();
    }, [selectedVehicleId]);

    const activeFilters = useMemo(() => ({
        searchQuery,
        customer: selectedCustomer,
        startDate,
        endDate
    }), [searchQuery, selectedCustomer, startDate, endDate]);

    const handleReset = () => {
        setSearchQuery('');
        setSelectedCustomer(null);
        setStartDate(dayjs().subtract(5, 'year').format('YYYY-MM-DD'));
        setEndDate(dayjs().add(1, 'day').format('YYYY-MM-DD'));
    };

    const handleRowClick = useCallback(async (id: number, rowData?: any) => {
        if (transportType === 2 && rowData) {
            setSelectedTripDetails(rowData);
            setIsModalOpen(true);
            return;
        }
        try {
            const data = await getCompletedTripDetails(id);
            setSelectedTripDetails(data);
            setIsModalOpen(true);
        } catch (err) {
            enqueueSnackbar(t('completedTrips:failedToLoadTripDetails'), { variant: 'error' });
        }
    }, [transportType, enqueueSnackbar]);

    return (
        <Box sx={{ p: 3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'background.default' }}>

            <Box sx={{ mb: 1 }}>
                <Typography variant="h5" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '0.5px' }}>
                    {t('completedTrips:historyTitle', { defaultValue: 'Trip History' })}
                </Typography>
            </Box>

            {/* Filter Bar */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        size="small"
                        placeholder={t('completedTrips:searchVehicleInfo')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ width: { xs: '100%', md: 250 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: '#a38f6d' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Autocomplete
                        size="small"
                        options={customerOptions}
                        renderInput={(params) => <TextField {...params} label={t('completedTrips:customer')} />}
                        value={selectedCustomer}
                        onChange={(_, v) => setSelectedCustomer(v as string | null)}
                        sx={{ width: { xs: '100%', md: 250 } }}
                    />

                    <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                            label={t('completedTrips:from')} type="date" size="small"
                            value={startDate} onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <Typography variant="body2">{t('completedTrips:to')}</Typography>
                        <TextField
                            label={t('completedTrips:to')} type="date" size="small"
                            value={endDate} onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>

                    <Box sx={{ flexGrow: 1 }} />

                    <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleReset} sx={{ textTransform: 'none' }}>
                        {t('completedTrips:reset')}
                    </Button>
                </Stack>
            </Paper>

            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Tabs value={transportType} onChange={(_, v) => setTransportType(v)}>
                    <Tab icon={<ForestIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('completedTrips:timberLoad')} />
                    <Tab icon={<AssignmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('completedTrips:consignment')} />
                    <Tab icon={<LocalShippingIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('completedTrips:chipTransport')} />
                </Tabs>
            </Box>

            <Box sx={{ flex: 1, overflow: 'hidden', bgcolor: 'background.paper', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                {transportType === 0 && <TimberHistoryTab filters={activeFilters} onRowClick={handleRowClick} />}
                {transportType === 1 && <ConsignmentHistoryTab filters={activeFilters} onRowClick={handleRowClick} />}
                {transportType === 2 && <ChipHistoryTab filters={activeFilters} onRowClick={handleRowClick} />}
            </Box>

            <CompletedTripDetailsModal open={isModalOpen} onCloseAction={() => setIsModalOpen(false)} data={selectedTripDetails} />
        </Box>
    );
}