// frontend/src/app/[lng]/(main)/loads/page.tsx

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Typography, Paper, Alert, Button, Snackbar, Stack, Divider, Tabs, Tab } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { GridRowId } from '@mui/x-data-grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportIcon from '@mui/icons-material/Report';
import ForestIcon from '@mui/icons-material/Forest';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useTranslation } from 'react-i18next';

import ConfirmationDialog from '../../../../components/common/ConfirmationDialog';
import InspectionFilterBar, { ILoadFilters } from '../../../../components/loads/InspectionFilterBar';
import { ILoadListItem, IClientBasicInfo, IVehicleBasicInfo, IDriver, IBackendClient, IVehicleBackendResponse, IBackendDriver } from '../../../../types';
import { deleteLoad, acceptLoadsForInvoicing, fetchAllLoads } from '../../../../services/loadService';
import { fetchAllClients } from '@/services/clientService';
import { fetchAllVehicles } from '@/services/vehicleService';
import { fetchAllDrivers } from '@/services/driverService';
import { useAuth } from '@/contexts/AuthContext';

import TimberLoadTable from '@/components/loads/TimberLoadTable';
import ConsignmentTable from '@/components/loads/ConsignmentTable';
import ChipTransportTable from '@/components/loads/ChipTransportTable';

export default function DrivenInspectionPage() {
    const { t } = useTranslation('loadsPage');
    const { user } = useAuth();

    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: AlertColor } | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<ILoadListItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [filters, setFilters] = useState<ILoadFilters>({
        status: 'pending_inspection',
        asiakasId: '',
        kalustoNro: '',
        kuljId: '',
        loadType: '0'
    });

    const [clientList, setClientList] = useState<IClientBasicInfo[]>([]);
    const [vehicleList, setVehicleList] = useState<IVehicleBasicInfo[]>([]);
    const [driverList, setDriverList] = useState<IDriver[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectionModel, setSelectionModel] = useState<Set<GridRowId>>(new Set());
    const [currentRows, setCurrentRows] = useState<any[]>([]);
    const [isAccepting, setIsAccepting] = useState(false);
    const [acceptConfirmationOpen, setAcceptConfirmationOpen] = useState(false);

    const router = useRouter();
    const params = useParams();
    const lng = params.lng as string;

    const isInspectionView = useMemo(() => filters.status === 'pending_inspection', [filters.status]);

    useEffect(() => {
        const loadFilterDropdowns = async () => {
            try {
                const [clients, vehicles, drivers] = await Promise.all([fetchAllClients(), fetchAllVehicles(), fetchAllDrivers()]);
                setClientList(clients.map((c: IBackendClient) => ({ id: String(c.asiakkaanId), name: c.asiakkaanNimi, clientId: String(c.asiakkaanId), clientName: c.asiakkaanNimi, targetColor: c.kohteenVari })));
                setVehicleList(vehicles.map((v: IVehicleBackendResponse) => ({ id: String(v.kalustoNro), name: v.rekNro, vehicleNo: String(v.kalustoNro), registrationNo: v.rekNro })));
                setDriverList(drivers.map((d: IBackendDriver) => ({ driverId: d.kuljId, name: d.nimi, phoneNo: d.puhelinNro, email: d.email, hasAlerts: d.halytys, isOnline: d.isOnline })));
            } catch (error) {
                console.error("Failed to load filter options:", error);
                setSnackbar({ open: true, message: t('errors.loadFilterOptions'), severity: 'warning' });
            }
        };
        loadFilterDropdowns();
    }, [t]);

    const handleLoadTypeChange = (event: React.SyntheticEvent, newValue: string) => {
        if (newValue !== null) {
            setFilters(prev => ({ ...prev, loadType: newValue }));
            setSelectionModel(new Set());
            setCurrentRows([]);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation || !user) return;
        setIsDeleting(true);
        try {
            await deleteLoad(deleteConfirmation.kuormaId, user);
            setSnackbar({ open: true, message: t('snackbar.deleted', { id: deleteConfirmation.kuormaId }), severity: 'success' });
            setDeleteConfirmation(null);
            setRefreshTrigger(prev => prev + 1);
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || t('errors.deleteFailed'), severity: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleConfirmAccept = async () => {
        setIsAccepting(true);
        try {
            const acceptedIds = Array.from(selectionModel);
            await acceptLoadsForInvoicing(acceptedIds as number[], filters.loadType);
            setSnackbar({ open: true, message: t('snackbar.acceptedForInvoicing', { count: acceptedIds.length }), severity: 'success' });
            setSelectionModel(new Set());
            setRefreshTrigger(prev => prev + 1);
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || t('errors.acceptFailed'), severity: 'error' });
        } finally {
            setIsAccepting(false);
            setAcceptConfirmationOpen(false);
        }
    };

    const handleReportClick = () => {
        const selectedIds = Array.from(selectionModel);
        if (selectedIds.length === 0) {
            setSnackbar({ open: true, message: t('warnings.selectRowsForReport'), severity: 'warning' });
            return;
        }

        const selectedRows = currentRows.filter(row => selectionModel.has(row.kuormaId || row.loadId || row.id));

        if (selectedRows.length === 0) {
            setSnackbar({ open: true, message: t('errors.noData'), severity: 'error' });
            return;
        }

        localStorage.setItem('reportData', JSON.stringify(selectedRows));
        window.open(`/${lng}/reports/load-report`, '_blank');
    };

    return (
        <Box sx={{ p: 3, width: '100%', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <Paper variant="outlined" sx={{ p: 2, flexShrink: 0, borderColor: 'rgba(0, 0, 0, 0.12)' }}>
                <Stack spacing={2}>
                    {/* Header Row Updated to align Subtitle under Title */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Stack spacing={0}>
                            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                                {t('title')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('subtitle')}
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                            {isInspectionView && (
                                <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} disabled={selectionModel.size === 0} onClick={() => setAcceptConfirmationOpen(true)}>
                                    {t('buttons.accept', { count: selectionModel.size })}
                                </Button>
                            )}
                            <Button variant="outlined" startIcon={<ReportIcon />} onClick={handleReportClick} disabled={selectionModel.size === 0}>
                                {t('buttons.report', { count: selectionModel.size })}
                            </Button>
                        </Stack>
                    </Box>
                    <Divider />

                    <Tabs
                        value={filters.loadType}
                        onChange={handleLoadTypeChange}
                        variant="standard"
                        indicatorColor="primary"
                        textColor="primary"
                        sx={{ mb: 1, borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label={t('tabs.timber', { defaultValue: 'Timber Load' })} value="0" icon={<ForestIcon />} iconPosition="start" />
                        <Tab label={t('tabs.consignment', { defaultValue: 'Consignment' })} value="1" icon={<DescriptionIcon />} iconPosition="start" />
                        <Tab label={t('tabs.chip', { defaultValue: 'Chip Transport' })} value="2" icon={<LocalShippingIcon />} iconPosition="start" />
                    </Tabs>

                    <InspectionFilterBar
                        filters={filters}
                        onFilterChangeAction={(n, v) => setFilters(p => ({ ...p, [n]: v }))}
                        onResetFiltersAction={() => setFilters({ status: 'pending_inspection', asiakasId: '', kalustoNro: '', kuljId: '', loadType: filters.loadType })}
                        clientList={clientList}
                        vehicleList={vehicleList}
                        driverList={driverList}
                    />
                </Stack>
            </Paper>

            {error && <Alert severity="error" sx={{ flexShrink: 0, mt: 2 }}>{error}</Alert>}

            <Paper sx={{ flexGrow: 1, width: '100%', mt: 2, overflow: 'hidden' }}>
                {filters.loadType === '0' && (
                    <TimberLoadTable
                        filters={filters}
                        refreshTrigger={refreshTrigger}
                        selectionModel={selectionModel}
                        toggleSelectionAction={(id: GridRowId) => setSelectionModel(prev => {
                            const next = new Set(prev);
                            if (next.has(id)) next.delete(id); else next.add(id);
                            return next;
                        })}
                        onDeleteAction={setDeleteConfirmation}
                        onErrorAction={setError}
                        onSuccessAction={(msg: string) => setSnackbar({ open: true, message: msg, severity: 'success' })}
                        onRowsUpdateAction={setCurrentRows}
                    />
                )}
                {filters.loadType === '1' && (
                    <ConsignmentTable
                        filters={filters}
                        refreshTrigger={refreshTrigger}
                        selectionModel={selectionModel}
                        toggleSelectionAction={(id: GridRowId) => setSelectionModel(prev => {
                            const next = new Set(prev);
                            if (next.has(id)) next.delete(id); else next.add(id);
                            return next;
                        })}
                        onDeleteAction={setDeleteConfirmation}
                        onErrorAction={setError}
                        onSuccessAction={(msg: string) => setSnackbar({ open: true, message: msg, severity: 'success' })}
                        onRowsUpdateAction={setCurrentRows}
                    />
                )}
                {filters.loadType === '2' && (
                    <ChipTransportTable
                        filters={filters}
                        refreshTrigger={refreshTrigger}
                        selectionModel={selectionModel}
                        toggleSelectionAction={(id: GridRowId) => setSelectionModel(prev => {
                            const next = new Set(prev);
                            if (next.has(id)) next.delete(id); else next.add(id);
                            return next;
                        })}
                        onErrorAction={setError}
                        onSuccessAction={(msg: string) => setSnackbar({ open: true, message: msg, severity: 'success' })}
                        onRowsUpdateAction={setCurrentRows}
                    />
                )}
            </Paper>

            <ConfirmationDialog open={!!deleteConfirmation} onClose={() => setDeleteConfirmation(null)} onConfirm={handleConfirmDelete} title={t('confirm.delete.title')} message={t('confirm.delete.message', { id: deleteConfirmation?.kuormaId ?? '' })} isConfirming={isDeleting} />
            <ConfirmationDialog open={acceptConfirmationOpen} onClose={() => setAcceptConfirmationOpen(false)} onConfirm={handleConfirmAccept} title={t('confirm.accept.title')} message={t('confirm.accept.message', { count: selectionModel.size })} isConfirming={isAccepting} confirmButtonText={t('confirm.accept.confirmButtonText')} confirmButtonColor="success" />
            <Snackbar open={!!snackbar} autoHideDuration={6000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar(null)} severity={snackbar?.severity || 'info'} sx={{ width: '100%' }}>{snackbar?.message}</Alert>
            </Snackbar>
        </Box>
    );
}