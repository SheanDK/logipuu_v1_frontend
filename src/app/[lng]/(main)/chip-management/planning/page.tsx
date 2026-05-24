// app[lng][(main)]\chip-management\planning\page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import {
    Box, Stack, Typography, Paper, IconButton, TextField, Tooltip, Autocomplete, Tabs, Tab, useTheme,
    CircularProgress, alpha, Button, Divider, TablePagination
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FolderIcon from '@mui/icons-material/Folder';
import ManageGroupsModal from '@/components/chip-order/ManageGroupsModal';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

// Services
import chipPlanningService from '@/services/chipPlanningService';
import chipOrderService from '@/services/chipOrderService';
import chipTitleService from '@/services/chipTitleService';
import * as clientService from '@/services/clientService';
import * as vehicleService from '@/services/vehicleService';
import { IBackendClient } from '@/types';
import ModifyLoadModal from '@/components/chip-order/ModifyLoadModal';
import DeleteConfirmationDialog from '@/components/common/DeleteConfirmationDialog';
import { useTranslation } from '@/i18n/useTranslation';
import PlanningTooltip from '@/components/chip-order/PlanningTooltip';
import useSocket from '@/hooks/useSocket';

// --- Professional Status Styles ---
const getStatusStyles = (status: string, isDarkMode: boolean, transferStatus?: string) => {
    let baseStyles: any = {};
    switch (status) {
        case 'NOT_SENT': // Planned
            baseStyles = {
                bgcolor: isDarkMode ? alpha('#9e9e9e', 0.1) : '#f5f5f5',
                borderLeft: '4px solid #9e9e9e',
                color: isDarkMode ? '#bdbdbd' : '#616161'
            };
            break;
        case 'DISPATCHED': // Sent to Driver (from Office)
            baseStyles = {
                bgcolor: isDarkMode ? alpha('#fbc02d', 0.1) : '#fffdf2',
                borderLeft: '4px solid #fbc02d',
                color: isDarkMode ? '#fff176' : '#827717'
            };
            break;
        case 'LOADED': // Warning-like color (Orange)
            baseStyles = {
                bgcolor: isDarkMode ? alpha('#ed6c02', 0.1) : '#fff4e5',
                borderLeft: '4px solid #ed6c02',
                color: isDarkMode ? '#ffb74d' : '#e65100'
            };
            break;
        case 'UNLOADED': // Info-like color (Blue)
            baseStyles = {
                bgcolor: isDarkMode ? alpha('#0288d1', 0.1) : '#e5f6fd',
                borderLeft: '4px solid #0288d1',
                color: isDarkMode ? '#4fc3f7' : '#01579b'
            };
            break;
        case 'SENT': // Sent to Office (from Driver) / Completed
        case 'COMPLETED':
        case 'DONE':
            baseStyles = {
                bgcolor: isDarkMode ? alpha('#2e7d32', 0.1) : '#edf7ed',
                borderLeft: '4px solid #2e7d32',
                color: isDarkMode ? '#81c784' : '#1b5e20'
            };
            break;
        default:
            baseStyles = {
                bgcolor: isDarkMode ? alpha('#9e9e9e', 0.1) : '#f5f5f5',
                borderLeft: '4px solid #9e9e9e',
                color: isDarkMode ? '#bdbdbd' : '#616161'
            };
    }

    if (transferStatus === 'PENDING') {
        return {
            ...baseStyles,
            border: '2px dashed #ff9800',
            animation: 'pulse 2s infinite'
        };
    }
    return baseStyles;
};

const PlanningPage = () => {
    const { t } = useTranslation(['chip-management', 'common']);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const { enqueueSnackbar } = useSnackbar();

    const [week, setWeek] = useState<number>(dayjs().isoWeek());
    const [year, setYear] = useState<number>(dayjs().year());
    const [vehiclesData, setVehiclesData] = useState<any[]>([]);
    const [titles, setTitles] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [customers, setCustomers] = useState<IBackendClient[]>([]);
    const [allRegisteredVehicles, setAllRegisteredVehicles] = useState<any[]>([]);
    const { socket, isConnected } = useSocket();

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [searchVehicle, setSearchVehicle] = useState('');
    const [searchTitle, setSearchTitle] = useState('');
    const [rightTab, setRightTab] = useState(0);
    const [selectedCustomer, setSelectedCustomer] = useState<IBackendClient | null>(null);
    const [dragOverCell, setDragOverCell] = useState<{ kalustoNro: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(340);
    const [isResizing, setIsResizing] = useState(false);

    const [selectedLoad, setSelectedLoad] = useState<any | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, loadId: number | null }>({ open: false, loadId: null });
    const [dispatchConfirm, setDispatchConfirm] = useState<{ open: boolean, kalustoNro: number | null }>({ open: false, kalustoNro: null });
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 250 && newWidth < 500) setSidebarWidth(newWidth);
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", () => setIsResizing(false));
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", () => setIsResizing(false));
        };
    }, [resize]);

    const fetchData = useCallback(async (isSilent: boolean = false) => {
        if (!isSilent) setLoading(true);
        try {
            const [plan, tts, subs, cls, regs] = await Promise.all([
                chipPlanningService.getWeeklyPlanning(week, year),
                chipTitleService.getAll(),
                chipOrderService.getActive(),
                clientService.fetchAllClients(),
                vehicleService.fetchAllVehicles()
            ]);
            setVehiclesData(plan);
            setTitles(tts);
            setSubscriptions(subs);
            setCustomers(cls);
            setAllRegisteredVehicles(regs);
        } catch (err) { console.error("Fetch error", err); }
        finally {
            if (!isSilent) setLoading(false);
        }
    }, [week, year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Socket listener - real-time updates
    useEffect(() => {
        if (!socket) {
            fetchData(true);
            console.warn("🔌 Socket NOT available in PlanningPage");
            return;
        }

        console.log("🔌 Socket AVAILABLE in PlanningPage. ID:", socket.id);

        // --- 1. Update / Create Handler ---
        socket.on('chipLoadUpdated', (data: any) => {
            console.log("📡 Live Update Received:", data);

            const mappedLoad = {
                ...data,
                loadId: Number(data.load_id || data.loadId),
                vehicleNumber: Number(data.vehicle_number || data.vehicleNumber),
                scheduledDate: data.scheduled_date || data.scheduledDate || data.date,
                actualM3: Number(data.actual_m3 ?? data.actualM3 ?? 0),
                actualTon: Number(data.actual_ton ?? data.actualTon ?? 0),
                actualPcs: Number(data.actual_pcs ?? data.actualPcs ?? 0),
                actualHr: Number(data.actual_hr ?? data.actualHr ?? 0),
                actualKm: Number(data.actual_km ?? data.actualKm ?? 0),
                actualWaiting: Number(data.actual_waiting ?? data.actualWaiting ?? 0),
                actualDetails: data.actual_details || data.actualDetails || data.load_notes || data.loadNotes || '',
                status: data.status,
                serialNo: Number(data.serialNo || data.serial_no || 0)
            };

            const loadMoment = dayjs(mappedLoad.scheduledDate);
            const loadWeek = loadMoment.isoWeek();
            const loadYear = loadMoment.year();

            console.log(`🔍 Checking Load: Week ${loadWeek}, Year ${loadYear} | View: ${week}, ${year}`);

            if (loadWeek !== week || loadYear !== year) return;

            setVehiclesData(prevData => {
                const vehicleExists = prevData.some(v => Number(v.kalustoNro) === mappedLoad.vehicleNumber);

                if (!vehicleExists) {
                    console.log("🆕 Vehicle not in current plan. Fetching full update or appending...");
                    const regVehicle = allRegisteredVehicles.find(r => Number(r.kalustoNro) === mappedLoad.vehicleNumber);
                    if (regVehicle) {
                        return [...prevData, {
                            kalustoNro: mappedLoad.vehicleNumber,
                            rekNro: regVehicle.rekNro,
                            loads: [mappedLoad]
                        }];
                    }
                    return prevData;
                }

                return prevData.map(v => {
                    const currentKalustoNro = Number(v.kalustoNro);

                    if (currentKalustoNro === mappedLoad.vehicleNumber) {
                        const exists = v.loads.some((l: any) => Number(l.loadId) === mappedLoad.loadId);
                        return {
                            ...v,
                            loads: exists
                                ? v.loads.map((l: any) => Number(l.loadId) === mappedLoad.loadId ? { ...l, ...mappedLoad } : l)
                                : [...v.loads, mappedLoad].sort((a, b) => (Number(a.serialNo) || 0) - (Number(b.serialNo) || 0))
                        };
                    }

                    return {
                        ...v,
                        loads: v.loads.filter((l: any) => Number(l.loadId) !== mappedLoad.loadId)
                    };
                });
            });
        });

        // --- 2. Delete Handler ---
        socket.on('chipLoadDeleted', (data: { loadId: number }) => {
            console.log("🗑️ Live Delete Received:", data);
            const targetId = Number(data.loadId);
            setVehiclesData(prevData => prevData.map(v => ({
                ...v,
                loads: v.loads.filter((l: any) => Number(l.loadId) !== targetId)
            })));
        });

        return () => {
            socket.off('chipLoadUpdated');
            socket.off('chipLoadDeleted');
        };
    }, [socket, week, year, allRegisteredVehicles]);

    const filteredVehicleList = useMemo(() => {
        return allRegisteredVehicles
            .filter(v => (v.rekNro || '').toLowerCase().includes(searchVehicle.toLowerCase()) && v.aktiivinen)
            .map(regV => {
                const plan = vehiclesData.find(p => p.kalustoNro === regV.kalustoNro);
                return {
                    ...regV,
                    groupName: regV.planning_group || regV.planningGroup || t('common.general', 'General'),
                    loads: plan?.loads || []
                };
            });
    }, [allRegisteredVehicles, vehiclesData, searchVehicle]);

    const groupedVehicles = useMemo(() => {
        const paginatedList = filteredVehicleList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
        const grouped = paginatedList.reduce((acc: any, v: any) => {
            const group = v.groupName || t('common.general', 'General');
            if (!acc[group]) acc[group] = [];
            acc[group].push(v);
            return acc;
        }, {});
        return Object.keys(grouped).sort().reduce((obj: any, key) => { obj[key] = grouped[key]; return obj; }, {});
    }, [filteredVehicleList, page, rowsPerPage]);

    // --- Drag & Drop Handlers ---

    const onSidebarDragStart = (e: React.DragEvent, item: any, type: 'title' | 'sub') => {
        if (!item) return;
        if (type === 'title') {
            const tId = item.title_id || item.titleId;
            if (tId) e.dataTransfer.setData("titleId", tId.toString());
        } else {
            const oId = item.orderId || item.order_id;
            const tId = item.titleId || item.title_id;
            if (oId) e.dataTransfer.setData("orderId", oId.toString());
            if (tId) e.dataTransfer.setData("titleId", tId.toString());
        }
    };

    const onLoadDragStart = (e: React.DragEvent, load: any) => {
        if (!load || !load.loadId) return;
        e.dataTransfer.setData("moveLoadId", load.loadId.toString());
    };

    const onDrop = async (e: React.DragEvent, vehicle: any) => {
        e.preventDefault();
        setDragOverCell(null);
        const titleId = e.dataTransfer.getData("titleId");
        const orderId = e.dataTransfer.getData("orderId");
        const moveLoadId = e.dataTransfer.getData("moveLoadId");
        const targetDate = dayjs().year(year).isoWeek(week).startOf('isoWeek').format('YYYY-MM-DD');

        try {
            if (moveLoadId) {
                await chipPlanningService.moveLoad({ loadId: Number(moveLoadId), newKalustoNro: vehicle.kalustoNro, newDate: targetDate });
            } else if (titleId) {
                await chipPlanningService.assignTitle({ kalusto_nro: vehicle.kalustoNro, title_id: Number(titleId), order_id: orderId ? Number(orderId) : null, pvm: targetDate });
            }
            fetchData(true);
        } catch (err: any) {
            console.error("Drop error", err);
            const msg = err.response?.data?.error || err.message || t('error.operationFailed', 'Operation failed');
            enqueueSnackbar(msg, { variant: 'error' });
        }
    };

    const handleDispatchRow = (kalustoNro: number) => {
        setDispatchConfirm({ open: true, kalustoNro });
    };

    const handleActualDispatch = async () => {
        if (!dispatchConfirm.kalustoNro) return;
        try {
            await chipPlanningService.dispatchRow(dispatchConfirm.kalustoNro, week, year);
            setDispatchConfirm({ open: false, kalustoNro: null });
            fetchData(true);
        } catch (err) { console.error(err); }
    };

    const StatusLegend = ({ color, label }: { color: string, label: string }) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: '2px', border: '1px solid rgba(0,0,0,0.1)' }} />
            <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase' }}>
                {label}
            </Typography>
        </Stack>
    );

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 110px)', bgcolor: isDarkMode ? 'background.default' : '#f4f7f9', p: 1, gap: 1, overflow: 'hidden' }}>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.2, overflow: 'hidden', minWidth: 0 }}>

                {/* Toolbar */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 1.2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '30%' }}>
                        <TextField
                            size="small" fullWidth
                            placeholder={t('chip-management:planning.searchVehicles')}
                            value={searchVehicle} onChange={(e) => { setSearchVehicle(e.target.value); setPage(0); }}
                            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
                        />
                        <Tooltip title={isConnected ? t('chip-management:planning.liveConnectionActive') : t('chip-management:planning.tryingToConnect')}>
                            <Box sx={{
                                width: 10, height: 10, borderRadius: '50%',
                                bgcolor: isConnected ? '#4caf50' : '#f44336',
                                boxShadow: isConnected ? `0 0 8px #4caf50` : 'none',
                                ml: 1, flexShrink: 0
                            }} />
                        </Tooltip>
                    </Stack>
                    {/* Week Selector */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                            bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#f0f2f5',
                            p: 0.5,
                            borderRadius: '10px'
                        }}>
                        <IconButton
                            size="small"
                            onClick={() => setWeek(w => w - 1)}
                            sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.1) : '#fff', boxShadow: 1 }}>
                            <ArrowBackIosNewIcon fontSize="inherit" />
                        </IconButton>
                        <Typography
                            variant="body2"
                            fontWeight="800"
                            sx={{ px: 2, minWidth: 110, textAlign: 'center' }}>
                            {t('chip-management:planning.week').toUpperCase()} {week}, {year}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => setWeek(w => w + 1)}
                            sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.1) : '#fff', boxShadow: 1 }}>
                            <ArrowForwardIosIcon fontSize="inherit" />
                        </IconButton>
                    </Stack>
                    {/* color Legend */}
                    <Stack direction="row" spacing={2}
                        sx={{
                            bgcolor: alpha(theme.palette.divider, 0.05),
                            px: 2,
                            py: 0.8,
                            borderRadius: '8px',
                            border: "1px dashed",
                            borderColor: 'divider'
                        }}>
                        <StatusLegend color="#9e9e9e" label={t('chip-management:planning.planned')} />
                        <StatusLegend color="#fbc02d" label={t('chip-management:planning.dispatched')} />
                        <StatusLegend color="#ed6c02" label={t('chip-management:planning.loaded')} />
                        <StatusLegend color="#0288d1" label={t('chip-management:planning.unloaded')} />
                        <StatusLegend color="#2e7d32" label={t('chip-management:planning.doneSent')} />
                    </Stack>
                    {/* Vehicle Grouping Button */}
                    <Stack
                        direction="row"
                        spacing={1}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FolderIcon />}
                            onClick={() => setGroupModalOpen(true)}
                            sx={{ color: '#a38f6d', borderColor: '#a38f6d', fontWeight: 'bold' }}>
                            {t('chip-management:planning.common.buttons.vehicleGrouping')}
                        </Button>
                    </Stack>
                </Paper>

                {/* Simplified Weekly Grid */}
                <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>

                    {/* Header Row */}
                    <Box sx={{ display: 'flex', bgcolor: isDarkMode ? '#1e1e1e' : '#f8f9fa', borderBottom: '2px solid', borderColor: 'divider', position: 'sticky', top: 0, zIndex: 10 }}>
                        <Box sx={{ width: 148, p: 1.5, fontWeight: '900', fontSize: '11px', color: 'text.secondary', textTransform: 'uppercase' }}>
                            {t('chip-management:planning.headers.vehicle')}
                        </Box>
                        <Box sx={{ flex: 1, p: 1.5, fontWeight: '900', fontSize: '11px', color: '#a38f6d', textTransform: 'uppercase', textAlign: 'center', borderLeft: '1px solid', borderColor: 'divider' }}>
                            {t('chip-management:planning.headers.weeklyAssignments')} ({t('chip-management:planning.week')} {week})
                        </Box>
                        <Box sx={{ width: 79, textAlign: 'center', p: 1.5, fontSize: '11px', fontWeight: '900', borderLeft: '1px solid', borderColor: 'divider', color: 'text.secondary' }}>
                            {t('chip-management:planning.headers.send')}
                        </Box>
                    </Box>

                    {/* Data Area */}
                    <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                        {loading ? <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress size={30} /></Box> :
                            Object.entries(groupedVehicles).map(([groupName, vehicles]) => (
                                <Box key={groupName}>
                                    <Box onClick={() => setExpandedGroups(prev => prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName])}
                                        sx={{ display: 'flex', alignItems: 'center', p: 0.8, px: 2, bgcolor: alpha('#a38f6d', 0.1), borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer' }}>
                                        {expandedGroups.includes(groupName) ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                                        <FolderIcon sx={{ color: '#a38f6d', mx: 1.5, fontSize: 18 }} />
                                        <Typography variant="caption" fontWeight="900" sx={{ color: '#a38f6d' }}>{groupName.toUpperCase()} ({(vehicles as any[]).length})</Typography>
                                    </Box>

                                    {expandedGroups.includes(groupName) && (vehicles as any[]).map((v: any) => (
                                        <Box key={v.kalustoNro} sx={{ display: 'flex', width: '100%', borderBottom: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                                            <Box sx={{ width: 150, p: 1.5, bgcolor: isDarkMode ? alpha('#fff', 0.01) : '#fafafa', borderRight: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <LocalShippingIcon sx={{ color: '#a38f6d', fontSize: 18 }} />
                                                <Box sx={{ overflow: 'hidden' }}>
                                                    <Typography variant="body2" fontWeight="800" sx={{ fontSize: '11px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{v.rekNro}</Typography>
                                                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '9px', fontWeight: 'bold' }}>#{v.kalustoNro}</Typography>
                                                </Box>
                                            </Box>

                                            <Box
                                                onDragOver={(e) => { e.preventDefault(); setDragOverCell({ kalustoNro: v.kalustoNro }); }}
                                                onDragLeave={() => setDragOverCell(null)}
                                                onDrop={(e) => onDrop(e, v)}
                                                sx={{
                                                    flex: 1, p: 1, display: 'flex', flexWrap: 'wrap', gap: 1.2, minHeight: 75,
                                                    bgcolor: dragOverCell?.kalustoNro === v.kalustoNro ? alpha('#a38f6d', 0.05) : 'transparent'
                                                }}
                                            >
                                                {v.loads.map((load: any) => (
                                                    <Tooltip key={load.loadId} enterDelay={400} title={<PlanningTooltip load={load} vehicle={v.rekNro} />} slotProps={{ tooltip: { sx: { p: 0, bgcolor: 'transparent' } } }}>
                                                        <Paper
                                                            draggable={!['LOADED', 'UNLOADED', 'SENT'].includes(load.status)}
                                                            onDragStart={(e) => onLoadDragStart(e, load)}
                                                            onClick={(e) => {
                                                                if (!['LOADED', 'UNLOADED', 'SENT'].includes(load.status)) {
                                                                    setSelectedLoad({ ...load, rekNro: v.rekNro });
                                                                    setEditModalOpen(true);
                                                                } else {
                                                                    console.log("🚫 Load is locked due to status:", load.status);
                                                                }
                                                            }}
                                                            sx={{
                                                                ...getStatusStyles(load.status, isDarkMode, load.transferStatus || load.transfer_status),
                                                                p: 0.8,
                                                                minWidth: 105,
                                                                borderRadius: '6px',
                                                                cursor: ['LOADED', 'UNLOADED', 'SENT'].includes(load.status) ? 'not-allowed' : 'grab',
                                                                position: 'relative',
                                                                opacity: ['LOADED', 'UNLOADED', 'SENT'].includes(load.status) ? 0.85 : 1,
                                                                overflow: 'visible',
                                                                boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                                                                '&:hover .del-mark': { opacity: 1 }
                                                            }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <Typography sx={{ fontSize: '9px', fontWeight: '900', lineHeight: 1.1 }}>{(load.abbreviation || 'CHIP').toUpperCase()}</Typography>
                                                                {(load.transferStatus === 'PENDING' || load.transfer_status === 'PENDING') && (
                                                                    <Typography sx={{ fontSize: '7px', fontWeight: '900', color: '#ff9800', bgcolor: alpha('#ff9800', 0.1), px: 0.4, borderRadius: '2px', textTransform: 'uppercase' }}>
                                                                        {t('common.pending', 'Pending')}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                            <Typography sx={{ fontSize: '8px', fontWeight: '700', opacity: 0.8 }}>
                                                                {load.actualM3 > 0 ? `${load.actualM3}m³` : `${t('chip-management:planning.qty')}: ${load.targetQty || 0}`}
                                                            </Typography>
                                                            {['NOT_SENT', 'DISPATCHED'].includes(load.status) && (
                                                                <IconButton
                                                                    className="del-mark" size="small"
                                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, loadId: load.loadId }); }}
                                                                    sx={{ position: 'absolute', top: -8, right: -8, opacity: 0, bgcolor: isDarkMode ? '#333' : '#fff', border: '1px solid', borderColor: 'divider', boxShadow: 2, p: 0.2, '&:hover': { bgcolor: '#ffebee' } }}
                                                                >
                                                                    <CloseIcon sx={{ fontSize: 10, color: '#d32f2f' }} />
                                                                </IconButton>
                                                            )}
                                                        </Paper>
                                                    </Tooltip>
                                                ))}
                                            </Box>

                                            <Box sx={{ width: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid', borderColor: 'divider' }}>
                                                <IconButton size="small" color="primary" disabled={!v.loads.some((l: any) => l.status === 'NOT_SENT')} onClick={() => handleDispatchRow(v.kalustoNro)}>
                                                    <SendIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ))
                        }
                    </Box>

                    {/* Pagination Footer */}
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', bgcolor: isDarkMode ? alpha('#fff', 0.01) : '#f8f9fa', px: 2 }}>
                        <TablePagination
                            component="div"
                            count={filteredVehicleList.length}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            labelRowsPerPage={t('chip-management:pagination.rowsPerPage')}
                        />
                    </Box>
                </Paper>
            </Box>

            {/* Resize Handle */}
            <Box onMouseDown={() => setIsResizing(true)} sx={{ width: '6px', cursor: 'col-resize', bgcolor: isResizing ? '#a38f6d' : 'transparent', '&:hover': { bgcolor: alpha('#a38f6d', 0.3) }, mx: '1px' }} />

            {/* Sidebar */}
            <Paper elevation={0} sx={{ width: sidebarWidth, minWidth: 280, display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper' }}>
                <Tabs value={rightTab} onChange={(_, v) => setRightTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label={t('chip-management:planning.tabs.subs')} sx={{ fontWeight: '800', fontSize: '12px' }} />
                    <Tab label={t('chip-management:planning.tabs.titles')} sx={{ fontWeight: '800', fontSize: '12px' }} />
                </Tabs>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Autocomplete options={customers} size="small" getOptionLabel={(o) => o.asiakkaanNimi || ''} value={selectedCustomer} onChange={(_, v) => setSelectedCustomer(v)} renderInput={(p) => <TextField {...p} label={t('chip-management:modal.customer')} />} />
                    <TextField fullWidth size="small" placeholder={t('chip-management:planning.search')} value={searchTitle} onChange={(e) => setSearchTitle(e.target.value)} InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} /> }} />
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {rightTab === 0 ? (
                        subscriptions.filter(s => !selectedCustomer || s.customerName === selectedCustomer.asiakkaanNimi).map((s, idx) => {
                            const remainingQty = Number(s.targetQty || 0) - Number(s.scheduledCount || 0);
                            return (
                                <Paper key={s.orderId || `sub-${idx}`} draggable onDragStart={(e) => remainingQty > 0 ? onSidebarDragStart(e, s, 'sub') : e.preventDefault()}
                                    sx={{ p: 1.5, borderRadius: '10px', cursor: remainingQty > 0 ? 'grab' : 'not-allowed', border: '1px solid', borderColor: 'divider', borderLeft: `5px solid ${remainingQty > 0 ? '#a38f6d' : '#ccc'}`, opacity: remainingQty > 0 ? 1 : 0.6, '&:hover': { boxShadow: 3 } }}>
                                    <Typography variant="caption" fontWeight="900" color="primary" display="block">{s.customerName}</Typography>
                                    <Typography variant="body2" fontWeight="800">{s.abbreviation || s.productType}</Typography>
                                    <Stack direction="row" justifyContent="space-between" mt={1}>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: remainingQty > 0 ? '#2e7d32' : '#d32f2f' }}>{t('chip-management:planning.remaining')}: {remainingQty}</Typography>
                                        <Typography variant="caption" sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.1) : '#f0f2f5', px: 1, borderRadius: '4px' }}>{t('chip-management:planning.total')}: {s.targetQty}</Typography>
                                    </Stack>
                                </Paper>
                            );
                        })
                    ) : (
                        titles.filter(t => (!selectedCustomer || t.customer_name === selectedCustomer.asiakkaanNimi) && (t.title_name || '').toLowerCase().includes(searchTitle.toLowerCase())).map((ti, idx) => (
                            <Paper key={ti.title_id || `ti-${idx}`} draggable onDragStart={(e) => onSidebarDragStart(e, ti, 'title')}
                                sx={{ p: 1.5, borderRadius: '10px', cursor: 'grab', border: '1px solid', borderColor: 'divider', borderLeft: '5px solid #a38f6d', '&:hover': { boxShadow: 3 } }}>
                                <Typography variant="body2" fontWeight="800" color="primary">{ti.abbreviation || 'CHIP'}</Typography>
                                <Typography variant="caption" fontWeight="700" display="block">{ti.title_name}</Typography>
                            </Paper>
                        ))
                    )}
                </Box>
            </Paper>

            {/* Modals & Dialogs */}
            <ModifyLoadModal
                open={editModalOpen}
                loadData={selectedLoad}
                onClose={() => {
                    setEditModalOpen(false);
                    fetchData(true);
                }}
                onSave={async (id: number, notes: string) => { await chipPlanningService.updateLoad(id, { driverNotes: notes }); setEditModalOpen(false); fetchData(); }}
                onDelete={(id: number) => setDeleteConfirm({ open: true, loadId: id })} />

            <DeleteConfirmationDialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, loadId: null })}
                onConfirm={async () => {
                    if (deleteConfirm.loadId) {
                        try {
                            await chipPlanningService.deleteLoad(deleteConfirm.loadId);
                            setDeleteConfirm({ open: false, loadId: null });
                            fetchData(true);
                        } catch (err) { }
                    }
                }}
                title={t('chip-management:planning.deleteDialog.title')}
                message={t('chip-management:planning.deleteDialog.message')} />

            <DeleteConfirmationDialog
                open={dispatchConfirm.open}
                onClose={() => setDispatchConfirm({ open: false, kalustoNro: null })}
                onConfirm={handleActualDispatch}
                title={t('chip-management:planning.dispatchDialog.title')}
                message={t('chip-management:planning.dispatchDialog.message')}
                confirmButtonText={t('common:buttons.send')}
                confirmButtonColor="primary" />

            <ManageGroupsModal open={groupModalOpen} onClose={() => setGroupModalOpen(false)} vehicles={allRegisteredVehicles} onUpdate={fetchData} />
        </Box >
    );
};

export default PlanningPage;