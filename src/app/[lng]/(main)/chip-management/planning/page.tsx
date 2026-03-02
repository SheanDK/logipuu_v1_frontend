// app[lng][(main)]\chip-management\planning\page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Stack, Typography, Paper, IconButton, TextField,
    InputAdornment, Tooltip, Autocomplete, Tabs, Tab, useTheme,
    CircularProgress, alpha, Button, Divider, TableContainer
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderIcon from '@mui/icons-material/Folder';
import ManageGroupsModal from '@/components/chip-order/ManageGroupsModal';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';

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

// --- Professional Status Styles ---
const getStatusStyles = (status: string, isDarkMode: boolean) => {
    switch (status) {
        case 'NOT_SENT': return { bgcolor: isDarkMode ? alpha('#e53935', 0.15) : '#fff5f5', borderLeft: '4px solid #e53935', color: isDarkMode ? '#ff8a80' : '#b71c1c' };
        case 'DISPATCHED': return { bgcolor: isDarkMode ? alpha('#fbc02d', 0.15) : '#fffdf2', borderLeft: '4px solid #fbc02d', color: isDarkMode ? '#fff176' : '#827717' };
        case 'LOADED': return { bgcolor: isDarkMode ? alpha('#1976d2', 0.15) : '#e3f2fd', borderLeft: '4px solid #1976d2', color: isDarkMode ? '#90caf9' : '#0d47a1' };
        case 'COMPLETED': return { bgcolor: isDarkMode ? alpha('#43a047', 0.15) : '#ebf7ee', borderLeft: '4px solid #43a047', color: isDarkMode ? '#a5d6a7' : '#1b5e20' };
        default: return { bgcolor: isDarkMode ? alpha('#9e9e9e', 0.15) : '#f5f5f5', borderLeft: '4px solid #9e9e9e', color: isDarkMode ? '#bdbdbd' : '#616161' };
    }
};

const PlanningPage = () => {
    const { t } = useTranslation(['chip-management', 'common']);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const [week, setWeek] = useState<number>(dayjs().isoWeek());
    const [year, setYear] = useState<number>(dayjs().year());

    const [vehiclesData, setVehiclesData] = useState<any[]>([]);
    const [titles, setTitles] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [customers, setCustomers] = useState<IBackendClient[]>([]);
    const [allRegisteredVehicles, setAllRegisteredVehicles] = useState<any[]>([]);

    const [rightTab, setRightTab] = useState(0);
    const [selectedCustomer, setSelectedCustomer] = useState<IBackendClient | null>(null);
    const [dragOverCell, setDragOverCell] = useState<{ kalustoNro: number, date: string } | null>(null);
    const [searchTitle, setSearchTitle] = useState('');
    const [searchVehicle, setSearchVehicle] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(360);
    const [isResizing, setIsResizing] = useState(false);

    const [selectedLoad, setSelectedLoad] = useState<any | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, loadId: number | null }>({ open: false, loadId: null });
    const [dispatchConfirm, setDispatchConfirm] = useState<{ open: boolean, kalustoNro: number | null }>({ open: false, kalustoNro: null });

    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // Sidebar Resize Logic
    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 280 && newWidth < 600) setSidebarWidth(newWidth);
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

    const weekDates = useMemo(() => {
        const startOfWeek = dayjs().year(year).isoWeek(week).startOf('isoWeek');
        return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day').format('YYYY-MM-DD'));
    }, [week, year]);

    const fetchData = useCallback(async () => {
        setLoading(true);
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
        finally { setLoading(false); }
    }, [week, year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const displayVehicles = useMemo(() => {
        return allRegisteredVehicles
            .filter(v => (v.rekNro || '').toLowerCase().includes(searchVehicle.toLowerCase()) && v.aktiivinen)
            .map(regV => {
                // Backend planning service එකෙන් එන දත්ත සොයා ගැනීම
                const plan = vehiclesData.find(p => p.kalustoNro === regV.kalustoNro);
                return {
                    ...regV,
                    // වැදගත්: Backend එකෙන් එන planning_group අගය මෙහි පවතින බව තහවුරු කරයි
                    groupName: regV.planning_group || regV.planningGroup || 'General',
                    loads: plan?.loads || []
                };
            });
    }, [allRegisteredVehicles, vehiclesData, searchVehicle]);

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
        if (!load) return;
        e.dataTransfer.setData("moveLoadId", load.loadId.toString());
    };

    const onDrop = async (e: React.DragEvent, vehicle: any, date: string) => {
        e.preventDefault();
        setDragOverCell(null);
        const titleId = e.dataTransfer.getData("titleId");
        const orderId = e.dataTransfer.getData("orderId");
        const moveLoadId = e.dataTransfer.getData("moveLoadId");

        try {
            if (moveLoadId) {
                await chipPlanningService.moveLoad({ loadId: Number(moveLoadId), newKalustoNro: vehicle.kalustoNro, newDate: date });
            } else if (titleId) {
                await chipPlanningService.assignTitle({ kalusto_nro: vehicle.kalustoNro, title_id: Number(titleId), order_id: orderId ? Number(orderId) : null, pvm: date });
            }
            fetchData();
        } catch (err) { console.error("Drop error", err); }
    };

    const handleDispatchRow = (kalustoNro: number) => {
        setDispatchConfirm({ open: true, kalustoNro });
    };

    // Dispatch logic
    const handleActualDispatch = async () => {
        if (!dispatchConfirm.kalustoNro) return;
        try {
            await chipPlanningService.dispatchRow(dispatchConfirm.kalustoNro, week, year);
            setDispatchConfirm({ open: false, kalustoNro: null });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]
        );
    };

    // Group Vehicles logic
    const groupedVehicles = useMemo(() => {
        const list = displayVehicles;
        const grouped = list.reduce((acc: any, v: any) => {
            // මෙහිදී groupName අගය භාවිතා කරයි
            const group = v.groupName || 'General';
            if (!acc[group]) acc[group] = [];
            acc[group].push(v);
            return acc;
        }, {});

        // කාණ්ඩ අකාරාදී පිළිවෙලට Sort කිරීම (Alphabetical Sort)
        return Object.keys(grouped).sort().reduce((obj: any, key) => {
            obj[key] = grouped[key];
            return obj;
        }, {});
    }, [displayVehicles]);

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 110px)', bgcolor: isDarkMode ? 'background.default' : '#f4f7f9', p: 1.5, gap: 1, overflow: 'hidden' }}>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden', minWidth: 0 }}>

                {/* Dashboard Toolbar (Refresh, Grouping buttons ආදිය පවතින පරිදිම) */}
                <Paper elevation={0} sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={2} sx={{ width: '40%' }}>
                        <TextField
                            size="small" fullWidth
                            placeholder={t('chip-management:planning.searchVehicles')}
                            value={searchVehicle}
                            onChange={(e) => setSearchVehicle(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                                sx: { borderRadius: '8px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff' }
                            }}
                        />
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#f0f2f5', p: 0.5, borderRadius: '10px' }}>
                        <IconButton size="small" onClick={() => setWeek(w => w - 1)} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#fff', boxShadow: 1, '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#f5f5f5' } }}><ArrowBackIosNewIcon fontSize="inherit" /></IconButton>
                        <Typography variant="body2" fontWeight="800" sx={{ px: 2, minWidth: 120, textAlign: 'center' }}>
                            {t('chip-management:planning.week').toUpperCase()} {week}, {year}
                        </Typography>
                        <IconButton size="small" onClick={() => setWeek(w => w + 1)} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#fff', boxShadow: 1, '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#f5f5f5' } }}><ArrowForwardIosIcon fontSize="inherit" /></IconButton>
                    </Stack>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined" size="small"
                            startIcon={<ViewColumnIcon />}
                            onClick={() => setGroupModalOpen(true)}
                            sx={{ borderColor: '#a38f6d', color: '#a38f6d', fontWeight: 'bold' }}
                        >
                            {t('chip-management:planning.common.buttons.vehicleGrouping')}
                        </Button>

                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={fetchData}
                            sx={{ bgcolor: '#a38f6d', borderRadius: '8px', fontWeight: 'bold', '&:hover': { bgcolor: '#8c7a5d' } }}
                        >
                            {t('chip-management:planning.common.buttons.refresh')}
                        </Button>
                    </Box>
                </Paper>

                {/* Planning Grid Container */}
                <Paper elevation={0} sx={{ flex: 1, overflow: 'hidden', borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                        <TableContainer sx={{ width: '100%', overflowX: 'hidden' }}>
                            {/* Table Header Row */}
                            <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 20, bgcolor: isDarkMode ? 'background.paper' : '#fff', borderBottom: '2px solid', borderColor: 'divider' }}>
                                <Box sx={{ width: 160, minWidth: 160, p: 2, fontWeight: '900', color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase' }}>
                                    {t('chip-management:planning.vehicle')}
                                </Box>
                                {days.map((day, i) => (
                                    <Box key={day} sx={{ flex: 1, textAlign: 'center', p: 1, borderLeft: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: '900', color: '#a38f6d', textTransform: 'uppercase', fontSize: '10px' }}>
                                            {t(`chip-management:planning.days.${day}`).substring(0, 3)}
                                        </Typography>
                                        <Typography variant="body2" fontWeight="700" sx={{ fontSize: '11px', opacity: 0.6 }}>
                                            {dayjs(weekDates[i]).format('DD.MM')}
                                        </Typography>
                                    </Box>
                                ))}
                                <Box sx={{ width: 60, textAlign: 'center', p: 2, fontWeight: '900', color: 'text.secondary', fontSize: '11px', borderLeft: '1px solid', borderColor: 'divider' }}>
                                    {t('chip-management:planning.table.send')}
                                </Box>
                            </Box>

                            {/* Grouped Data Area */}
                            {loading ? (
                                <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress size={30} sx={{ color: '#a38f6d' }} /></Box>
                            ) : (
                                Object.entries(groupedVehicles).map(([groupName, vehicles]: [string, any]) => {
                                    const isExpanded = expandedGroups.includes(groupName);
                                    return (
                                        <Box key={groupName}>
                                            {/* Folder Header Row */}
                                            <Box
                                                onClick={() => toggleGroup(groupName)}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', p: 1, px: 2,
                                                    bgcolor: alpha('#a38f6d', 0.1), borderBottom: '1px solid', borderColor: 'divider',
                                                    cursor: 'pointer', transition: '0.2s', '&:hover': { bgcolor: alpha('#a38f6d', 0.2) }
                                                }}
                                            >
                                                {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                                                <FolderIcon sx={{ color: '#a38f6d', mx: 1, fontSize: 18 }} />
                                                <Typography variant="caption" fontWeight="900" sx={{ color: '#a38f6d', textTransform: 'uppercase' }}>
                                                    {groupName} ({vehicles.length})
                                                </Typography>
                                            </Box>

                                            {/* Vehicles In This Group (Visible only if expanded) */}
                                            {isExpanded && vehicles.map((v: any) => (
                                                <Box key={v.kalustoNro} sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                                                    {/* Vehicle Side-cell පවතින කේතය එලෙසම භාවිතා කර ඇත */}
                                                    <Box sx={{ width: 160, minWidth: 160, p: 2, bgcolor: isDarkMode ? alpha('#fff', 0.02) : '#fafafa', borderRight: '2px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <LocalShippingIcon sx={{ color: '#a38f6d', fontSize: 20 }} />
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="800" sx={{ lineHeight: 1.2 }}>{v.rekNro}</Typography>
                                                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>#{v.kalustoNro}</Typography>
                                                        </Box>
                                                    </Box>

                                                    {/* Planning Cells (7 Days) පවතින කේතය එලෙසම භාවිතා කර ඇත */}
                                                    {weekDates.map((date) => {
                                                        const dayLoads = v.loads.filter((l: any) => l.date === date);
                                                        const isHovered = dragOverCell?.kalustoNro === v.kalustoNro && dragOverCell?.date === date;
                                                        return (
                                                            <Box key={date}
                                                                onDragOver={(e) => { e.preventDefault(); setDragOverCell({ kalustoNro: v.kalustoNro, date }); }}
                                                                onDragLeave={() => setDragOverCell(null)}
                                                                onDrop={(e) => onDrop(e, v, date)}
                                                                sx={{
                                                                    flex: 1, minHeight: 100, p: 0.8, borderRight: '1px solid', borderColor: alpha(theme.palette.divider, 0.5),
                                                                    display: 'flex', flexDirection: 'column', gap: 0.8,
                                                                    bgcolor: isHovered ? alpha('#a38f6d', 0.1) : 'transparent',
                                                                    transition: 'background-color 0.2s'
                                                                }}>
                                                                {dayLoads.map((load: any) => (
                                                                    <Tooltip key={load.loadId} enterDelay={400} title={<PlanningTooltip load={load} vehicle={v.rekNro} />} slotProps={{ tooltip: { sx: { p: 0, bgcolor: 'transparent' } } }}>
                                                                        <Paper
                                                                            draggable elevation={0}
                                                                            onDragStart={(e) => onLoadDragStart(e, load)}
                                                                            onClick={() => { setSelectedLoad({ ...load, rekNro: v.rekNro }); setEditModalOpen(true); }}
                                                                            sx={{
                                                                                ...getStatusStyles(load.status, isDarkMode), p: 1, borderRadius: '6px', cursor: 'grab', position: 'relative',
                                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.04)', transition: 'transform 0.1s',
                                                                                '&:hover': { transform: 'scale(1.02)', boxShadow: 2, '& .del-btn': { opacity: 1 } }
                                                                            }}
                                                                        >
                                                                            <Typography sx={{ fontSize: '10px', fontWeight: '900', mb: 0.3 }}>{load.abbreviation || 'CHIP'}</Typography>
                                                                            <Typography sx={{ fontSize: '9px', fontWeight: '600', opacity: 0.7 }}>
                                                                                {load.actualM3 > 0 ? `${load.actualM3}m³` : `${t('chip-management:planning.qty')}: ${load.weeklyDist?.[dayjs(load.date).format('dddd')]?.qty || load.targetQty || 0}`}
                                                                            </Typography>
                                                                            <IconButton
                                                                                className="del-btn" size="small"
                                                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, loadId: load.loadId }); }}
                                                                                sx={{ position: 'absolute', top: -6, right: -6, opacity: 0, bgcolor: isDarkMode ? 'grey.900' : '#fff', boxShadow: 1, p: 0.2, '&:hover': { bgcolor: isDarkMode ? 'grey.800' : '#ffebee' } }}
                                                                            >
                                                                                <CloseIcon sx={{ fontSize: 10, color: '#d32f2f' }} />
                                                                            </IconButton>
                                                                        </Paper>
                                                                    </Tooltip>
                                                                ))}
                                                            </Box>
                                                        );
                                                    })}

                                                    {/* Dispatch Action Column */}
                                                    <Box sx={{ width: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid', borderColor: 'divider', bgcolor: isDarkMode ? alpha('#fff', 0.01) : '#f9f9f9' }}>
                                                        <IconButton
                                                            size="small" color="primary"
                                                            disabled={!v.loads.some((l: any) => l.status === 'NOT_SENT')}
                                                            onClick={() => handleDispatchRow(v.kalustoNro)}
                                                        >
                                                            <SendIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    );
                                })
                            )}
                        </TableContainer>
                    </Box>
                </Paper>
            </Box>

            {/* Resize Divider */}
            <Box
                onMouseDown={() => setIsResizing(true)}
                sx={{
                    width: '6px', cursor: 'col-resize', transition: '0.2s', borderRadius: '10px',
                    bgcolor: isResizing ? '#a38f6d' : 'transparent', '&:hover': { bgcolor: alpha('#a38f6d', 0.3) }, mx: '2px'
                }}
            />

            {/* --- Right Sidebar Section --- */}
            <Paper elevation={0} sx={{ width: sidebarWidth, minWidth: 280, display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper' }}>
                <Tabs value={rightTab} onChange={(_, v) => setRightTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { fontWeight: '800', fontSize: '12px' } }}>
                    <Tab label={t('chip-management:planning.tabs.subs')} />
                    <Tab label={t('chip-management:planning.tabs.titles')} />
                </Tabs>

                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Autocomplete
                        options={customers} size="small"
                        getOptionLabel={(o) => o.asiakkaanNimi || ''}
                        value={selectedCustomer}
                        onChange={(_, v) => setSelectedCustomer(v)}
                        renderInput={(p) => <TextField {...p} label={t('chip-management:modal.customer')} sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }} />}
                    />
                    <TextField
                        fullWidth size="small"
                        placeholder={t('common:search')}
                        value={searchTitle}
                        onChange={(e) => setSearchTitle(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />,
                            sx: { borderRadius: '8px' }
                        }}
                    />
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {rightTab === 0 ? (
                        subscriptions.filter(s => !selectedCustomer || s.customerName === selectedCustomer.asiakkaanNimi).map((s, idx) => {
                            const remainingQty = Number(s.targetQty || 0) - Number(s.scheduledCount || 0);
                            return (
                                <Paper
                                    key={s.orderId || `sub-${idx}`}
                                    draggable
                                    onDragStart={(e) => remainingQty > 0 ? onSidebarDragStart(e, s, 'sub') : e.preventDefault()}
                                    sx={{
                                        p: 1.5, borderRadius: '10px', cursor: remainingQty > 0 ? 'grab' : 'not-allowed',
                                        border: '1px solid', borderColor: 'divider', transition: '0.2s',
                                        opacity: remainingQty > 0 ? 1 : 0.6,
                                        borderLeft: `5px solid ${remainingQty > 0 ? '#a38f6d' : '#ccc'}`,
                                        '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' }
                                    }}
                                >
                                    <Typography variant="caption" fontWeight="900" color="primary" sx={{ display: 'block', mb: 0.5 }}>{s.customerName}</Typography>
                                    <Typography variant="body2" fontWeight="800" sx={{ mb: 1 }}>{s.abbreviation || s.productType}</Typography>
                                    <Divider sx={{ mb: 1, opacity: 0.5 }} />
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: remainingQty > 0 ? '#2e7d32' : '#d32f2f' }}>
                                            {t('chip-management:planning.remaining')}: {remainingQty}
                                        </Typography>
                                        <Typography variant="caption" sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.1) : '#f0f2f5', px: 1, borderRadius: '4px', fontWeight: 'bold' }}>
                                            {t('chip-management:planning.total')}: {s.targetQty}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            );
                        })
                    ) : (
                        titles.filter(t => (!selectedCustomer || t.customer_name === selectedCustomer.asiakkaanNimi) && (t.title_name || '').toLowerCase().includes(searchTitle.toLowerCase())).map((ti, idx) => (
                            <Paper
                                key={ti.title_id || `ti-${idx}`} draggable
                                onDragStart={(e) => onSidebarDragStart(e, ti, 'title')}
                                sx={{
                                    p: 1.5, borderRadius: '10px', cursor: 'grab', border: '1px solid', borderColor: 'divider',
                                    borderLeft: '5px solid #a38f6d', transition: '0.2s',
                                    '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' }
                                }}
                            >
                                <Typography variant="body2" fontWeight="800" color="primary" sx={{ mb: 0.5 }}>{ti.abbreviation || 'CHIP'}</Typography>
                                <Typography variant="caption" fontWeight="700" sx={{ display: 'block', lineHeight: 1.2 }}>{ti.title_name}</Typography>
                            </Paper>
                        ))
                    )}
                </Box>
            </Paper>

            {/* Modals & Dialogs */}
            <ModifyLoadModal
                open={editModalOpen}
                loadData={selectedLoad}
                onClose={() => setEditModalOpen(false)}
                onSave={async (id: number, notes: string) => {
                    await chipPlanningService.updateLoad(id, { driverNotes: notes });
                    setEditModalOpen(false);
                    fetchData();
                }}
                onDelete={(id: number) => setDeleteConfirm({ open: true, loadId: id })} />

            <DeleteConfirmationDialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, loadId: null })}
                onConfirm={async () => { if (deleteConfirm.loadId) { await chipPlanningService.deleteLoad(deleteConfirm.loadId); setDeleteConfirm({ open: false, loadId: null }); fetchData(); } }}
                title={t('chip-management:planning.deleteDialog.title')}
                message={t('chip-management:planning.deleteDialog.message')} />

            <DeleteConfirmationDialog
                open={dispatchConfirm.open}
                onClose={() => setDispatchConfirm({ open: false, kalustoNro: null })}
                onConfirm={handleActualDispatch}
                title={t('chip-management:planning.dispatchDialog.title') || 'Send to Driver'}
                message={t('chip-management:planning.dispatchDialog.message') || 'Are you sure you want to send these load assignments to the driver?'}
                confirmButtonText={t('common:buttons.send') || 'SEND'}
                confirmButtonColor="primary" />

            <ManageGroupsModal
                open={groupModalOpen}
                onClose={() => setGroupModalOpen(false)}
                vehicles={allRegisteredVehicles}
                onUpdate={fetchData}
            />
        </Box >
    );
};

export default PlanningPage;