// src/app/[lng]/(main)/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, CircularProgress, Alert } from '@mui/material';
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

// API Services and Types
import * as dashboardService from '@/services/dashboardService';
import { IAdminDashboardStats, IDispatchDashboardStats, IDriverDashboardStats, IVolumeByDay, IActiveTripListItem } from '@/types';

// Role definitions
const ADMIN_ROLES = ['Superuser', 'Admin', 'Toimisto'];
const DISPATCH_ROLES = ['Ajojärjestelijä'];
const DRIVER_ROLE = 'Kuljettaja';

export default function DashboardPage() {
    const { t } = useTranslation(['dashboard', 'common']); // 'dashboard' සහ 'common' namespaces භාවිතා කරන්න
    const { user, isLoading: isAuthLoading } = useAuth();

    // Generic state to hold any type of dashboard data
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [volumeData, setVolumeData] = useState<IVolumeByDay[]>([]);
    const [activeTrips, setActiveTrips] = useState<IActiveTripListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                    const [stats, volume, trips] = await Promise.all([
                        dashboardService.getAdminDashboardStats(),
                        dashboardService.getVolumeLast7Days(),
                        dashboardService.getActiveTripsList()
                    ]);
                    setDashboardData(stats);
                    setVolumeData(volume);
                    setActiveTrips(trips);
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
                setError(t('error')); // Use translated error message
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, isAuthLoading, t]); // Add 't' to dependency array

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

        // --- ADMIN DASHBOARD VIEW ---
        if (user.roles.some(role => ADMIN_ROLES.includes(role))) {
            const data = dashboardData as IAdminDashboardStats;
            return (
                <Stack spacing={3}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 3 }}>
                        <StatCard title={t('stats.loadsCompletedToday')} value={data.loadsCompletedTodayCount} icon={<CheckCircleOutlineIcon />} color="#2e7d32" />
                        <StatCard title={t('stats.pendingBillings')} value={data.pendingBillingsCount} icon={<HourglassTopIcon />} color="#ed6c02" />
                        <StatCard title={t('stats.activeTimberStacks')} value={data.activeTimberStacksCount} icon={<ForestIcon />} color="#0288d1" />
                        <StatCard title={t('stats.activeDrivers')} value={data.activeDriversCount} icon={<GroupIcon />} color="#1976d2" />
                        <StatCard title={t('stats.activeVehicles')} value={data.activeVehiclesCount} icon={<LocalShippingIcon />} color="#7b1fa2" />
                        <StatCard title={t('stats.vehiclesNeedingInspection')} value={data.vehiclesNeedingInspectionCount} icon={<WarningAmberIcon />} color="#d32f2f" />
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
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                {t('title')}
            </Typography>
            {renderContent()}
        </Box>
    );
}