// frontend/src/app/(main)/completed-trips/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Chip, IconButton, Tooltip } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar, GridRowParams } from '@mui/x-data-grid'; 
import { ILoadListItem } from '@/types';
import { fetchMyCompletedLoads } from '@/services/loadService';
import { getCompletedTripDetails } from '@/services/driverViewService'; 
import { useTranslation } from '@/i18n/useTranslation';
import TableSkeletonLoader from '@/components/common/TableSkeletonLoader';
import CustomNoRowsOverlay from '@/components/common/CustomNoRowsOverlay';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import CompletedTripDetailsModal from '@/components/drivers/CompletedTripDetailsModal';
import { useSnackbar } from 'notistack';
import DescriptionIcon from '@mui/icons-material/Description'; 

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
    const { enqueueSnackbar } = useSnackbar();

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
    }, [t]);

    useEffect(() => {
        loadCompletedTrips();
    }, [loadCompletedTrips]);

    const timberTrips = useMemo(() => 
        allTrips.filter(trip => trip.tyyppi === 'Timber Load'), 
    [allTrips]);

    const consignmentTrips = useMemo(() => 
        allTrips.filter(trip => trip.tyyppi === 'Consignment'), 
    [allTrips]);

     const handleRowClick = useCallback(async (params: GridRowParams) => {
        try {
            const data = await getCompletedTripDetails(params.row.kuormaId);
            setSelectedTripDetails(data);
            setIsModalOpen(true);
        } catch (err) {
            console.error(err);
            enqueueSnackbar('Failed to load trip details.', { variant: 'error' });
        }
    }, [enqueueSnackbar]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTripDetails(null);
    };

    // --- DYNAMIC COLUMNS DEFINITION ---
    // FIX: Removed 'flex' properties and set specific 'width' to reduce spacing
    const getColumns = (isConsignment: boolean): GridColDef[] => {
        const commonColumns: GridColDef[] = [
            {
                field: 'pvm',
                headerName: t('date', { ns: 'completedTrips' }),
                width: 110, // Fixed width
                type: 'date',
                valueGetter: (value) => new Date(value),
                renderCell: (params) => new Date(params.value).toLocaleDateString(),
            },
            { 
                field: 'asiakkaanNimi', 
                headerName: t('customer', { ns: 'completedTrips' }), 
                width: 300 // Fixed width instead of flex
            },
        ];

        if (isConsignment) {
            return [
                ...commonColumns,
                // Consignment Specific Columns
                { 
                    field: 'm3', 
                    headerName: 'Total m3', 
                    width: 120, 
                    align: 'right', 
                    headerAlign: 'right',
                    valueFormatter: (value: any) => Number(value).toFixed(2)
                },
                { 
                    field: 'waybillCount', 
                    headerName: 'Waybills', 
                    width: 100, 
                    align: 'center', 
                    headerAlign: 'center',
                    renderCell: (params) => (
                        <Chip 
                            icon={<DescriptionIcon style={{fontSize: '1rem'}} />} 
                            label={params.value || '0'} 
                            size="small" 
                            variant="outlined" 
                        />
                    )
                },
                { 
                    field: 'status', 
                    headerName: 'Status', 
                    width: 130, 
                    align: 'center',
                    headerAlign: 'center',
                    renderCell: (params) => <Chip label={params.value} color="success" size="small" /> 
                }
            ];
        } else {
            // Timber Load Columns
            return [
                ...commonColumns,
                { 
                    field: 'lahto', 
                    headerName: t('origin', { ns: 'completedTrips' }), 
                    width: 250 // Fixed width
                },
                { 
                    field: 'kohde', 
                    headerName: t('destination', { ns: 'completedTrips' }), 
                    width: 250 // Fixed width
                },
                { 
                    field: 'm3', 
                    headerName: 'Vol (m3)', 
                    width: 120, 
                    align: 'right',
                    valueFormatter: (value: any) => Number(value).toFixed(2)
                },
            ];
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    if (error) { return <ErrorDisplay message={error} onRetry={loadCompletedTrips} />; }

    return (
        <Box sx={{ p: { xs: 1, sm: 3 }, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
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
                                columns={getColumns(false)} // Timber Columns
                                getRowId={(row) => row.kuormaId}
                                initialState={{ sorting: { sortModel: [{ field: 'pvm', sort: 'desc' }] } }}
                                disableRowSelectionOnClick
                                onRowClick={handleRowClick} 
                                sx={{ 
                                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' },
                                    '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
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
                                columns={getColumns(true)} // Consignment Columns
                                getRowId={(row) => row.kuormaId}
                                initialState={{ sorting: { sortModel: [{ field: 'pvm', sort: 'desc' }] } }}
                                disableRowSelectionOnClick
                                onRowClick={handleRowClick}
                                sx={{ 
                                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' },
                                    '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
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
                data={selectedTripDetails}
            />
        </Box>
    );
}