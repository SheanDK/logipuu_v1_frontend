// src/app/[lng]/(main)/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, CircularProgress, Alert, Divider, Paper, Autocomplete, TextField, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

// Widgets import
import StatCard from '@/components/dashboard/StatCard';
import VolumeChart from '@/components/dashboard/VolumeChart';
import ActiveTripsList from '@/components/dashboard/ActiveTripsList';
import TimberMapCard from '@/components/dashboard/TimberMapCard';

// Icons import
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ForestIcon from '@mui/icons-material/Forest';
import GroupIcon from '@mui/icons-material/Group';
import NoCrashIcon from '@mui/icons-material/NoCrash';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import DashboardIcon from '@mui/icons-material/Dashboard';

// API Services and Types
import * as dashboardService from '@/services/dashboardService';
import { fetchAllClients } from '@/services/clientService';
import { IAdminDashboardStats, IDispatchDashboardStats, IDriverDashboardStats, IVolumeByDay, IActiveTripListItem, IBackendClient } from '@/types';
import dayjs from 'dayjs';

// Role definitions
const ADMIN_ROLES = ['Superuser', 'Admin', 'Office'];
const DISPATCH_ROLES = ['Ajojärjestelijä'];
const DRIVER_ROLE = 'Kuljettaja';


/**
 * NEW: Compact version of StatCard for Customer Specific Insight
 */
const CompactStatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
    <Paper elevation={0} sx={{
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(color, 0.1) : alpha(color, 0.05),
    }}>
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: color,
            color: '#fff',
            flexShrink: 0,
            '& .MuiSvgIcon-root': { fontSize: 22 }
        }}>
            {icon}
        </Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.1, mb: 0.2 }}>
                {value}
            </Typography>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: '500', display: 'block' }}
                noWrap
            >
                {title}
            </Typography>
        </Box>
    </Paper>
);

//Clock
const Clock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Typography>
    );
};
export default function DashboardPage() {
    const { t } = useTranslation(['dashboard', 'common']);
    const { user, isLoading: isAuthLoading } = useAuth();

    const [dashboardData, setDashboardData] = useState<any>(null);
    const [volumeData, setVolumeData] = useState<IVolumeByDay[]>([]);
    const [activeTrips, setActiveTrips] = useState<IActiveTripListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [clients, setClients] = useState<IBackendClient[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<IBackendClient | null>(null);
    const [customerStats, setCustomerStats] = useState<any>(null);
    const [isCustomerLoading, setIsCustomerLoading] = useState(false);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const userRoles = user.roles;

                if (userRoles.some(role => ADMIN_ROLES.includes(role))) {
                    const [stats, volume, trips, allClients] = await Promise.all([
                        dashboardService.getAdminDashboardStats(),
                        dashboardService.getVolumeLast7Days(),
                        dashboardService.getActiveTripsList(),
                        fetchAllClients()
                    ]);
                    setDashboardData(stats);
                    setVolumeData(volume);
                    setActiveTrips(trips);
                    setClients(allClients);
                } else if (userRoles.some(role => DISPATCH_ROLES.includes(role))) {
                    const [stats, volume, trips] = await Promise.all([
                        dashboardService.getDispatchDashboardStats(),
                        dashboardService.getVolumeLast7Days(),
                        dashboardService.getActiveTripsList()
                    ]);
                    setDashboardData(stats);
                    setVolumeData(volume);
                    setActiveTrips(trips);
                } else if (userRoles.includes(DRIVER_ROLE)) {
                    const stats = await dashboardService.getDriverDashboardStats();
                    setDashboardData(stats);
                }

            } catch (err) {
                setError(t('error'));
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, isAuthLoading, t]);

    useEffect(() => {
        const fetchCustomerStats = async () => {
            if (!selectedCustomer) {
                setCustomerStats(null);
                return;
            }
            try {
                setIsCustomerLoading(true);
                const stats = await dashboardService.getCustomerDashboardStats(selectedCustomer.asiakkaanId);
                setCustomerStats(stats);
            } catch (err) {
                console.error("Failed to fetch customer stats:", err);
            } finally {
                setIsCustomerLoading(false);
            }
        };
        fetchCustomerStats();
    }, [selectedCustomer]);

    if (isLoading || isAuthLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    }

    const renderContent = () => {
        if (!user || !dashboardData) {
            return <Typography>{t('noDataForRole')}</Typography>;
        }

        if (user.roles.some(role => ADMIN_ROLES.includes(role))) {
            const data = dashboardData as IAdminDashboardStats;
            return (
                <Stack spacing={3}>
                    {/* Top Row: Standard Large Cards */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 3 }}>
                        <StatCard title={t('stats.loadsCompletedToday')} value={data.loadsCompletedTodayCount} icon={<CheckCircleOutlineIcon />} color="#2e7d32" />
                        <StatCard title={t('stats.pendingBillings')} value={data.pendingBillingsCount} icon={<HourglassTopIcon />} color="#ed6c02" />
                        <StatCard title={t('stats.activeTimberStacks')} value={data.activeTimberStacksCount} icon={<ForestIcon />} color="#0288d1" />
                        <StatCard title={t('stats.activeDrivers')} value={data.activeDriversCount} icon={<GroupIcon />} color="#1976d2" />
                        <StatCard title={t('stats.activeVehicles')} value={data.activeVehiclesCount} icon={<LocalShippingIcon />} color="#7b1fa2" />
                        <StatCard title={t('stats.vehiclesNeedingInspection')} value={data.vehiclesNeedingInspectionCount} icon={<WarningAmberIcon />} color="#d32f2f" />
                    </Box>

                    {/* REDUCED HEIGHT SECTION: Customer Specific Insight */}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px', bgcolor: 'transparent' }}>
                        <Stack spacing={2}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {t('customerInsight.title', 'Customer Specific Insight')}
                                </Typography>

                                <Autocomplete
                                    sx={{ width: { xs: '100%', sm: 300 } }}
                                    options={clients}
                                    getOptionLabel={(option) => option.asiakkaanNimi}
                                    value={selectedCustomer}
                                    onChange={(_, newValue) => setSelectedCustomer(newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('customerInsight.selectLabel', 'Select Customer')}
                                            size="small"
                                        />
                                    )}
                                />
                            </Stack>

                            {isCustomerLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : customerStats ? (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>

                                    {/* Completed Today */}
                                    <CompactStatCard
                                        title={t('customerInsight.completedToday', 'Completed Today')}
                                        value={customerStats.completedTodayCount || 0}
                                        icon={<FactCheckIcon />}
                                        color="#4caf50"
                                    />

                                    {/* Remaining Volume */}
                                    <CompactStatCard
                                        title={t('customerInsight.remainingVolume', 'Remaining Vol')}
                                        value={`${Number(customerStats.remainingVolume || 0).toFixed(2)} m³`}
                                        icon={<ForestIcon />}
                                        color="#03a9f4"
                                    />

                                    {/* Active Stacks */}
                                    <CompactStatCard
                                        title={t('customerInsight.activeStacks', 'Active Stacks')}
                                        value={customerStats.activeStacksCount || 0}
                                        icon={<Inventory2Icon />}
                                        color="#9c27b0"
                                    />

                                    {/* Pending Billing */}
                                    <CompactStatCard
                                        title={t('customerInsight.pendingInvoices', 'Pending Billing')}
                                        value={customerStats.pendingInvoicesCount || 0}
                                        icon={<HourglassTopIcon />}
                                        color="#ff9800"
                                    />

                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 1 }}>
                                    {t('customerInsight.noCustomerSelected', 'Select a customer above for specific metrics.')}
                                </Typography>
                            )}

                        </Stack>
                    </Paper>

                    {/* Chart and Sidebar Widgets */}
                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="stretch">
                        <Box sx={{ width: '100%', flexBasis: { lg: '70%' } }}><VolumeChart data={volumeData} height="100%" /></Box>
                        <Box sx={{ width: '100%', flexBasis: { lg: '30%' } }}>
                            <Stack spacing={3} sx={{ height: '100%' }}>
                                <TimberMapCard />
                                <ActiveTripsList data={activeTrips} />
                            </Stack>
                        </Box>
                    </Stack>
                </Stack>
            );
        }

        // --- DISPATCHER DASHBOARD VIEW ---
        if (user.roles.some(role => DISPATCH_ROLES.includes(role))) {
            const data = dashboardData as IDispatchDashboardStats;
            return (
                <Stack spacing={3}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 3 }}>
                        <StatCard title={t('stats.activeLoads')} value={data.activeLoadsCount} icon={<LocalShippingIcon />} color="#1976d2" />
                        <StatCard title={t('stats.availableDrivers')} value={data.availableDriversCount} icon={<GroupIcon />} color="#2e7d32" />
                        <StatCard title={t('stats.availableVehicles')} value={data.availableVehiclesCount} icon={<NoCrashIcon />} color="#0288d1" />
                        <StatCard title={t('stats.remainingVolume')} value={data.totalRemainingVolume.toFixed(2)} icon={<ForestIcon />} color="#7b1fa2" />
                        <StatCard title={t('stats.upcomingLoadsToday')} value={data.upcomingLoadsTodayCount} icon={<EventAvailableIcon />} color="#ed6c02" />
                    </Box>
                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="stretch">
                        <Box sx={{ width: '100%', flexBasis: { lg: '70%' } }}><VolumeChart data={volumeData} height="100%" /></Box>
                        <Box sx={{ width: '100%', flexBasis: { lg: '30%' } }}>
                            <Stack spacing={3} sx={{ height: '100%' }}>
                                <TimberMapCard />
                                <ActiveTripsList data={activeTrips} />
                            </Stack>
                        </Box>
                    </Stack>
                </Stack>
            );
        }

        // --- DRIVER DASHBOARD VIEW ---
        if (user.roles.includes(DRIVER_ROLE)) {
            const data = dashboardData as IDriverDashboardStats;
            return (
                <Stack spacing={3}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
                        <StatCard title={t('stats.assignedToday')} value={data.todayAssignedLoadsCount} icon={<FactCheckIcon />} color="#1976d2" />
                        <StatCard title={t('stats.completedToday')} value={data.todayCompletedLoadsCount} icon={<CheckCircleOutlineIcon />} color="#2e7d32" />
                        <StatCard title={t('stats.thisWeeksLoads')} value={data.weekTotalLoadsCount} icon={<LocalShippingIcon />} color="#0288d1" />
                        <StatCard title={t('stats.upcomingLoads')} value={data.upcomingLoadsCount} icon={<EventAvailableIcon />} color="#ed6c02" />
                    </Box>
                    <TimberMapCard />
                </Stack>
            );
        }

        return <Typography>{t('noConfigForRole')}</Typography>;
    };

    return (
        <Box sx={{ flexGrow: 1, p: 3, backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100] }}>

            {/* 🚀 Professional & Elegant Header Section */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                        display: 'flex',
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: '#a38f6d',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(163, 143, 109, 0.3)'
                    }}>
                        <DashboardIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, color: 'text.primary' }}>
                            {t('title')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {t('subtitle', { defaultValue: 'Overview of your logistics operations' })}
                        </Typography>
                    </Box>
                </Stack>

                {/* Date/Info Tag */}
                <Paper variant="outlined" sx={{ px: 3, py: 1, borderRadius: 3, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight="bold">
                        {dayjs().format('DD MMMM, YYYY')}
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <Clock />
                </Paper>
            </Stack>

            {renderContent()}
        </Box>
    );
}