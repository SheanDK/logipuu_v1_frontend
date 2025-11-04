// frontend/src/app/(main)/completed-trips/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar, GridRowParams } from '@mui/x-data-grid'; // Import GridRowParams
import { ILoadListItem } from '@/types';
import { fetchMyCompletedLoads } from '@/services/loadService';
import { getCompletedTripDetails } from '@/services/driverViewService'; // Import the new service
import { useTranslation } from '@/i18n/useTranslation';
import TableSkeletonLoader from '@/components/common/TableSkeletonLoader';
import CustomNoRowsOverlay from '@/components/common/CustomNoRowsOverlay';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import CompletedTripDetailsModal from '@/components/drivers/CompletedTripDetailsModal'; // Import the new modal
import { useSnackbar } from 'notistack';

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
      style={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', width: '100%' }}>
            {children}
        </Box>
      )}
    </div>
  );
}

export default function CompletedTripsPage() {
    const [allTrips, setAllTrips] = useState<ILoadListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation(['completedTrips', 'common']);
    const [currentTab, setCurrentTab] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTripDetails, setSelectedTripDetails] = useState<any | null>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const { enqueueSnackbar } = useSnackbar();


    // --- DEBUGGING STEP 1 ---
    console.log('--- CompletedTripsPage Rendering ---');
    console.log(`isLoading: ${isLoading}, error: ${!!error}, allTrips count: ${allTrips.length}`);

    const loadCompletedTrips = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchMyCompletedLoads();
            
            // --- DEBUGGING STEP 2 ---
            console.log('--- Data received from fetchMyCompletedLoads API ---', {
                count: data.length,
                firstItem: data[0] || null
            });

            setAllTrips(data);
        } catch (err: any) {
            setError(err.response?.data?.message || t('loadError', { ns: 'completedTrips' }));
        } finally {
            setIsLoading(false);
        }
    }, [t]); // Removed loadCompletedTrips from dependency array of itself

    useEffect(() => {
        loadCompletedTrips();
    }, [loadCompletedTrips]);

    const timberTrips = useMemo(() => 
        allTrips.filter(trip => trip.tyyppi === 'Timber Load'), 
    [allTrips]);

    const consignmentTrips = useMemo(() => 
        allTrips.filter(trip => trip.tyyppi === 'Consignment'), 
    [allTrips]);

    // --- DEBUGGING STEP 3 ---
    console.log('--- Memoized trip counts ---', {
        timber: timberTrips.length,
        consignments: consignmentTrips.length
    });

     const handleRowClick = useCallback(async (params: GridRowParams) => {
        setIsModalOpen(true);
        setIsModalLoading(true);
        try {
            const data = await getCompletedTripDetails(params.row.kuormaId);
            setSelectedTripDetails(data);
        } catch (err) {
            enqueueSnackbar('Failed to load trip details.', { variant: 'error' });
            setIsModalOpen(false);
        } finally {
            setIsModalLoading(false);
        }
    }, [enqueueSnackbar]); // Assuming enqueueSnackbar is available from useSnackbar

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTripDetails(null);
    };


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

    if (error) { return <ErrorDisplay message={error} onRetry={loadCompletedTrips} />; }

    return (
        <Box sx={{ p: { xs: 1, sm: 3 }, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                {/* FIX 1: Make the main title bold */}
                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                    {t('title', { ns: 'completedTrips' })}
                </Typography>
            </Box>
            
            <Paper sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs 
                        value={currentTab} 
                        onChange={handleTabChange} 
                        aria-label={t('ariaTabs', { ns: 'completedTrips' })}
                    >
                        {/* FIX 2: Make the Tab labels bold */}
                        <Tab 
                            label={t('tabs.timberWithCount', { ns: 'completedTrips', count: timberTrips.length })} 
                            id="completed-trips-tab-0" 
                            sx={{ fontWeight: 'bold' }} 
                        />
                        <Tab 
                            label={t('tabs.consignmentsWithCount', { ns: 'completedTrips', count: consignmentTrips.length })} 
                            id="completed-trips-tab-1" 
                            sx={{ fontWeight: 'bold' }} 
                        />
                    </Tabs>
                </Box>

                {isLoading ? (
                    <TableSkeletonLoader rows={10} />
                ) : (
                    <>
                        <TabPanel value={currentTab} index={0}>
                            <DataGrid
                                rows={timberTrips}
                                columns={columns}
                                getRowId={(row) => row.kuormaId}
                                initialState={{ sorting: { sortModel: [{ field: 'pvm', sort: 'desc' }] } }}
                                disableRowSelectionOnClick
                                onRowClick={handleRowClick} // Add the click handler
                                // FIX 3: Make the column headers bold
                                sx={{ 
                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        fontWeight: 'bold'
                                    },
                                    border: 0 
                                }}
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
                                initialState={{ sorting: { sortModel: [{ field: 'pvm', sort: 'desc' }] } }}
                                disableRowSelectionOnClick
                                onRowClick={handleRowClick} // Add the click handler
                                // FIX 3: Make the column headers bold
                                sx={{ 
                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        fontWeight: 'bold'
                                    },
                                    border: 0 
                                }}
                                slots={{
                                    toolbar: GridToolbar,
                                    noRowsOverlay: () => <CustomNoRowsOverlay message={t('noConsignments', { ns: 'completedTrips' })}/>
                                }}
                            />  
                        </TabPanel>
                    </>
                )}
            </Paper>
            <CompletedTripDetailsModal
                open={isModalOpen}
                onCloseAction={handleCloseModal}
                tripDetails={selectedTripDetails}
                isLoading={isModalLoading}
            />
        </Box>
    );
}