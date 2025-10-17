// frontend/src/app/(main)/completed-trips/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Button, Tabs, Tab } from '@mui/material';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';

import { ILoadListItem } from '@/types';
import { fetchMyCompletedLoads } from '@/services/loadService';
import { useTranslation } from '@/i18n/useTranslation';
import TableSkeletonLoader from '@/components/common/TableSkeletonLoader';
import CustomNoRowsOverlay from '@/components/common/CustomNoRowsOverlay';
import ErrorDisplay from '@/components/common/ErrorDisplay'; 

// Custom TabPanel component to show/hide content
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`completed-trips-tabpanel-${index}`}
      aria-labelledby={`completed-trips-tab-${index}`}
      style={{ height: '100%', width: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', width: '100%' }}>{children}</Box>
      )}
    </div>
  );
}

export default function CompletedTripsPage() {
    const router = useRouter();
    const [allTrips, setAllTrips] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation(['completedTrips', 'common']);
    
    // State for the currently selected tab (0 for Timber, 1 for Consignments)
    const [currentTab, setCurrentTab] = useState(0);

    const loadCompletedTrips = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchMyCompletedLoads();
            setAllTrips(data);
        } catch (err: any) {
            setError(err.response?.data?.message || t('loadError', { ns: 'completedTrips' }));
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array means this function is created only once.

    useEffect(() => {
        loadCompletedTrips();
    }, [loadCompletedTrips]);

    // useMemo hooks to filter trips based on the selected tab
    // This is very efficient as it avoids re-filtering on every render.
    const timberTrips = useMemo(() => 
        allTrips.filter(trip => trip.tyyppi === 'Timber Load'), 
    [allTrips]);

    const consignmentTrips = useMemo(() => 
        allTrips.filter(trip => trip.tyyppi === 'Consignment'), 
    [allTrips]);

    const columns = useMemo((): GridColDef[] => [
        {
            field: 'pvm',
            headerName: t('date', { ns: 'completedTrips' }),
            width: 120,
            type: 'date',
            valueGetter: (value) => new Date(value),
            renderCell: (params) => new Date(params.value).toLocaleDateString(),
        },
        { field: 'asiakkaanNimi', headerName: t('customer', { ns: 'completedTrips' }), flex: 1.5 },
        { field: 'lahto', headerName: t('origin', { ns: 'completedTrips' }), flex: 1 },
        { field: 'kohde', headerName: t('destination', { ns: 'completedTrips' }), flex: 1 },
    ], [t]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

     if (error) {
        return <ErrorDisplay message={error} onRetry={loadCompletedTrips} />;
    }

     return (
        <Box sx={{ p: { xs: 1, sm: 3 }, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <Typography variant="h5" component="h1">
                    {t('title', { ns: 'completedTrips' })}
                </Typography>
            </Box>

            
            
            <Paper sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label={t('ariaTabs', { ns: 'completedTrips' })}>
                        <Tab label={t('tabs.timberWithCount', { ns: 'completedTrips', count: timberTrips.length })} id="completed-trips-tab-0" />
                        <Tab label={t('tabs.consignmentsWithCount', { ns: 'completedTrips', count: consignmentTrips.length })} id="completed-trips-tab-1" />
                    </Tabs>
                </Box>

                {/* --- 2. Use the Skeleton Loader while data is fetching --- */}
                {isLoading ? (
                    <TableSkeletonLoader rows={10} />
                ) : (
                    <>
                <TabPanel value={currentTab} index={0}>
                    <DataGrid
                        rows={timberTrips}
                        columns={columns}
                        getRowId={(row) => row.kuormaId}
                        loading={isLoading}
                        initialState={{ sorting: { sortModel: [{ field: 'pvm', sort: 'desc' }] } }}
                        localeText={{ noRowsLabel: t('empty', { ns: 'completedTrips' }) }}
                        disableRowSelectionOnClick
                        sx={{ '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' } }}
                        slots={{
                            toolbar: GridToolbar,
                            noRowsOverlay: () => <CustomNoRowsOverlay message={t('noTimber', { ns: 'completedTrips' })} />
                        }}
                    />
                </TabPanel>

                <TabPanel value={currentTab} index={1}>
                    <DataGrid
                        rows={consignmentTrips}
                        columns={columns}
                        getRowId={(row) => row.kuormaId}
                        loading={isLoading}
                        initialState={{ sorting: { sortModel: [{ field: 'pvm', sort: 'desc' }] } }}
                        localeText={{ noRowsLabel: t('empty', { ns: 'completedTrips' }) }}
                        disableRowSelectionOnClick
                        sx={{ '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' } }}
                        slots={{
                            toolbar: GridToolbar,
                            noRowsOverlay: () => <CustomNoRowsOverlay message={t('noConsignments', { ns: 'completedTrips' })}/>
                        }}
                    />  
                </TabPanel>
                </>
                )}
            </Paper>
        </Box>
    );
}