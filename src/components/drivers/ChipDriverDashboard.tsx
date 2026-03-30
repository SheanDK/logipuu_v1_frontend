// frontend/src/components/drivers/ChipDriverDashboard.tsx
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    InputAdornment,
    Paper,
    Popover,
    Stack,
    TextField,
    Tooltip,
    Typography,
    TablePagination,
    alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import SendIcon from '@mui/icons-material/Send';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import dayjs, { Dayjs } from 'dayjs';
import { useDriverSession } from '@/contexts/DriverSessionContext';
import { useTranslation } from '@/i18n/useTranslation';
import chipService from '@/services/chipPlanningService';
import { useSnackbar } from 'notistack';
import useSocket from '@/hooks/useSocket';
import TransferRequestPopup from './TransferRequestPopup';
import { useAuth } from '@/contexts/AuthContext';


type ChipLoadStatus = 'NOT_SENT' | 'LOADED' | 'UNLOADED' | 'SENT';

interface DriverChipLoad {
    load_id: number;
    title_id: number;
    vehicle_number: number;
    order_id: number | null;
    scheduled_date: string;
    serial_no: number;
    status: ChipLoadStatus;
    started_at: string | null;
    completed_at: string | null;
    actual_ton: number | null;
    actual_m3: number | null;
    actual_pcs: number | null;
    actual_hr: number | null;
    actual_km: number | null;
    actual_waiting: number | null;
    actual_details: string;
    load_notes?: string | null;
    is_sent_from_app: boolean;
    title_name?: string;
    invoicing_basis?: string | null;
    driver_instructions?: string | null;
    req_pcs?: boolean;
    req_m3?: boolean;
    req_ton?: boolean;
    req_hr?: boolean;
    req_waiting?: boolean;
    req_km?: boolean;
    req_details?: boolean;
    req_details_info?: string | null;
    loading_point_id?: number | null;
    loading_point_name?: string | null;
    loading_point_lat?: number | null;
    loading_point_lng?: number | null;
    unloading_point_id?: number | null;
    unloading_point_name?: string | null;
    unloading_point_lat?: number | null;
    unloading_point_lng?: number | null;
    product_number?: string | null;
    product_name?: string | null;
    abbreviation?: string | null;
}

interface ChipDriverDashboardProps {
    onBackAction: () => void;
}

const getWeekStart = (date: Dayjs): Dayjs => {
    const day = date.day();
    const daysFromMonday = (day + 6) % 7;
    return date.startOf('day').subtract(daysFromMonday, 'day');
};
const getISOWeekAndYear = (date: Date): { week: number; year: number } => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { week, year: d.getUTCFullYear() };
};

const normalizeStatus = (raw: any): ChipLoadStatus => {
    const value = String(raw ?? 'NOT_SENT').toUpperCase();
    if (value === 'LOADED' || value === 'UNLOADED' || value === 'SENT') {
        return value;
    }
    return 'NOT_SENT';
};

const mapApiLoad = (raw: any): DriverChipLoad => {
    const loadId = Number(raw.load_id ?? raw.loadId ?? 0);
    return {
        load_id: loadId,
        title_id: Number(raw.title_id ?? raw.titleId ?? 0),
        vehicle_number: Number(raw.vehicle_number ?? raw.vehicleNumber ?? raw.kalusto_nro ?? 0),
        order_id: raw.order_id ?? raw.orderId ?? null,
        scheduled_date: String(raw.scheduled_date ?? raw.scheduledDate ?? raw.pvm ?? ''),
        serial_no: Number(raw.serial_no ?? raw.serialNo ?? 0),
        status: normalizeStatus(raw.status),
        started_at: raw.started_at ?? raw.startedAt ?? null,
        completed_at: raw.completed_at ?? raw.completedAt ?? null,
        actual_ton: raw.actual_ton != null ? Number(raw.actual_ton) : (raw.actualTon != null ? Number(raw.actualTon) : null),
        actual_m3: raw.actual_m3 != null ? Number(raw.actual_m3) : (raw.actualM3 != null ? Number(raw.actualM3) : null),
        actual_pcs: raw.actual_pcs != null ? Number(raw.actual_pcs) : (raw.actualPcs != null ? Number(raw.actualPcs) : null),
        actual_hr: raw.actual_hr != null ? Number(raw.actual_hr) : (raw.actualHr != null ? Number(raw.actualHr) : null),
        actual_km: raw.actual_km != null ? Number(raw.actual_km) : (raw.actualKm != null ? Number(raw.actualKm) : null),
        actual_waiting: raw.actual_waiting != null ? Number(raw.actual_waiting) : (raw.actualWaiting != null ? Number(raw.actualWaiting) : null),
        actual_details: String(raw.actual_details ?? raw.actualDetails ?? raw.driver_notes ?? raw.driverNotes ?? ''),
        load_notes: raw.load_notes ?? raw.loadNotes ?? null,
        is_sent_from_app: Boolean(raw.is_sent_from_app ?? raw.isSentFromApp ?? false),
        title_name: raw.title_name ?? raw.titleName ?? null,
        invoicing_basis: raw.invoicing_basis ?? raw.invoicingBasis ?? null,
        driver_instructions: raw.driver_instructions ?? raw.driverInstructions ?? null,
        req_pcs: Boolean(raw.req_pcs ?? raw.reqPcs ?? false),
        req_m3: Boolean(raw.req_m3 ?? raw.reqM3 ?? false),
        req_ton: Boolean(raw.req_ton ?? raw.reqTon ?? false),
        req_hr: Boolean(raw.req_hr ?? raw.reqHr ?? false),
        req_waiting: Boolean(raw.req_waiting ?? raw.reqWaiting ?? false),
        req_km: Boolean(raw.req_km ?? raw.reqKm ?? false),
        req_details: Boolean(raw.req_details ?? raw.reqDetails ?? false),
        req_details_info: raw.req_details_info ?? raw.reqDetailsInfo ?? null,
        loading_point_id: raw.loading_point_id ?? raw.loadingPointId ?? null,
        loading_point_name: raw.loading_point_name ?? raw.loadingPointName ?? null,
        loading_point_lat: raw.loading_point_lat != null ? Number(raw.loading_point_lat) : (raw.loadingPointLat != null ? Number(raw.loadingPointLat) : (raw.loading_lat != null ? Number(raw.loading_lat) : null)),
        loading_point_lng: raw.loading_point_lng != null ? Number(raw.loading_point_lng) : (raw.loading_point_long != null ? Number(raw.loading_point_long) : (raw.loadingPointLng != null ? Number(raw.loadingPointLng) : (raw.loadingPointLong != null ? Number(raw.loadingPointLong) : (raw.loading_lng != null ? Number(raw.loading_lng) : (raw.loading_long != null ? Number(raw.loading_long) : null))))),
        unloading_point_id: raw.unloading_point_id ?? raw.unloadingPointId ?? null,
        unloading_point_name: raw.unloading_point_name ?? raw.unloadingPointName ?? null,
        unloading_point_lat: raw.unloading_point_lat != null ? Number(raw.unloading_point_lat) : (raw.unloadingPointLat != null ? Number(raw.unloadingPointLat) : (raw.unloading_lat != null ? Number(raw.unloading_lat) : null)),
        unloading_point_lng: raw.unloading_point_lng != null ? Number(raw.unloading_point_lng) : (raw.unloading_point_long != null ? Number(raw.unloading_point_long) : (raw.unloadingPointLng != null ? Number(raw.unloadingPointLng) : (raw.unloadingPointLong != null ? Number(raw.unloadingPointLong) : (raw.unloading_lng != null ? Number(raw.unloading_lng) : (raw.unloading_long != null ? Number(raw.unloading_long) : null))))),
        product_number: raw.product_number ?? raw.productNumber ?? null,
        product_name: raw.product_name ?? raw.productName ?? null,
        abbreviation: raw.abbreviation ?? null
    };
};

const isSameOrAfter = (value: Dayjs, compare: Dayjs) => value.isAfter(compare) || value.isSame(compare, 'day');
const isSameOrBefore = (value: Dayjs, compare: Dayjs) => value.isBefore(compare) || value.isSame(compare, 'day');
const formatCoords = (lat?: number | null, lng?: number | null): string => {
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return '-';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export default function ChipDriverDashboard({ onBackAction }: ChipDriverDashboardProps) {
    const { user } = useAuth();
    const { selectedVehicleId } = useDriverSession();
    const { t, i18n } = useTranslation(['chipDriver', 'chipPlanning', 'notifications', 'common']);
    const { enqueueSnackbar } = useSnackbar();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // --- REALTIME UPDATES ---
    const recipientUserId = user?.driverNumericId;
    const { socket } = useSocket(recipientUserId);

    const initialWeekStart = useMemo(() => getWeekStart(dayjs()), []);
    const [weekStart, setWeekStart] = useState<Dayjs>(initialWeekStart);
    const [allLoads, setAllLoads] = useState<DriverChipLoad[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [instructionAnchorEl, setInstructionAnchorEl] = useState<HTMLElement | null>(null);
    const [instructionPayload, setInstructionPayload] = useState<{ instructions?: string | null; labelKey?: string } | null>(null);
    // Transfer Request
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [pendingRequest, setPendingRequest] = useState<any>(null);

    const weekStartDate = useMemo(() => weekStart.startOf('day'), [weekStart]);
    const weekEndDate = useMemo(() => weekStart.add(6, 'day').endOf('day'), [weekStart]);
    const weekStartDateStr = useMemo(() => weekStartDate.format('YYYY-MM-DD'), [weekStartDate]);
    const weekEndDateStr = useMemo(() => weekEndDate.format('YYYY-MM-DD'), [weekEndDate]);
    const isoWeekInfo = useMemo(() => getISOWeekAndYear(weekStartDate.toDate()), [weekStartDate]);

    useEffect(() => {
        setPage(0);
    }, [weekStart]);

    const fetchLoads = useCallback(async (isSilent: boolean = false) => {
        if (!selectedVehicleId) return;
        if (!isSilent) setIsLoading(true);
        try {
            const raw = await chipService.getDriverLoads({
                vehicleNumber: Number(selectedVehicleId),
                startDate: weekStartDateStr,
                endDate: weekEndDateStr,
                week: isoWeekInfo.week,
                year: isoWeekInfo.year,
                ts: Date.now()
            });
            const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.loads) ? raw.loads : []);
            setAllLoads(items.map(mapApiLoad).filter((x: DriverChipLoad) => x.load_id > 0 && x.scheduled_date));
        } catch (error) {
            console.error('Failed to fetch chip loads', error);
            enqueueSnackbar(t('messages.loadFailed', { defaultValue: 'Failed to load chip loads.' }), { variant: 'error' });
            setAllLoads([]);
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [enqueueSnackbar, isoWeekInfo.week, isoWeekInfo.year, selectedVehicleId, t, weekEndDateStr, weekStartDateStr]);

    useEffect(() => {
        if (!socket) return;
        socket.on('chipLoadUpdated', handleUpdate);
        socket.on('chipLoadDeleted', handleDeletion);
        socket.on('newNotification', handleNewNotification);

        return () => {
            socket.off('chipLoadUpdated', handleUpdate);
            socket.off('chipLoadDeleted', handleDeletion);
            socket.off('newNotification', handleNewNotification);
        };


    }, [socket, fetchLoads]);

    const handleNewNotification = (notification: any) => {
        const currentUserId = user?.driverNumericId;
        const recipientId = notification.recipient_user_id || notification.recipientUserId || notification.user_id;
        console.log("🚀 Popup Triggered! Received:", notification);
        console.log("🚀 Popup Triggered! Received:", currentUserId);
        console.log("🚀 Popup Triggered! Received:", recipientId);

        if (Number(recipientId) === Number(currentUserId)) {

            if (notification.type === 'LOAD_DELETED' || notification.type === 'LOAD_ASSIGNED') {
                setPendingRequest(notification);
                setIsPopupOpen(true);

                if (window.navigator.vibrate) window.navigator.vibrate(300);
            }

        }
        fetchLoads(true);
    };


    const handleUpdate = (data: any) => {
        setAllLoads(prevLoads => {
            const loadId = Number(data.load_id || data.loadId);
            const existingLoad = prevLoads.find(l => l.load_id === loadId);

            if (existingLoad) {
                const incomingLoad = mapApiLoad(data);

                const isLoadActive = ['NOT_SENT', 'LOADED', 'UNLOADED'].includes(existingLoad.status);

                return prevLoads.map(load => {
                    if (load.load_id === loadId) {
                        const mergedLoad: DriverChipLoad = {
                            ...load,
                            title_id: incomingLoad.title_id,
                            vehicle_number: incomingLoad.vehicle_number,
                            order_id: incomingLoad.order_id,
                            scheduled_date: incomingLoad.scheduled_date,
                            serial_no: incomingLoad.serial_no,
                            status: incomingLoad.status,
                            started_at: incomingLoad.started_at,
                            completed_at: incomingLoad.completed_at,
                            load_notes: incomingLoad.load_notes,
                            is_sent_from_app: incomingLoad.is_sent_from_app,
                        };

                        if (!isLoadActive) {
                            mergedLoad.actual_ton = incomingLoad.actual_ton;
                            mergedLoad.actual_m3 = incomingLoad.actual_m3;
                            mergedLoad.actual_pcs = incomingLoad.actual_pcs;
                            mergedLoad.actual_hr = incomingLoad.actual_hr;
                            mergedLoad.actual_km = incomingLoad.actual_km;
                            mergedLoad.actual_waiting = incomingLoad.actual_waiting;
                            mergedLoad.actual_details = incomingLoad.actual_details;
                        }

                        return mergedLoad;
                    }
                    return load;
                });
            } else {
                fetchLoads(true);
                return prevLoads;
            }
        });
    };

    const handleDeletion = (data: { loadId: number }) => {
        setAllLoads(prev => prev.filter(load => load.load_id !== Number(data.loadId)));
    };



    // 2. Action Handler
    const handlePopupAcknowledge = async () => {
        const notifId = pendingRequest?.notification_id || pendingRequest?.notificationId;

        try {
            if (notifId) {
                await chipService.markNotificationAsRead(Number(notifId));
                window.dispatchEvent(new Event('refreshNotifications'));
            }

            setIsPopupOpen(false);
            setPendingRequest(null);

            fetchLoads(true);

        } catch (error) {
            console.error("Acknowledge failed:", error);
        }
    };


    useEffect(() => {
        let active = true;
        const loadData = async () => {
            if (!selectedVehicleId) {
                setAllLoads([]);
                return;
            }
            setIsLoading(true);
            try {
                const raw = await chipService.getDriverLoads({
                    vehicleNumber: Number(selectedVehicleId),
                    startDate: weekStartDateStr,
                    endDate: weekEndDateStr,
                    week: isoWeekInfo.week,
                    year: isoWeekInfo.year,
                    ts: Date.now()
                });
                if (!active) return;
                const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.loads) ? raw.loads : []);
                setAllLoads(items.map(mapApiLoad).filter((x: DriverChipLoad) => x.load_id > 0 && x.scheduled_date));
            } catch (error) {
                if (!active) return;
                console.error('Failed to fetch chip loads', error);
                enqueueSnackbar(t('messages.loadFailed', { defaultValue: 'Failed to load chip loads.' }), { variant: 'error' });
                setAllLoads([]);
            } finally {
                if (active) setIsLoading(false);
            }
        };
        loadData();
        return () => {
            active = false;
        };
    }, [enqueueSnackbar, isoWeekInfo.week, isoWeekInfo.year, selectedVehicleId, t, weekEndDateStr, weekStartDateStr]);

    const currentWeekLoads = useMemo(() => {
        return allLoads.filter((load) => {
            const scheduled = dayjs(load.scheduled_date);
            if (!scheduled.isValid()) return false;

            const inWeek = isSameOrAfter(scheduled, weekStartDate) && isSameOrBefore(scheduled, weekEndDate);
            return inWeek;
        });
    }, [allLoads, weekEndDate, weekStartDate]);

    const paginatedLoads = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return currentWeekLoads.slice(startIndex, startIndex + rowsPerPage);
    }, [currentWeekLoads, page, rowsPerPage]);

    const updateLoad = (loadId: number, updater: (load: DriverChipLoad) => DriverChipLoad) => {
        setAllLoads((prev) => prev.map((load) => (load.load_id === loadId ? updater(load) : load)));
    };

    const parseNumberOrNull = (value: string): number | null => {
        if (!value.trim()) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };

    const handleNumberChange = (
        loadId: number,
        field: 'actual_ton' | 'actual_m3' | 'actual_pcs' | 'actual_hr' | 'actual_km' | 'actual_waiting',
        value: string
    ) => {
        const parsedValue = parseNumberOrNull(value);
        updateLoad(loadId, (load) => ({ ...load, [field]: parsedValue }));
    };

    const handleDetailsChange = (loadId: number, value: string) => {
        updateLoad(loadId, (load) => ({ ...load, actual_details: value }));
    };

    const persistMetricsBeforeSend = async (load: DriverChipLoad) => {
        const payload = {
            loadId: load.load_id,
            actual_ton: load.actual_ton,
            actual_m3: load.actual_m3,
            actual_pcs: load.actual_pcs,
            actual_hr: load.actual_hr,
            actual_km: load.actual_km,
            actual_waiting: load.actual_waiting,
            actual_details: load.actual_details
        };
        await chipService.setLoad(payload);
    };

    const getInvoicingBasisField = (basis: string | null | undefined): string | null => {
        const normalized = String(basis ?? '').toUpperCase();
        if (normalized.includes('TON')) return 'actual_ton';
        if (normalized.includes('M3')) return 'actual_m3';
        if (normalized.includes('PCS') || normalized.includes('KPL')) return 'actual_pcs';
        if (normalized.includes('KM')) return 'actual_km';
        if (normalized.includes('HR') || normalized.includes('HOUR') || normalized === 'H') return 'actual_hr';
        if (normalized.includes('WAIT')) return 'actual_waiting';
        if (normalized.includes('DETAIL')) return 'actual_details';
        return null;
    };

    const handleLoad = (loadId: number) => {
        const payload = {
            started_at: new Date().toISOString(),
            status: 'LOADED'
        };
        updateLoad(loadId, (load) => ({
            ...load,
            started_at: load.started_at ?? payload.started_at,
            status: 'LOADED'
        }));
        chipService.setLoad({ loadId, ...payload }).catch((err) => console.error('Failed to update load state', err));
    };

    const handleUnload = (loadId: number) => {
        const payload = {
            completed_at: new Date().toISOString(),
            status: 'UNLOADED'
        };
        updateLoad(loadId, (load) => ({
            ...load,
            completed_at: payload.completed_at,
            status: 'UNLOADED'
        }));
        chipService.setLoad({ loadId, ...payload }).catch((err) => console.error('Failed to update load state', err));
    };

    const isNumericFilled = (value: number | null | undefined) => value != null && !Number.isNaN(value);
    const isTextFilled = (value: string | null | undefined) => Boolean(value && value.trim().length > 0);
    const hasRequiredFieldsFilled = (load: DriverChipLoad): boolean => {
        if (load.req_ton && !isNumericFilled(load.actual_ton)) return false;
        if (load.req_m3 && !isNumericFilled(load.actual_m3)) return false;
        if (load.req_pcs && !isNumericFilled(load.actual_pcs)) return false;
        if (load.req_hr && !isNumericFilled(load.actual_hr)) return false;
        if (load.req_km && !isNumericFilled(load.actual_km)) return false;
        if (load.req_waiting && !isNumericFilled(load.actual_waiting)) return false;
        if (load.req_details && !isTextFilled(load.actual_details)) return false;
        return true;
    };

    const canSend = (load: DriverChipLoad): boolean =>
        load.status === 'UNLOADED' &&
        !load.is_sent_from_app &&
        hasRequiredFieldsFilled(load);

    const handleSend = async (loadId: number) => {
        const target = allLoads.find((x) => x.load_id === loadId);
        if (!target) return;
        if (!canSend(target)) return;
        const payload = {
            status: 'SENT',
            is_sent_from_app: true
        };
        try {
            await persistMetricsBeforeSend(target);
        } catch (err) {
            console.error('Failed to persist load metrics before send', err);
        }
        updateLoad(loadId, (load) => ({
            ...load,
            status: 'SENT',
            is_sent_from_app: true
        }));
        chipService.setLoad({ loadId, ...payload }).catch((err) => console.error('Failed to send load', err));
    };

    const handleSendAll = async () => {
        const sendableLoads = currentWeekLoads.filter(canSend);
        const loadIds = sendableLoads.map((load) => load.load_id);
        if (sendableLoads.length === 0) return;

        await Promise.allSettled(sendableLoads.map((load) => persistMetricsBeforeSend(load)));

        setAllLoads((prev) =>
            prev.map((load) =>
                loadIds.includes(load.load_id) ? { ...load, status: 'SENT', is_sent_from_app: true } : load
            )
        );
        Promise.allSettled(loadIds.map((id) => chipService.setLoad({ loadId: id, status: 'SENT', is_sent_from_app: true })))
            .catch((err) => console.error('Failed to send all loads', err));
    };

    const sendableCount = currentWeekLoads.filter(canSend).length;

    const getStatusColor = (status: ChipLoadStatus): 'default' | 'warning' | 'info' | 'success' => {
        if (status === 'NOT_SENT') return 'default';
        if (status === 'LOADED') return 'warning';
        if (status === 'UNLOADED') return 'info';
        return 'success';
    };

    const handleOpenInstructions = (
        event: React.MouseEvent<HTMLElement>,
        payload: { instructions?: string | null; labelKey?: string }
    ) => {
        setInstructionAnchorEl(event.currentTarget);
        setInstructionPayload(payload);
    };

    const handleCloseInstructions = () => {
        setInstructionAnchorEl(null);
        setInstructionPayload(null);
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* --- INJECTED POPUP COMPONENT --- */}
            <TransferRequestPopup
                open={isPopupOpen}
                data={pendingRequest}
                onAcknowledge={handlePopupAcknowledge}
            />

            <Paper sx={{ p: 1.5, flexShrink: 0 }}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', md: 'center' }}
                >
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            {t('title')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('subtitle')}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<NavigateBeforeIcon />}
                            onClick={() => setWeekStart((prev) => prev.subtract(1, 'week'))}
                        >
                            {t('buttons.previousWeek')}
                        </Button>
                        <Button
                            variant="outlined"
                            endIcon={<NavigateNextIcon />}
                            onClick={() => setWeekStart((prev) => prev.add(1, 'week'))}
                        >
                            {t('buttons.nextWeek')}
                        </Button>
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={<SendIcon />}
                            onClick={handleSendAll}
                            disabled={sendableCount === 0}
                        >
                            {t('buttons.sendAll')} ({sendableCount})
                        </Button>
                        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBackAction}>
                            {t('common:buttons.back')}
                        </Button>
                    </Stack>
                </Stack>

                <Typography sx={{ mt: 1 }} variant="subtitle2">
                    {t('labels.week')}:{' '}
                    <strong>
                        {weekStart.locale(i18n.language).format('DD.MM.YYYY')} -{' '}
                        {weekStart.add(6, 'day').locale(i18n.language).format('DD.MM.YYYY')}
                    </strong>
                </Typography>
            </Paper>
            {/* flex-grow: 1; overflow-y: auto; */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
                <Stack spacing={1.2}>
                    {isLoading ? (
                        <Paper sx={{ p: 2 }}>
                            <Typography color="text.secondary">{t('messages.loading', { defaultValue: 'Loading...' })}</Typography>
                        </Paper>
                    ) : (
                        <>
                            {currentWeekLoads.length === 0 && (
                                <Paper sx={{ p: 2 }}>
                                    <Typography color="text.secondary">{t('messages.noLoadsThisWeek')}</Typography>
                                </Paper>
                            )}
                        </>)}

                    {currentWeekLoads
                        .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                        .map((load) => {
                            const isSent = load.status === 'SENT' || load.is_sent_from_app;
                            const primaryField = getInvoicingBasisField(load.invoicing_basis);
                            const productLabel =
                                load.product_name ||
                                load.product_number ||
                                load.abbreviation ||
                                '-';
                            const highlightSx = (field: string) => ({
                                ...(primaryField === field
                                    ? {
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(76, 175, 80, 0.16)',
                                            borderColor: 'rgba(56, 142, 60, 0.45)',
                                            fontWeight: 700
                                        }
                                    }
                                    : {})
                            });

                            return (
                                <Card key={load.load_id} variant="outlined">
                                    <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                                        <Stack
                                            direction={{ xs: 'column', md: 'row' }}
                                            spacing={0.5}
                                            justifyContent="space-between"
                                            alignItems={{ xs: 'flex-start', md: 'center' }}
                                            mb={0.75}
                                        >
                                            <Box>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                        {(load.serial_no ?? 0) + 1} - {load.title_name || '-'} - {productLabel}
                                                    </Typography>
                                                    <IconButton
                                                        size="medium"
                                                        sx={{
                                                            p: 0.35,
                                                            visibility: load.driver_instructions ? 'visible' : 'hidden'
                                                        }}
                                                        onClick={(e) =>
                                                            load.driver_instructions
                                                                ? handleOpenInstructions(e, {
                                                                    instructions: load.driver_instructions,
                                                                    labelKey: 'labels.titleInstructions'
                                                                })
                                                                : undefined
                                                        }
                                                        aria-label={t('labels.titleInstructions')}
                                                        disabled={!load.driver_instructions}
                                                    >
                                                        <InfoOutlinedIcon sx={{ fontSize: 21 }} />
                                                    </IconButton>
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {t('labels.scheduledDate')}:{' '}
                                                    {dayjs(load.scheduled_date).locale(i18n.language).format('ddd DD.MM.YYYY')}
                                                    {'  '}| {t('buttons.load')}: {load.started_at ? dayjs(load.started_at).locale(i18n.language).format('DD.MM.YYYY HH:mm') : '-'}
                                                    {'  '}| {t('buttons.unload')}: {load.completed_at ? dayjs(load.completed_at).locale(i18n.language).format('DD.MM.YYYY HH:mm') : '-'}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        mt: 0.5,
                                                        px: 0.75,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        backgroundColor: 'rgba(25,118,210,0.06)',
                                                        display: 'grid',
                                                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                                        gap: 0.5
                                                    }}
                                                >
                                                    <Stack spacing={0.1}>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <LoginIcon fontSize="inherit" sx={{ color: 'primary.main' }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                                {t('labels.loadingPoint')}:
                                                            </Typography>
                                                            <Typography variant="caption">{load.loading_point_name || '-'}</Typography>
                                                        </Stack>
                                                        <Typography variant="caption" color="text.secondary" sx={{ pl: 2.5 }}>
                                                            {formatCoords(load.loading_point_lat, load.loading_point_lng)}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack spacing={0.1}>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <LogoutIcon fontSize="inherit" sx={{ color: 'warning.main' }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                                {t('labels.unloadingPoint')}:
                                                            </Typography>
                                                            <Typography variant="caption">{load.unloading_point_name || '-'}</Typography>
                                                        </Stack>
                                                        <Typography variant="caption" color="text.secondary" sx={{ pl: 2.5 }}>
                                                            {formatCoords(load.unloading_point_lat, load.unloading_point_lng)}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Box>
                                            <Chip
                                                size="small"
                                                label={t(`statuses.${load.status}`)}
                                                color={getStatusColor(load.status)}
                                                sx={{ width: 110, justifyContent: 'center' }}
                                            />
                                        </Stack>

                                        <Box
                                            sx={{
                                                display: 'flex',
                                                gap: 0.75,
                                                alignItems: 'center',
                                                flexWrap: 'nowrap',
                                                '& .MuiTextField-root .MuiInputBase-root': {
                                                    height: 40
                                                },
                                                '& .MuiButton-root': {
                                                    height: 40,
                                                    minHeight: 40
                                                }
                                            }}
                                        >
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<LocalShippingIcon />}
                                                onClick={() => handleLoad(load.load_id)}
                                                disabled={isSent || load.status === 'LOADED' || load.status === 'UNLOADED'}
                                            >
                                                {t('buttons.load')}
                                            </Button>
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    p: 0.35,
                                                    visibility: load.load_notes ? 'visible' : 'hidden'
                                                }}
                                                onClick={(e) =>
                                                    load.load_notes
                                                        ? handleOpenInstructions(e, {
                                                            instructions: load.load_notes,
                                                            labelKey: 'labels.loadInstructions'
                                                        })
                                                        : undefined
                                                }
                                                aria-label={t('labels.loadInstructions')}
                                                disabled={!load.load_notes}
                                            >
                                                <InfoOutlinedIcon sx={{ fontSize: 20 }} />
                                            </IconButton>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    gap: 0.75,
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                    flexGrow: 1,
                                                    ml: 2
                                                }}
                                            >
                                                {load.req_ton && (
                                                    <TextField
                                                        sx={highlightSx('actual_ton')}
                                                        label={t('labels.actualTon')}
                                                        type="number"
                                                        size="small"
                                                        value={load.actual_ton ?? ''}
                                                        onChange={(e) => handleNumberChange(load.load_id, 'actual_ton', e.target.value)}
                                                        onBlur={() => chipService.setLoad({ loadId: load.load_id, actual_ton: load.actual_ton }).catch((err) => console.error('Failed to save actual_ton', err))}
                                                        disabled={isSent}
                                                        slotProps={{ htmlInput: { style: { width: 72 } } }}
                                                    />
                                                )}
                                                {load.req_m3 && (
                                                    <TextField
                                                        sx={highlightSx('actual_m3')}
                                                        label={t('labels.actualM3')}
                                                        type="number"
                                                        size="small"
                                                        value={load.actual_m3 ?? ''}
                                                        onChange={(e) => handleNumberChange(load.load_id, 'actual_m3', e.target.value)}
                                                        onBlur={() => chipService.setLoad({ loadId: load.load_id, actual_m3: load.actual_m3 }).catch((err) => console.error('Failed to save actual_m3', err))}
                                                        disabled={isSent}
                                                        slotProps={{ htmlInput: { style: { width: 72 } } }}
                                                    />
                                                )}
                                                {load.req_pcs && (
                                                    <TextField
                                                        sx={highlightSx('actual_pcs')}
                                                        label={t('labels.actualPcs')}
                                                        type="number"
                                                        size="small"
                                                        value={load.actual_pcs ?? ''}
                                                        onChange={(e) => handleNumberChange(load.load_id, 'actual_pcs', e.target.value)}
                                                        onBlur={() => chipService.setLoad({ loadId: load.load_id, actual_pcs: load.actual_pcs }).catch((err) => console.error('Failed to save actual_pcs', err))}
                                                        disabled={isSent}
                                                        slotProps={{ htmlInput: { style: { width: 72 } } }}
                                                    />
                                                )}
                                                {load.req_hr && (
                                                    <TextField
                                                        sx={highlightSx('actual_hr')}
                                                        label={t('labels.actualHr')}
                                                        type="number"
                                                        size="small"
                                                        value={load.actual_hr ?? ''}
                                                        onChange={(e) => handleNumberChange(load.load_id, 'actual_hr', e.target.value)}
                                                        onBlur={() => chipService.setLoad({ loadId: load.load_id, actual_hr: load.actual_hr }).catch((err) => console.error('Failed to save actual_hr', err))}
                                                        disabled={isSent}
                                                        slotProps={{ htmlInput: { style: { width: 72 } } }}
                                                    />
                                                )}
                                                {load.req_km && (
                                                    <TextField
                                                        sx={highlightSx('actual_km')}
                                                        label={t('labels.actualKm')}
                                                        type="number"
                                                        size="small"
                                                        value={load.actual_km ?? ''}
                                                        onChange={(e) => handleNumberChange(load.load_id, 'actual_km', e.target.value)}
                                                        onBlur={() => chipService.setLoad({ loadId: load.load_id, actual_km: load.actual_km }).catch((err) => console.error('Failed to save actual_km', err))}
                                                        disabled={isSent}
                                                        slotProps={{ htmlInput: { style: { width: 72 } } }}
                                                    />
                                                )}
                                                {load.req_waiting && (
                                                    <TextField
                                                        sx={highlightSx('actual_waiting')}
                                                        label={t('labels.actualWaiting')}
                                                        type="number"
                                                        size="small"
                                                        value={load.actual_waiting ?? ''}
                                                        onChange={(e) => handleNumberChange(load.load_id, 'actual_waiting', e.target.value)}
                                                        onBlur={() => chipService.setLoad({ loadId: load.load_id, actual_waiting: load.actual_waiting }).catch((err) => console.error('Failed to save actual_waiting', err))}
                                                        disabled={isSent}
                                                        slotProps={{ htmlInput: { style: { width: 72 } } }}
                                                    />
                                                )}

                                                {load.req_details && (
                                                    <TextField
                                                        sx={{ minWidth: { xs: 160, md: 220 }, ...highlightSx('actual_details') }}
                                                        label={t('labels.details')}
                                                        size="small"
                                                        value={load.actual_details}
                                                        onChange={(e) => handleDetailsChange(load.load_id, e.target.value)}
                                                        onBlur={() => chipService.setLoad({ loadId: load.load_id, actual_details: load.actual_details }).catch((err) => console.error('Failed to save details', err))}
                                                        disabled={isSent}
                                                        slotProps={{
                                                            input: load.req_details_info
                                                                ? {
                                                                    endAdornment: (
                                                                        <InputAdornment position="end">
                                                                            <Tooltip
                                                                                title={<Typography variant="body2">{load.req_details_info}</Typography>}
                                                                                arrow
                                                                                placement="top"
                                                                            >
                                                                                <IconButton
                                                                                    size="small"
                                                                                    sx={{ cursor: 'pointer' }}
                                                                                    aria-label={t('labels.detailsInfo')}
                                                                                >
                                                                                    <InfoOutlinedIcon fontSize="small" color="primary" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </InputAdornment>
                                                                    )
                                                                }
                                                                : undefined
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', ml: 'auto' }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="secondary"
                                                    startIcon={<MoveToInboxIcon />}
                                                    onClick={() => handleUnload(load.load_id)}
                                                    disabled={isSent || load.status !== 'LOADED'}
                                                >
                                                    {t('buttons.unload')}
                                                </Button>
                                                <Tooltip
                                                    arrow
                                                    placement="top"
                                                    title={
                                                        canSend(load)
                                                            ? ''
                                                            : t('messages.sendRequiresRequiredInfo', {
                                                                defaultValue: 'Fill all required information and unload first.'
                                                            })
                                                    }
                                                >
                                                    <span>
                                                        <Button
                                                            variant="contained"
                                                            color="warning"
                                                            size="small"
                                                            startIcon={<SendIcon />}
                                                            onClick={() => handleSend(load.load_id)}
                                                            disabled={!canSend(load)}
                                                        >
                                                            {t('buttons.send')}
                                                        </Button>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}
                </Stack>
            </Box>

            {/* --- UPDATE 2: Footer Pagination Component (පහළින්ම එක් කරන ලදී) --- */}
            {!isLoading && currentWeekLoads.length > 0 && (
                <Paper
                    elevation={3}
                    variant="outlined"
                    sx={{
                        flexShrink: 0, // footer එක හැකිලීම වළක්වයි
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : '#fdfdfd',
                        mt: 1
                    }}
                >
                    <TablePagination
                        component="div"
                        count={currentWeekLoads.length}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25]}
                        labelRowsPerPage={t('chip-management:pagination.rowsPerPage', { defaultValue: 'Rows:' })}
                        sx={{
                            borderTop: 'none',
                            '.MuiTablePagination-toolbar': { minHeight: '48px' }
                        }}
                    />
                </Paper>
            )}
            <Popover
                open={Boolean(instructionAnchorEl)}
                anchorEl={instructionAnchorEl}
                onClose={handleCloseInstructions}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ sx: { p: 1.25, maxWidth: 360 } }}
            >
                {instructionPayload?.instructions && (
                    <Typography variant="body2">
                        <strong>{t(instructionPayload.labelKey || 'labels.titleInstructions')}:</strong> {instructionPayload.instructions}
                    </Typography>
                )}
            </Popover>
        </Box>
    );
}
