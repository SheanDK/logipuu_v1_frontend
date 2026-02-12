//frontend/src/app/[lng]/(main)/chip-management/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Stack, TextField,
    InputAdornment, Tooltip, Switch, FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

// Indicators Icons
import ScaleIcon from '@mui/icons-material/Scale';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import PinIcon from '@mui/icons-material/Pin';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RouteIcon from '@mui/icons-material/Route';

import { chipTitleService } from '@/services/chipTitleService';
import ChipTitleModal from '@/components/chip-order/ChipTitleModal';
import { useTranslation } from '@/i18n/useTranslation';

const ChipTitlesPage = () => {
    const { t } = useTranslation(['chip-management']);
    const [titles, setTitles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTitle, setSelectedTitle] = useState<any | null>(null);
    const [showInactive, setShowInactive] = useState(false);

    const fetchTitles = useCallback(async () => {
        try {
            const data = await chipTitleService.getAll();
            setTitles(data || []);
        } catch (error) {
            console.error("Error fetching titles:", error);
        }
    }, []);

    useEffect(() => { fetchTitles(); }, [fetchTitles]);

    const handleRowClick = (title: any) => {
        setSelectedTitle(title);
        setModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedTitle(null);
        setModalOpen(true);
    };

    const renderRequestedInfo = (title: any) => {
        const info = [];
        const goldColor = '#a38f6d';
        if (title.reqKpl || title.req_kpl) info.push(<Tooltip key="kpl" title="Pcs"><PinIcon sx={{ fontSize: 16, color: goldColor }} /></Tooltip>);
        if (title.reqM3 || title.req_m3) info.push(<Tooltip key="m3" title="Cubes"><ViewInArIcon sx={{ fontSize: 16, color: goldColor }} /></Tooltip>);
        if (title.reqTon || title.req_ton) info.push(<Tooltip key="ton" title="Tons"><ScaleIcon sx={{ fontSize: 16, color: goldColor }} /></Tooltip>);
        if (title.reqH || title.req_h) info.push(<Tooltip key="h" title="Hours"><AccessTimeIcon sx={{ fontSize: 16, color: goldColor }} /></Tooltip>);
        if (title.reqKm || title.req_km) info.push(<Tooltip key="km" title="Mileage"><RouteIcon sx={{ fontSize: 16, color: goldColor }} /></Tooltip>);

        return (
            <Stack direction="row" spacing={0.5} justifyContent="center">
                {info.length > 0 ? info : <Typography variant="caption" color="textDisabled">-</Typography>}
            </Stack>
        );
    };

    const filteredTitles = titles.filter(t => {
        const matchesSearch = (t.nimikeNimi || t.nimike_nimi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.customerName || t.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = showInactive ? true : (t.aktiivinen !== false);
        return matchesSearch && matchesStatus;
    });

    return (
        <Box sx={{ p: 3, bgcolor: '#fdfdfd', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#333' }}>{t('chip-management:title')}</Typography>
                    <Typography variant="caption" color="textSecondary">{t('chip-management:subtitle')}</Typography>
                </Box>
                <Button
                    variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}
                    sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' }, borderRadius: '8px', px: 3, fontWeight: 'bold' }}
                >
                    {t('chip-management:newItem')}
                </Button>
            </Stack>

            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <TextField
                    size="small" placeholder={t('chip-management:searchPlaceholder')} sx={{ width: 400 }}
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />
                <FormControlLabel
                    control={
                        <Switch size="small" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#a38f6d' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#a38f6d' } }} />
                    }
                    label={<Typography variant="body2">{t('chip-management:showInactive')}</Typography>}
                />
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chip-management:table.id')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chip-management:table.customer')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chip-management:table.loading')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chip-management:table.demolition')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chip-management:table.product')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('chip-management:table.titleName')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('chip-management:table.reqInfo')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTitles.map((t) => (
                            <TableRow
                                key={t.titleId || t.title_id} hover onClick={() => handleRowClick(t)}
                                sx={{ cursor: 'pointer', opacity: t.aktiivinen === false ? 0.6 : 1, '&:hover': { bgcolor: '#fdfaf5 !important' } }}
                            >
                                <TableCell>{t.titleId || t.title_id}</TableCell>
                                <TableCell><Typography variant="body2" fontWeight="bold">{t.customerName || t.customer_name}</Typography></TableCell>
                                <TableCell sx={{ fontSize: '12px' }}>{t.originName || t.origin_name}</TableCell>
                                <TableCell sx={{ fontSize: '12px' }}>{t.destinationName || t.destination_name}</TableCell>
                                <TableCell sx={{ fontSize: '12px' }}>{t.productName || t.product_name}</TableCell>
                                <TableCell><Typography variant="body2" sx={{ color: '#a38f6d', fontWeight: '600' }}>{t.nimikeNimi || t.nimike_nimi}</Typography></TableCell>
                                <TableCell align="center">{renderRequestedInfo(t)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <ChipTitleModal open={modalOpen} titleData={selectedTitle} onClose={() => setModalOpen(false)} onSuccess={fetchTitles} />
        </Box>
    );
};

export default ChipTitlesPage;