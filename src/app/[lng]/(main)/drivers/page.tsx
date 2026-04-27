// frontend/src/app/[lng]/(main)/drivers/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Button, Paper, Tooltip, Chip, AlertColor, Stack, Dialog, DialogTitle, DialogContent, IconButton, alpha,
    Avatar, Divider, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem, GridToolbar, GridRenderCellParams } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// --- Icons ---
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DevicesIcon from '@mui/icons-material/Devices';
import LogoutIcon from '@mui/icons-material/Logout';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import ComputerIcon from '@mui/icons-material/Computer';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CircleIcon from '@mui/icons-material/FiberManualRecord';

// --- Contexts & Services ---
import { useAuth } from '../../../../contexts/AuthContext';
import { IDriver, ICreateDriverDto, IUpdateDriverDto } from '../../../../types';
import { fetchAllDrivers, createDriver, updateDriver, deleteDriver } from '../../../../services/driverService';
import DriverFormModal from '../../../../components/drivers/DriverFormModal';
import ConfirmationDialog from '../../../../components/common/ConfirmationDialog';
import { useTranslation } from '@/i18n/useTranslation';
import apiClient from '@/services/apiClient';
import useSocket from '@/hooks/useSocket'; // 🚀 Import confirmed

dayjs.extend(relativeTime);

// --- TS Interface ---
interface IDriverGridRow extends IDriver {
    id: number;
    isOnline: boolean;
}

/**
 * 🚀 ANIMATIONS: Blinker and Heartbeat
 */
const animations = {
    '@keyframes blinker': {
        '0%': { opacity: 1 },
        '50%': { opacity: 0.4 },
        '100%': { opacity: 1 },
    },
    '@keyframes heartbeat': {
        '0%': { transform: 'scale(1)' },
        '15%': { transform: 'scale(1.15)' },
        '30%': { transform: 'scale(1)' },
        '45%': { transform: 'scale(1.1)' },
        '60%': { transform: 'scale(1)' },
    }
};

const formatDeviceInfo = (ua: string) => {
    const raw = ua || "";
    if (raw.includes("Android")) return { label: "Android Mobile", icon: <SmartphoneIcon fontSize="small" /> };
    if (raw.includes("iPhone")) return { label: "Apple iPhone", icon: <SmartphoneIcon fontSize="small" /> };
    if (raw.includes("Windows")) return { label: "Windows PC", icon: <ComputerIcon fontSize="small" /> };
    if (raw.includes("Macintosh")) return { label: "MacBook / iMac", icon: <ComputerIcon fontSize="small" /> };
    return { label: "Web Browser", icon: <DevicesIcon fontSize="small" /> };
};

export default function DriversPage() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslation(['drivers', 'common']);
    const { socket } = useSocket(0);

    const [drivers, setDrivers] = useState<IDriverGridRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<IDriverGridRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IDriverGridRow | null>(null);

    const [sessionModal, setSessionModal] = useState<{ open: boolean, driverName: string, sessions: any[], isFetching: boolean }>({
        open: false, driverName: '', sessions: [], isFetching: false
    });

    const canView = useMemo(() => user?.permissions?.includes('drivers_view'), [user]);
    const canCreate = useMemo(() => user?.permissions?.includes('drivers_create'), [user]);
    const canEdit = useMemo(() => user?.permissions?.includes('drivers_edit'), [user]);
    const canDelete = useMemo(() => user?.permissions?.includes('drivers_delete'), [user]);

    const loadDrivers = useCallback(async () => {
        if (!canView) return;
        setIsLoading(true);
        try {
            const rawData: any[] = await fetchAllDrivers();
            console.log("📡 [FRONTEND-DEBUG] Raw Drivers Data from API:", rawData);// delete me later
            const transformedDrivers: IDriverGridRow[] = rawData.map((d) => ({
                id: d.kuljId,
                driverId: d.kuljId,
                name: d.nimi,
                phoneNo: d.puhelinNro,
                email: d.email,
                hasAlerts: d.halytys,
                isOnline: !!d.isOnline,
            }));
            setDrivers(transformedDrivers);
        } catch (error: any) {
            enqueueSnackbar(t('feedback.loadFailed'), { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [canView, t, enqueueSnackbar]);

    useEffect(() => {
        if (user) loadDrivers();
    }, [user, loadDrivers]);

    useEffect(() => {
        if (!socket) return;

        const handleStatusUpdate = (data: { userId: number; status: string }) => {
            console.log("📡 Connectivity Status Signal Received:", data);
            setDrivers(prevDrivers => prevDrivers.map(driver => {
                if (Number(driver.driverId) === Number(data.userId)) {
                    return { ...driver, isOnline: data.status === 'online' };
                }
                return driver;
            }));
        };

        socket.on('driverStatusChanged', handleStatusUpdate);
        socket.on('chipLoadUpdated', () => loadDrivers());

        return () => {
            socket.off('driverStatusChanged', handleStatusUpdate);
            socket.off('chipLoadUpdated');
        };
    }, [socket, loadDrivers]);

    const handleViewSessions = async (driver: IDriverGridRow) => {
        setSessionModal({ open: true, driverName: driver.name, sessions: [], isFetching: true });
        try {
            const res = await apiClient.get(`/sessions/active`, { params: { userId: driver.driverId } });
            setSessionModal(prev => ({ ...prev, sessions: res.data || [], isFetching: false }));
        } catch (error) {
            setSessionModal(prev => ({ ...prev, isFetching: false }));
        }
    };

    const handleForceRelease = async (sessionId: number) => {
        try {
            await apiClient.delete(`/sessions/${sessionId}`);
            enqueueSnackbar("Device disconnected", { variant: 'success' });
            setSessionModal(prev => ({ ...prev, sessions: prev.sessions.filter(s => (s.sessionId || s.session_id) !== sessionId) }));
            loadDrivers();
        } catch (error) { enqueueSnackbar("Release failed", { variant: 'error' }); }
    };

    const columns: GridColDef<IDriverGridRow>[] = useMemo(() => [
        {
            field: 'name',
            headerName: t('columns.name'),
            width: 230,
            renderCell: (params) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: '#a38f6d' }}>{params.value.charAt(0)}</Avatar>
                    <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
                </Stack>
            )
        },
        { field: 'phoneNo', headerName: t('columns.phoneNo'), width: 160 },
        { field: 'email', headerName: t('columns.email'), width: 220 },
        {
            field: 'hasAlerts',
            headerName: t('columns.status'),
            width: 120,
            renderCell: (params) => (
                <Chip
                    icon={params.value ? <CheckCircleIcon /> : <CancelIcon />}
                    label={params.value ? "Active" : "Inactive"}
                    color={params.value ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                />
            ),
        },
        {
            field: 'isOnline',
            headerName: 'CONNECTIVITY',
            width: 130,
            align: 'center',
            renderCell: (params: GridRenderCellParams<IDriverGridRow>) => {
                const isActive = params.row.isOnline;
                return (
                    <Tooltip title={isActive ? "Manage Active Sessions (Online)" : "View Sessions (Offline)"}>
                        <IconButton
                            size="small"
                            onClick={() => handleViewSessions(params.row)}
                            sx={{
                                color: isActive ? '#4caf50' : '#f44336',
                                bgcolor: isActive ? alpha('#4caf50', 0.1) : alpha('#f44336', 0.05),
                                '&:hover': { bgcolor: isActive ? alpha('#4caf50', 0.2) : alpha('#f44336', 0.1) },
                                animation: isActive ? "blinker 1.5s linear infinite" : "none",
                                ...animations
                            }}
                        >
                            <DevicesIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                );
            }
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: t('columns.actions'),
            width: 100,
            getActions: ({ row }) => {
                const actions = [];
                if (canEdit) actions.push(<GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={() => { setEditingDriver(row); setIsModalOpen(true); }} />);
                if (canDelete) actions.push(<GridActionsCellItem key="delete" icon={<DeleteIcon color="error" />} label="Delete" onClick={() => setDeleteTarget(row)} />);
                return actions;
            },
        }
    ], [canEdit, canDelete, t]);

    const handleSave = async (data: any, driverId?: number) => {
        setIsSaving(true);
        try {
            const targetId = driverId || editingDriver?.driverId;
            if (targetId) await updateDriver(targetId, data as IUpdateDriverDto);
            else await createDriver(data as ICreateDriverDto);
            enqueueSnackbar(t('feedback.updateSuccess'), { variant: 'success' });
            setIsModalOpen(false); loadDrivers();
        } catch (error: any) { setModalError(error.response?.data?.message || t('feedback.saveFailed')); }
        finally { setIsSaving(false); }
    };

    return (
        <Paper sx={{ p: 3, height: 'calc(100vh - 128px)', width: '100%', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>{t('title')}</Typography>
                    <Typography variant="caption" color="text.secondary">Monitor live connectivity and manage driver fleet</Typography>
                </Box>
                {canCreate && (
                    <Button variant="contained" sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' } }} startIcon={<AddIcon />} onClick={() => { setEditingDriver(null); setIsModalOpen(true); }}>
                        {t('buttons.addDriver')}
                    </Button>
                )}
            </Stack>

            <Box sx={{ height: 'calc(100% - 80px)', width: '100%' }}>
                <DataGrid rows={drivers} columns={columns} density="compact" loading={isLoading} slots={{ toolbar: GridToolbar }} sx={{ border: 'none', '& .MuiDataGrid-columnHeader': { bgcolor: alpha('#a38f6d', 0.05) }, '& .MuiDataGrid-columnHeaderTitle': { fontWeight: '900', fontSize: '0.7rem', textTransform: 'uppercase' } }} />
            </Box>

            <Dialog open={sessionModal.open} onClose={() => setSessionModal({ ...sessionModal, open: false })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
                <DialogTitle sx={{ bgcolor: '#a38f6d', color: 'white' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight={800}>Live Session Manager</Typography>
                        <IconButton onClick={() => setSessionModal({ ...sessionModal, open: false })} sx={{ color: 'white' }}><CloseIcon fontSize="small" /></IconButton>
                    </Stack>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Driver: {sessionModal.driverName}</Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 0, bgcolor: '#fcfcfc', minHeight: '200px' }}>
                    {sessionModal.isFetching ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={30} sx={{ color: '#a38f6d' }} /></Box>
                    ) : sessionModal.sessions.length === 0 ? (
                        <Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">No active devices detected.</Typography></Box>
                    ) : (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="overline" sx={{ px: 1, fontWeight: 800, color: 'text.secondary' }}>Active Connections ({sessionModal.sessions.length})</Typography>
                            <Stack spacing={1.5} sx={{ mt: 1 }}>
                                {sessionModal.sessions.map((s) => {
                                    const device = formatDeviceInfo(s.deviceInfo || s.device_info);
                                    const isSessionOnline = s.isOnline;
                                    return (
                                        <Paper key={s.session_id || s.sessionId} variant="outlined" sx={{ p: 1.5, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: isSessionOnline ? '1px solid #4caf50' : '1px solid #eee' }}>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Box sx={{
                                                    width: 40, height: 40, borderRadius: '10px',
                                                    bgcolor: isSessionOnline ? alpha('#4caf50', 0.1) : alpha('#9e9e9e', 0.1),
                                                    color: isSessionOnline ? '#4caf50' : '#9e9e9e',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    animation: isSessionOnline ? "heartbeat 2s ease-in-out infinite" : "none",
                                                    ...animations
                                                }}>
                                                    {device.icon}
                                                </Box>
                                                <Box>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <DirectionsCarIcon sx={{ fontSize: 14, color: isSessionOnline ? '#4caf50' : 'text.secondary' }} />
                                                        <Typography variant="body2" fontWeight={700}>{s.rekNro || s.rek_nro || 'No Vehicle'}</Typography>
                                                    </Stack>
                                                    <Typography variant="caption" color="text.secondary">{device.label} • {dayjs(s.createdAt || s.created_at).fromNow()}</Typography>
                                                </Box>
                                            </Stack>
                                            <Button size="small" color="error" onClick={() => handleForceRelease(s.session_id || s.sessionId)} startIcon={<LogoutIcon sx={{ fontSize: 14 }} />} sx={{ fontWeight: 'bold', textTransform: 'none' }}>Release</Button>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <DriverFormModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingDriver} isSaving={isSaving} apiError={modalError} />
            <ConfirmationDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
                if (!deleteTarget) return;
                try { await deleteDriver(deleteTarget.driverId); loadDrivers(); } catch (e) { } finally { setDeleteTarget(null); }
            }} title={t('confirmDelete.title')} message={t('confirmDelete.message', { name: deleteTarget?.name })} />
        </Paper>
    );
}