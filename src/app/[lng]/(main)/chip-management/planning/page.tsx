// app[lng][(main)]\chip-management\planning\page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Stack, Typography, Paper, IconButton, TextField,
    InputAdornment, Tooltip, ToggleButton, ToggleButtonGroup,
    Autocomplete, Tabs, Tab, useTheme, CircularProgress, alpha
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';

// Services
import chipService from '@/services/chipService';
import { chipTitleService } from '@/services/chipTitleService';
import * as clientService from '@/services/clientService';
import * as vehicleService from '@/services/vehicleService';
import { IBackendClient } from '@/types';
import ModifyLoadModal from '@/components/chip-order/ModifyLoadModal';
import DeleteConfirmationDialog from '@/components/common/DeleteConfirmationDialog';
import { useTranslation } from '@/i18n/useTranslation';
import PlanningTooltip from '@/components/chip-order/PlanningTooltip';

// --- Utility Functions ---
const getISOWeek = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getStatusStyles = (status: string) => {
    switch (status) {
        case 'NOT_SENT': return { bgcolor: '#ffcdd2', border: '1px solid #ef9a9a', color: '#b71c1c' };
        case 'DISPATCHED': return { bgcolor: '#c8e6c9', border: '1px solid #a5d6a7', color: '#1b5e20' };
        case 'LOADED': return { bgcolor: '#bbdefb', border: '1px solid #90caf9', color: '#0d47a1' };
        case 'COMPLETED': return { bgcolor: '#ffffff', border: '1px solid #e0e0e0', color: '#333' };
        default: return { bgcolor: '#f5f5f5', border: '1px solid #ddd', color: '#999' };
    }
};

const PlanningPage = () => {
    const { t } = useTranslation(['chip-management', 'common']);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const [week, setWeek] = useState<number>(getISOWeek(new Date()));
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [shift, setShift] = useState<string>('Morning');

    const [vehiclesData, setVehiclesData] = useState<any[]>([]);
    const [titles, setTitles] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [customers, setCustomers] = useState<IBackendClient[]>([]);
    const [allRegisteredVehicles, setAllRegisteredVehicles] = useState<any[]>([]);

    const [rightTab, setRightTab] = useState(0);
    const [selectedCustomer, setSelectedCustomer] = useState<IBackendClient | null>(null);
    const [dragOverCell, setDragOverCell] = useState<{ vehicleId: number, date: string } | null>(null);
    const [searchTitle, setSearchTitle] = useState('');
    const [searchVehicle, setSearchVehicle] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(380);
    const [isResizing, setIsResizing] = useState(false);

    const [selectedLoad, setSelectedLoad] = useState<any | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, loadId: number | null }>({ open: false, loadId: null });

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 250 && newWidth < 800) setSidebarWidth(newWidth);
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    const getDatesOfWeek = useCallback((w: number, y: number) => {
        const dates = [];
        const jan4 = new Date(y, 0, 4);
        const dayOfWeek = jan4.getDay() || 7;
        const firstMonday = new Date(y, 0, 4 - (dayOfWeek - 1));
        const targetMonday = new Date(firstMonday);
        targetMonday.setDate(firstMonday.getDate() + (w - 1) * 7);
        for (let i = 0; i < 7; i++) {
            const d = new Date(targetMonday);
            d.setDate(targetMonday.getDate() + i);
            dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }
        return dates;
    }, []);

    const weekDates = useMemo(() => getDatesOfWeek(week, year), [week, year, getDatesOfWeek]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [plan, tts, subs, cls, regs] = await Promise.all([
                chipService.getWeeklyPlanning(week, year),
                chipTitleService.getAll(),
                chipService.getActiveOrders(),
                clientService.fetchAllClients(),
                vehicleService.fetchAllVehicles()
            ]);
            setVehiclesData(plan);
            setTitles(tts);
            setSubscriptions(subs);
            setCustomers(cls);
            setAllRegisteredVehicles(regs);
        } catch (err) {
            console.error("Fetch error", err);
        } finally {
            setLoading(false);
        }
    }, [week, year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const displayVehicles = useMemo(() => {
        return allRegisteredVehicles
            .filter(v => (v.rekNro || '').toLowerCase().includes(searchVehicle.toLowerCase()))
            .map(regV => {
                const plan = vehiclesData.find(p => p.vehicleNumber === regV.kalustoNro);
                return {
                    ...regV,
                    loads: plan?.loads || []
                };
            });
    }, [allRegisteredVehicles, vehiclesData, searchVehicle]);

    const onSidebarDragStart = (e: React.DragEvent, item: any, type: 'title' | 'sub') => {
        const id = type === 'title' ? item.title_id : item.orderId;
        if (id) e.dataTransfer.setData(type === 'title' ? "titleId" : "orderId", id.toString());
    };

    const onLoadDragStart = (e: React.DragEvent, load: any) => {
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
                // Load එකක් තවත් තැනකට ගෙන යාම
                await chipService.moveLoad({
                    loadId: Number(moveLoadId),
                    newKalustoNro: vehicle.kalustoNro,
                    newDate: date
                });
            } else if (titleId || orderId) {
                // අලුත් Load එකක් assign කිරීම (කලින් තිබූ program_id ඉවත් කර ඇත)
                await chipService.assignTitle({
                    kalusto_nro: vehicle.kalustoNro,
                    title_id: titleId ? Number(titleId) : 0,
                    order_id: orderId ? Number(orderId) : null,
                    pvm: date
                });
            }
            fetchData();
        } catch (err) {
            console.error("Drop error", err);
        }
    };

    const handleOpenDeleteConfirm = (e: React.MouseEvent | null, loadId: number) => {
        if (e) e.stopPropagation();
        setDeleteConfirm({ open: true, loadId });
    };

    const handleActualDelete = async () => {
        if (!deleteConfirm.loadId) return;
        try {
            await chipService.deleteLoad(deleteConfirm.loadId);
            setDeleteConfirm({ open: false, loadId: null });
            setEditModalOpen(false);
            fetchData();
        } catch (err) { console.error("Delete error:", err); }
    };

    const handleDispatchRow = async (kalustoNro: number) => {
        if (!window.confirm(t('chip-management:planning.confirms.sendToDriver'))) return;
        try {
            await chipService.dispatchRow(kalustoNro, week, year);
            fetchData();
        } catch (err) { console.error(err); }
    };

    return (
        <Box sx={{
            display: 'flex',
            height: 'calc(100vh - 120px)',
            bgcolor: 'background.default',
            p: 1,
            gap: 0,
            overflow: 'hidden',
            userSelect: isResizing ? 'none' : 'auto'
        }}>

            <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                overflow: 'hidden',
                minWidth: 0
            }}>
                <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, bgcolor: 'background.paper' }}>
                    <TextField
                        size="small"
                        placeholder={t('chip-management:planning.searchVehicles')}
                        sx={{ width: '30%' }}
                        value={searchVehicle}
                        onChange={(e) => setSearchVehicle(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                    />
                    <Stack direction="row" alignItems="center" spacing={2}>
                        {/* TypeScript fix: (w: number) type explicitly defined */}
                        <IconButton onClick={() => setWeek((w: number) => w - 1)}><ArrowBackIosIcon fontSize="small" /></IconButton>
                        <Typography fontWeight="bold" noWrap>Week {week}, {year}</Typography>
                        <IconButton onClick={() => setWeek((w: number) => w + 1)}><ArrowForwardIosIcon fontSize="small" /></IconButton>
                    </Stack>
                    <ToggleButtonGroup value={shift} exclusive onChange={(_, v) => v && setShift(v)} size="small">
                        <ToggleButton value="Morning">Morning</ToggleButton>
                        <ToggleButton value="Evening">Evening</ToggleButton>
                    </ToggleButtonGroup>
                </Paper>

                <Paper sx={{
                    flex: 1,
                    overflow: 'auto',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: isDarkMode ? '#444' : '#ccc', borderRadius: '10px' },
                }}>
                    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box> : (
                        <Box sx={{ width: '100%', minWidth: 900 }}>
                            <Box sx={{ display: 'flex', bgcolor: isDarkMode ? alpha(theme.palette.background.default, 0.8) : '#f1f4f8', borderBottom: '2px solid', borderColor: 'divider', p: 1, position: 'sticky', top: 0, zIndex: 10 }}>
                                <Box sx={{ width: 130, minWidth: 130, fontWeight: 'bold', fontSize: '12px' }}>Vehicle</Box>
                                {days.map((day, i) => (
                                    <Box key={day} sx={{ flex: 1, textAlign: 'center', fontWeight: 'bold', borderLeft: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}>{t(`chip-management:planning.days.${day}`).substring(0, 3)}</Typography>
                                        <Typography variant="caption" sx={{ color: '#a38f6d', fontWeight: 'bold', fontSize: '10px' }}>{weekDates[i].split('-').reverse().slice(0, 2).join('.')}</Typography>
                                    </Box>
                                ))}
                                <Box sx={{ width: 50, textAlign: 'center', fontWeight: 'bold', borderLeft: '1px solid', borderColor: 'divider' }}>Send</Box>
                            </Box>

                            {displayVehicles.map((v) => (
                                <Box key={v.kalustoNro} sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', minHeight: 90 }}>
                                    <Box sx={{ width: 130, p: 1.5, bgcolor: isDarkMode ? alpha(theme.palette.background.default, 0.4) : '#fafafa', borderRight: '2px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <Typography variant="subtitle2" fontWeight="800" sx={{ fontSize: '11px' }}>{v.rekNro}</Typography>
                                        <Typography variant="caption" color="primary.main" sx={{ fontSize: '9px', fontWeight: 'bold' }}>{v.driver || 'Not Assigned'}</Typography>
                                    </Box>
                                    {weekDates.map((date) => {
                                        const dayLoads = v.loads.filter((l: any) => l.date === date);
                                        const isHovered = dragOverCell?.vehicleId === v.kalustoNro && dragOverCell?.date === date;
                                        return (
                                            <Box key={date}
                                                onDragOver={(e) => { e.preventDefault(); setDragOverCell({ vehicleId: v.kalustoNro, date }); }}
                                                onDragLeave={() => setDragOverCell(null)}
                                                onDrop={(e) => onDrop(e, v, date)}
                                                sx={{ flex: 1, p: 0.5, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: isHovered ? (isDarkMode ? 'rgba(163, 143, 109, 0.2)' : '#f0f7ff') : 'transparent' }}>
                                                {dayLoads.map((load: any) => (
                                                    <Tooltip
                                                        key={load.loadId}
                                                        enterDelay={500}
                                                        title={<PlanningTooltip load={load} vehicle={v.rekNro} />}
                                                        slotProps={{ tooltip: { sx: { bgcolor: 'transparent', padding: 0, maxWidth: 'none' } } }}
                                                    >
                                                        <Box draggable onDragStart={(e) => onLoadDragStart(e, load)}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedLoad({ ...load, rekNro: v.rekNro }); setEditModalOpen(true); }}
                                                            sx={{ ...getStatusStyles(load.status), p: 0.8, borderRadius: '4px', position: 'relative', cursor: 'grab', '&:hover .del-btn': { display: 'block' } }}>
                                                            <Typography sx={{ fontSize: '9px', fontWeight: '900', lineHeight: 1.1 }}>{load.abbreviation || 'CHIP'}</Typography>
                                                            <Typography sx={{ fontSize: '8px', opacity: 0.8 }}>{load.actualM3 > 0 ? `${load.actualM3}m³` : 'Planned'}</Typography>
                                                            <IconButton className="del-btn" size="small" onClick={(e) => handleOpenDeleteConfirm(e, load.loadId)}
                                                                sx={{ position: 'absolute', top: -5, right: -5, display: 'none', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', p: '1px' }}>
                                                                <CloseIcon sx={{ fontSize: 8, color: 'red' }} />
                                                            </IconButton>
                                                        </Box>
                                                    </Tooltip>
                                                ))}
                                            </Box>
                                        );
                                    })}
                                    <Box sx={{ width: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDarkMode ? alpha(theme.palette.background.default, 0.3) : '#f9f9f9', borderLeft: '1px solid', borderColor: 'divider' }}>
                                        <IconButton size="small" color="primary" disabled={!v.loads.some((l: any) => l.status === 'NOT_SENT')} onClick={() => handleDispatchRow(v.kalustoNro)}><SendIcon fontSize="small" /></IconButton>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Paper>
            </Box>

            <Box onMouseDown={startResizing} sx={{ width: '8px', cursor: 'col-resize', bgcolor: isResizing ? '#a38f6d' : 'transparent', '&:hover': { bgcolor: '#a38f6d' }, zIndex: 20, mx: '2px' }} />

            <Paper sx={{
                width: sidebarWidth,
                minWidth: 220,
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                overflow: 'hidden',
            }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={rightTab} onChange={(_, v) => setRightTab(v)} variant="fullWidth">
                        <Tab label="SUBS" sx={{ fontWeight: 'bold', fontSize: '11px' }} />
                        <Tab label="TITLES" sx={{ fontWeight: 'bold', fontSize: '11px' }} />
                    </Tabs>
                </Box>
                <Box sx={{ p: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Autocomplete options={customers} size="small" getOptionLabel={(o) => o.asiakkaanNimi || ''} value={selectedCustomer} onChange={(_, v) => setSelectedCustomer(v)} renderInput={(p) => <TextField {...p} label="Customer" />} />
                    <TextField fullWidth size="small" placeholder="Search..." sx={{ mt: 1 }} onChange={(e) => setSearchTitle(e.target.value)} />
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                    {rightTab === 0 ? (
                        <Stack spacing={1}>
                            {subscriptions.map((s) => (
                                <Paper key={s.orderId} draggable onDragStart={(e) => onSidebarDragStart(e, s, 'sub')} sx={{ p: 1, cursor: 'grab', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                    <Typography variant="caption" fontWeight="bold" color="primary" sx={{ display: 'block' }}>{s.customerName}</Typography>
                                    <Typography variant="body2" sx={{ fontSize: '10px' }} noWrap>{s.abbreviation || s.productType}</Typography>
                                    <Typography variant="caption" color="textSecondary">Qty: {s.targetQty}</Typography>
                                </Paper>
                            ))}
                        </Stack>
                    ) : (
                        <Stack spacing={1}>
                            {titles.filter(t => (t.title_name || '').toLowerCase().includes(searchTitle.toLowerCase())).map((ti) => (
                                <Paper key={ti.title_id} draggable onDragStart={(e) => onSidebarDragStart(e, ti, 'title')} sx={{ p: 1, cursor: 'grab', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}>
                                    <Typography variant="body2" fontWeight="800" color="primary" sx={{ fontSize: '12px' }}>{ti.abbreviation || 'CHIP'}</Typography>
                                    <Typography variant="caption" display="block" fontWeight="bold" noWrap>{ti.title_name}</Typography>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Box>
            </Paper>

            <ModifyLoadModal
                open={editModalOpen}
                loadData={selectedLoad}
                onClose={() => setEditModalOpen(false)}
                onSave={async (id: number, notes: string) => {
                    await chipService.updateLoad(id, { driverNotes: notes });
                    setEditModalOpen(false);
                    fetchData();
                }}
                onDelete={(id: number) => setDeleteConfirm({ open: true, loadId: id })}
            />

            <DeleteConfirmationDialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, loadId: null })}
                onConfirm={handleActualDelete}
                title="delete load"
                message="Are you sure you want to delete this planned load?"
            />
        </Box>
    );
};

export default PlanningPage;