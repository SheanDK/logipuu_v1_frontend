//app[lng][(main)]\chip-management\planning\page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Stack, Typography, Paper, IconButton, TextField,
    InputAdornment, Tooltip, Divider, ToggleButton, ToggleButtonGroup,
    Autocomplete, Tabs, Tab, Button, CircularProgress
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
import { useTranslation } from '@/i18n/useTranslation';

// Status Styles (Logitar Theme)
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
    const { t } = useTranslation(['chip-management']);
    // Basic States
    const [week, setWeek] = useState(7);
    const [year, setYear] = useState(2026);
    const [shift, setShift] = useState('Morning');

    // Data States
    const [vehiclesData, setVehiclesData] = useState<any[]>([]);
    const [titles, setTitles] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [customers, setCustomers] = useState<IBackendClient[]>([]);
    const [allRegisteredVehicles, setAllRegisteredVehicles] = useState<any[]>([]);

    // Interaction States
    const [rightTab, setRightTab] = useState(0);
    const [selectedCustomer, setSelectedCustomer] = useState<IBackendClient | null>(null);
    const [dragOverCell, setDragOverCell] = useState<{ vehicleId: number, date: string } | null>(null);
    const [searchTitle, setSearchTitle] = useState('');
    const [searchVehicle, setSearchVehicle] = useState('');
    const [loading, setLoading] = useState(false);

    // Modal States
    const [selectedLoad, setSelectedLoad] = useState<any | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // 1. Timezone Safe Date Calculation
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

    const weekDates = getDatesOfWeek(week, year);

    // 2. Fetch All Necessary Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [plan, tts, subs, cls, regs] = await Promise.all([
                chipService.getWeeklyPlanning(week, year, shift),
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
        } catch (err) { console.error("Fetch error", err); }
        finally { setLoading(false); }
    }, [week, year, shift]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // 3. Logic: Merge Registered Vehicles with Planning Data
    const displayVehicles = useMemo(() => {
        return allRegisteredVehicles
            .filter(v => (v.rekNro || '').toLowerCase().includes(searchVehicle.toLowerCase()))
            .map(regV => {
                const plan = vehiclesData.find(p => p.rekNro === regV.rekNro);
                return {
                    ...regV,
                    programId: plan?.programId || null,
                    driver: plan?.driver || null,
                    loads: plan?.loads || []
                };
            });
    }, [allRegisteredVehicles, vehiclesData, searchVehicle]);

    // --- DRAG & DROP LOGIC ---

    const createDragPreview = (text: string) => {
        const preview = document.createElement('div');
        preview.innerText = text;
        preview.style.padding = '5px 10px';
        preview.style.background = '#a38f6d';
        preview.style.color = 'white';
        preview.style.borderRadius = '4px';
        preview.style.position = 'absolute';
        preview.style.top = '-1000px';
        document.body.appendChild(preview);
        setTimeout(() => document.body.removeChild(preview), 0);
    };

    const onSidebarDragStart = (e: React.DragEvent, item: any, type: 'title' | 'sub') => {
        if (type === 'title') {
            const id = item.titleId || item.title_id;
            if (id) e.dataTransfer.setData("titleId", id.toString());
        } else {
            const id = item.orderId || item.order_id;
            if (id) e.dataTransfer.setData("orderId", id.toString());
        }
        createDragPreview(item.lyhenne || item.nimikeNimi || 'NEW');
    };

    const onLoadDragStart = (e: React.DragEvent, load: any) => {
        e.dataTransfer.setData("moveLoadId", load.loadId.toString());
        createDragPreview(load.lyhenne || 'MOVE');
    };

    const onDrop = async (e: React.DragEvent, vehicle: any, date: string) => {
        e.preventDefault();
        setDragOverCell(null);

        const titleId = e.dataTransfer.getData("titleId");
        const orderId = e.dataTransfer.getData("orderId");
        const moveLoadId = e.dataTransfer.getData("moveLoadId");

        try {
            let pId = vehicle.programId;
            if (!pId) {
                const newProg = await chipService.addVehicleToPlan({ vehicleId: vehicle.kalustoNro, week, year });
                pId = newProg.programId;
            }

            if (moveLoadId) {
                await chipService.moveLoad({ loadId: Number(moveLoadId), newProgramId: pId, newDate: date });
            } else if (titleId || orderId) {
                await chipService.assignTitle({
                    program_id: pId,
                    title_id: titleId ? Number(titleId) : 0,
                    order_id: orderId ? Number(orderId) : null,
                    pvm: date,
                    shift_type: shift
                });
            }
            fetchData();
        } catch (err) { console.error("Drop error", err); }
    };

    // --- ACTIONS ---
    const handleDeleteLoad = async (e: React.MouseEvent | null, loadId: number) => {
        if (e) e.stopPropagation();
        if (!window.confirm(t('chip-management:planning.confirms.deleteLoad'))) return;
        try {
            await chipService.deleteLoad(loadId);
            setEditModalOpen(false);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleSaveEdit = async (loadId: number, notes: string) => {
        try {
            await chipService.updateLoad(loadId, { driver_notes: notes });
            setEditModalOpen(false);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDispatchRow = async (programId: number) => {
        if (!window.confirm(t('chip-management:planning.confirms.sendToDriver'))) return;
        try { await chipService.dispatchRow(programId); fetchData(); } catch (err) { console.error(err); }
    };

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', bgcolor: '#f4f7f9', p: 1, gap: 1 }}>

            {/* LEFT SIDE: MAIN PLANNING GRID */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>

                <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <TextField
                        size="small" placeholder={t('chip-management:planning.searchVehicles')} sx={{ width: 300 }}
                        value={searchVehicle} onChange={(e) => setSearchVehicle(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                    />

                    <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton onClick={() => setWeek(w => w - 1)}><ArrowBackIosIcon fontSize="small" /></IconButton>
                        <Stack alignItems="center"><Typography variant="h6" fontWeight="bold">{t('chip-management:planning.week')} {week}</Typography><Typography variant="caption">{year}</Typography></Stack>
                        <IconButton onClick={() => setWeek(w => w + 1)}><ArrowForwardIosIcon fontSize="small" /></IconButton>
                    </Stack>

                    <ToggleButtonGroup value={shift} exclusive onChange={(_, v) => v && setShift(v)} size="small">
                        <ToggleButton value="Morning" sx={{ px: 3, fontWeight: 'bold' }}>{t('chip-management:planning.shifts.morning')}</ToggleButton>
                        <ToggleButton value="Evening" sx={{ px: 3, fontWeight: 'bold' }}>{t('chip-management:planning.shifts.evening')}</ToggleButton>
                    </ToggleButtonGroup>
                </Paper>

                <Paper sx={{ flex: 1, overflow: 'auto', borderRadius: '8px', border: '1px solid #ddd' }}>
                    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box> : (
                        <Box sx={{ minWidth: 1600 }}>
                            {/* Headers */}
                            <Box sx={{ display: 'flex', bgcolor: '#f1f4f8', borderBottom: '2px solid #ddd', p: 1, position: 'sticky', top: 0, zIndex: 10 }}>
                                <Box sx={{ width: 220, fontWeight: 'bold' }}>{t('chip-management:planning.table.vehicle')}</Box>
                                {days.map((day, i) => (
                                    <Box key={day} sx={{ flex: 1, textAlign: 'center', fontWeight: 'bold', borderLeft: '1px solid #eee' }}>
                                        {t(`chip-management:planning.days.${day}`)} <br /> <Typography variant="caption" sx={{ color: '#a38f6d', fontWeight: 'bold' }}>{weekDates[i].split('-').reverse().slice(0, 2).join('.')}</Typography>
                                    </Box>
                                ))}
                                <Box sx={{ width: 60, textAlign: 'center', fontWeight: 'bold', borderLeft: '1px solid #eee' }}>{t('chip-management:planning.table.send')}</Box>
                            </Box>

                            {/* Rows */}
                            {displayVehicles.map((v) => (
                                <Box key={v.rekNro} sx={{ display: 'flex', borderBottom: '1px solid #eee', minHeight: 95 }}>
                                    <Box sx={{ width: 220, p: 1.5, bgcolor: '#fafafa', borderRight: '2px solid #ddd', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#333' }}>{v.rekNro}</Typography>
                                        <Typography variant="caption" color="primary.main" fontWeight="bold" sx={{ fontSize: '11px' }}>{v.driver || t('chip-management:planning.table.waiting')}</Typography>
                                    </Box>

                                    {weekDates.map((date) => {
                                        const dayLoads = v.loads.filter((l: any) => l.date === date);
                                        const isHovered = dragOverCell?.vehicleId === v.kalustoNro && dragOverCell?.date === date;
                                        return (
                                            <Box key={date}
                                                onDragOver={(e) => { e.preventDefault(); setDragOverCell({ vehicleId: v.kalustoNro, date }); }}
                                                onDragLeave={() => setDragOverCell(null)}
                                                onDrop={(e) => onDrop(e, v, date)}
                                                sx={{ flex: 1, p: 0.5, borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: isHovered ? '#f0f7ff' : 'transparent', border: isHovered ? '1px dashed #a38f6d' : 'none' }}>
                                                {dayLoads.map((load: any) => (
                                                    <Box key={load.loadId}
                                                        draggable onDragStart={(e) => onLoadDragStart(e, load)}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedLoad(load); setEditModalOpen(true); }}
                                                        sx={{ ...getStatusStyles(load.status), p: 0.8, borderRadius: '4px', position: 'relative', cursor: 'grab', '&:hover .del-btn': { display: 'block' } }}>
                                                        <Typography sx={{ fontSize: '10.5px', fontWeight: '900' }}>{load.lyhenne || load.titleName}</Typography>
                                                        <Typography sx={{ fontSize: '9px', opacity: 0.8 }}>{load.actualM3 > 0 ? `${load.actualM3}m³` : ''}</Typography>
                                                        <IconButton className="del-btn" size="small" onClick={(e) => handleDeleteLoad(e, load.loadId)}
                                                            sx={{ position: 'absolute', top: -5, right: -5, display: 'none', bgcolor: 'white', border: '1px solid #ddd', p: '2px' }}>
                                                            <CloseIcon sx={{ fontSize: 10, color: 'red' }} />
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                            </Box>
                                        );
                                    })}
                                    <Box sx={{ width: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f9f9f9', borderLeft: '1px solid #ddd' }}>
                                        <IconButton size="small" color="primary"
                                            disabled={!v.loads.some((l: any) => l.status === 'NOT_SENT')}
                                            onClick={() => handleDispatchRow(v.programId)}>
                                            <SendIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Paper>
            </Box>

            {/* RIGHT SIDEBAR (SUBS & TITLES) */}
            <Paper sx={{ width: 380, display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid #ddd', bgcolor: '#f8f9fa' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={rightTab} onChange={(_, v) => setRightTab(v)} variant="fullWidth">
                        <Tab label={t('chip-management:planning.sidebar.tabs.subs')} sx={{ fontWeight: 'bold' }} />
                        <Tab label={t('chip-management:planning.sidebar.tabs.titles')} sx={{ fontWeight: 'bold' }} />
                    </Tabs>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: 'white', borderBottom: '1px solid #eee' }}>
                    <Autocomplete options={customers} size="small" getOptionLabel={(o) => o.asiakkaanNimi || ''}
                        value={selectedCustomer} onChange={(_, v) => setSelectedCustomer(v)} renderInput={(p) => <TextField {...p} label={t('chip-management:planning.sidebar.filterCustomer')} />} />
                    <TextField fullWidth size="small" placeholder={t('chip-management:planning.sidebar.search')} sx={{ mt: 1 }} onChange={(e) => setSearchTitle(e.target.value)} />
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                    {rightTab === 0 ? (
                        <Stack spacing={1}>
                            {subscriptions.filter(s => !selectedCustomer || (s.asiakasId || s.asiakas_id) === selectedCustomer.asiakkaanId).map((s) => (
                                <Paper key={s.orderId || s.order_id} draggable onDragStart={(e) => onSidebarDragStart(e, s, 'sub')}
                                    sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, cursor: 'grab', border: '1px solid #e0e0e0', '&:hover': { bgcolor: '#fdfaf5' } }}>
                                    <Box sx={{
                                        minWidth: 35, height: 35, borderRadius: '50%', bgcolor: '#ffcdd2',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#c62828'
                                    }}>
                                        -{s.targetQty || s.kuormia_tavoite || 1}
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" fontWeight="bold" color="primary">{s.customerName || s.asiakkaan_nimi}</Typography>
                                        <Typography variant="body2" sx={{ fontSize: '11px', lineHeight: 1.2 }}>{s.lyhenne || s.productType || t('chip-management:planning.sidebar.activeOrder')}</Typography>
                                    </Box>
                                </Paper>
                            ))}
                        </Stack>
                    ) : (
                        <Stack spacing={1}>
                            {titles.filter(t => !selectedCustomer || (t.asiakasId || t.asiakas_id) === selectedCustomer.asiakkaanId)
                                .filter(t => (t.nimikeNimi || '').toLowerCase().includes(searchTitle.toLowerCase())).map((t) => (
                                    <Paper key={t.titleId || t.title_id} draggable onDragStart={(e) => onSidebarDragStart(e, t, 'title')}
                                        sx={{ p: 1.5, cursor: 'grab', border: '1px solid #eee', '&:hover': { bgcolor: '#f0f7ff' } }}>
                                        <Typography variant="body2" fontWeight="800" color="primary">{t.lyhenne || t('chip-management:planning.sidebar.na')}</Typography>
                                        <Typography variant="caption" display="block" fontWeight="bold">{t.nimikeNimi || t.nimike_nimi}</Typography>
                                    </Paper>
                                ))}
                        </Stack>
                    )}
                </Box>
            </Paper>

            <ModifyLoadModal open={editModalOpen} loadData={selectedLoad} onClose={() => setEditModalOpen(false)} onSave={handleSaveEdit} onDelete={(id: number) => handleDeleteLoad(null, id)} />
        </Box>
    );
};

export default PlanningPage;