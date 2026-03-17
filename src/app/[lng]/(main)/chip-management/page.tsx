// frontend/src/app/[lng]/(main)/chip-management/page.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Stack, TextField,
    InputAdornment, Tooltip, Switch, FormControlLabel, useTheme,
    IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider,
    Dialog, DialogTitle, DialogContent, Checkbox, DialogActions,
    alpha, TablePagination
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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
    const { t } = useTranslation(['chip-management', 'common']);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const [titles, setTitles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTitle, setSelectedTitle] = useState<any | null>(null);
    const [showInactive, setShowInactive] = useState(false);
    const [manageDialogOpen, setManageDialogOpen] = useState(false);

    // --- Pagination States ---
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Sorting & Menu States
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [activeCol, setActiveCol] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

    const fetchTitles = useCallback(async () => {
        try {
            const data = await chipTitleService.getAll();
            setTitles(data || []);
        } catch (error) { console.error(error); }
    }, []);

    useEffect(() => { fetchTitles(); }, [fetchTitles]);

    const handleRowClick = (title: any) => {
        setSelectedTitle(title);
        setModalOpen(true);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, colKey: string) => {
        setAnchorEl(event.currentTarget);
        setActiveCol(colKey);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setActiveCol(null);
    };

    const handleSort = (direction: 'asc' | 'desc') => {
        if (activeCol) {
            setSortConfig({ key: activeCol, direction });
        }
        handleMenuClose();
    };

    const toggleColumnHide = (colKey: string) => {
        setHiddenColumns(prev =>
            prev.includes(colKey) ? prev.filter(c => c !== colKey) : [...prev, colKey]
        );
        handleMenuClose();
    };

    const columns = [
        { id: 'id', label: t('chip-management:table.id'), key: 'titleId' },
        { id: 'customer', label: t('chip-management:table.customer'), key: 'customerName' },
        { id: 'loading', label: t('chip-management:table.loading'), key: 'loadingPointName' },
        { id: 'demolition', label: t('chip-management:table.demolition'), key: 'unloadingPointName' },
        { id: 'product', label: t('chip-management:table.product'), key: 'productName' },
        { id: 'titleName', label: t('chip-management:table.titleName'), key: 'titleName' },
        { id: 'reqInfo', label: t('chip-management:table.reqInfo'), key: 'reqInfo' },
    ];

    const renderRequestedInfo = (title: any) => {
        const info = [];
        const goldColor = '#a38f6d';
        const iconStyle = { fontSize: 16, color: goldColor };

        if (title.reqPcs) info.push(<Tooltip key="pcs" title="Pcs"><PinIcon sx={iconStyle} /></Tooltip>);
        if (title.reqM3) info.push(<Tooltip key="m3" title="Cubes"><ViewInArIcon sx={iconStyle} /></Tooltip>);
        if (title.reqTon) info.push(<Tooltip key="ton" title="Tons"><ScaleIcon sx={iconStyle} /></Tooltip>);
        if (title.reqHr) info.push(<Tooltip key="hr" title="Hours"><AccessTimeIcon sx={iconStyle} /></Tooltip>);
        if (title.reqKm) info.push(<Tooltip key="km" title="Mileage"><RouteIcon sx={iconStyle} /></Tooltip>);
        if (title.req_details) info.push(<Tooltip key="info" title={`Details: ${title.req_details_info}`}><InfoOutlinedIcon sx={iconStyle} /></Tooltip>);

        return (
            <Stack direction="row" spacing={0.5} justifyContent="center">
                {info.length > 0 ? info : <Typography variant="caption" color="text.disabled">-</Typography>}
            </Stack>
        );
    };

    //  Filtered List
    const sortedAndFilteredTitles = useMemo(() => {
        let result = titles.filter(t => {
            const matchesSearch = (t.titleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = showInactive ? true : (t.isActive !== false);
            return matchesSearch && matchesStatus;
        });

        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [titles, searchTerm, showInactive, sortConfig]);

    // paginatedTitles
    const paginatedTitles = useMemo(() => {
        return sortedAndFilteredTitles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [sortedAndFilteredTitles, page, rowsPerPage]);

    return (
        <Box sx={{ p: 1.5, bgcolor: isDarkMode ? 'background.default' : '#f4f7f9', minHeight: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary' }}>{t('chip-management:title')}</Typography>
                        <Typography variant="caption" color="text.secondary">{t('chip-management:subtitle')}</Typography>
                    </Box>
                    <Button
                        variant="contained" startIcon={<AddIcon />} onClick={() => { setSelectedTitle(null); setModalOpen(true); }}
                        sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' }, borderRadius: '8px', px: 3, fontWeight: 'bold' }}
                    >
                        {t('chip-management:newItem')}
                    </Button>
                </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 1.5, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <TextField
                    size="small" placeholder={t('chip-management:searchPlaceholder')} sx={{ width: 400 }}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(0);
                    }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />

                <Stack direction="row" alignItems="center" spacing={3}>
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={showInactive}
                                onChange={(e) => {
                                    setShowInactive(e.target.checked);
                                    setPage(0);
                                }}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#a38f6d' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#a38f6d' }
                                }} />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: '500' }}>{t('chip-management:showInactive')}</Typography>}
                        sx={{ mr: 0 }}
                    />
                    <Button
                        onClick={() => setManageDialogOpen(true)}
                        startIcon={<ViewColumnIcon />}
                        variant="outlined"
                        size="small"
                        sx={{
                            textTransform: 'none',
                            color: '#a38f6d',
                            borderColor: alpha('#a38f6d', 0.3),
                            borderRadius: '8px',
                            fontWeight: '600',
                            px: 2,
                            height: '36px',
                            '&:hover': {
                                borderColor: '#a38f6d',
                                bgcolor: alpha('#a38f6d', 0.05),
                            }
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: '600' }}>
                            {t('chip-management:manageColumns')}
                        </Typography>
                    </Button>
                </Stack>
            </Paper>

            <Paper elevation={0} sx={{ flexGrow: 1, borderRadius: '12px', overflow: 'hidden', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                <TableContainer sx={{ flexGrow: 1 }}>
                    <Table size="small" stickyHeader>
                        <TableHead sx={{
                            '& .MuiTableCell-root': {
                                bgcolor: isDarkMode ? alpha('#fff', 0.05) : '#f8f9fa',
                                borderBottom: '2px solid',
                                borderColor: 'divider',
                            }
                        }}>
                            <TableRow>
                                {columns.map((col) => !hiddenColumns.includes(col.id) && (
                                    <TableCell key={col.id} sx={{ py: 1.5 }}>
                                        <Stack direction="row" alignItems="center" justifyContent={col.id === 'reqInfo' ? 'center' : 'flex-start'} spacing={1}>
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
                                                {col.label}
                                            </Typography>
                                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, col.key)}>
                                                <MoreVertIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedTitles.map((t) => {
                                const isInactive = t.isActive === false || t.aktiivinen === false;
                                return (
                                    <TableRow
                                        key={t.titleId || t.title_id}
                                        hover
                                        onClick={() => handleRowClick(t)}
                                        sx={{
                                            cursor: 'pointer',
                                            bgcolor: isInactive ? (isDarkMode ? 'rgba(0, 0, 0, 0.4)' : '#f2f2f2') : 'inherit',
                                            opacity: isInactive ? 0.7 : 1,
                                            '&:hover': {
                                                bgcolor: isInactive
                                                    ? (isDarkMode ? 'rgba(0, 0, 0, 0.6) !important' : '#e0e0e0 !important')
                                                    : (isDarkMode ? 'rgba(163, 143, 109, 0.1) !important' : '#fdfaf5 !important')
                                            },
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {!hiddenColumns.includes('id') && <TableCell sx={{ fontSize: '13px', borderBottom: '1px solid', borderColor: 'divider' }}>{t.titleId}</TableCell>}
                                        {!hiddenColumns.includes('customer') && <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', borderBottom: '1px solid', borderColor: 'divider' }}>{t.customerName}</TableCell>}
                                        {!hiddenColumns.includes('loading') && <TableCell sx={{ fontSize: '12px', borderBottom: '1px solid', borderColor: 'divider' }}>{t.loadingPointName}</TableCell>}
                                        {!hiddenColumns.includes('demolition') && <TableCell sx={{ fontSize: '12px', borderBottom: '1px solid', borderColor: 'divider' }}>{t.unloadingPointName}</TableCell>}
                                        {!hiddenColumns.includes('product') && <TableCell sx={{ fontSize: '12px', borderBottom: '1px solid', borderColor: 'divider' }}>{t.productName}</TableCell>}
                                        {!hiddenColumns.includes('titleName') && <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}><Typography variant="body2" sx={{ color: '#a38f6d', fontWeight: '600', fontSize: '13px' }}>{t.titleName}</Typography></TableCell>}
                                        {!hiddenColumns.includes('reqInfo') && <TableCell align="center" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{renderRequestedInfo(t)}</TableCell>}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination Footer */}
                <Divider />
                <Box sx={{ px: 2, bgcolor: isDarkMode ? alpha('#fff', 0.02) : '#f8f9fa' }}>
                    <TablePagination
                        component="div"
                        count={sortedAndFilteredTitles.length}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        labelRowsPerPage={t('chip-management:pagination.rowsPerPage') || 'Rows per page:'}
                    />
                </Box>
            </Paper>



            {/* Column Interaction Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{ sx: { width: 200, borderRadius: '8px', boxShadow: theme.shadows[3] } }}
            >
                <MenuItem onClick={() => handleSort('asc')}>
                    <ListItemIcon><ArrowUpwardIcon fontSize="small" /></ListItemIcon>
                    <ListItemText
                        primary={t('common:sortAsc') || 'Sort by ASC'}
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </MenuItem>
                <MenuItem onClick={() => handleSort('desc')}>
                    <ListItemIcon><ArrowDownwardIcon fontSize="small" /></ListItemIcon>
                    <ListItemText
                        primary={t('common:sortDesc') || 'Sort by DESC'}
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </MenuItem>

            </Menu>

            {/* Manage Columns Dialog */}
            <Dialog
                open={manageDialogOpen}
                onClose={() => setManageDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: '16px', boxShadow: theme.shadows[10] } }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: '#fdfaf5',
                    borderBottom: '1px solid #eee',
                    py: 2
                }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <ViewColumnIcon sx={{ color: '#a38f6d' }} />
                        <Typography variant="h6" fontWeight="800" sx={{ color: '#444', fontSize: '1.1rem' }}>
                            {t('common:manageColumns') || 'Manage Columns'}
                        </Typography>
                    </Stack>
                    <Button
                        size="small"
                        onClick={() => setHiddenColumns([])}
                        sx={{ color: '#a38f6d', textTransform: 'none', fontWeight: 'bold' }}
                    >
                        {t('common:showAll') || 'Show All'}
                    </Button>
                </DialogTitle>

                <DialogContent sx={{ p: 1 }}>
                    <Box sx={{ mt: 1 }}>
                        {columns.map((col) => {
                            const isVisible = !hiddenColumns.includes(col.id);
                            return (
                                <Box
                                    key={col.id}
                                    onClick={() => toggleColumnHide(col.id)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        p: 1.5,
                                        mb: 0.5,
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        bgcolor: isVisible ? 'transparent' : alpha('#000', 0.02),
                                        '&:hover': {
                                            bgcolor: alpha('#a38f6d', 0.08),
                                            transform: 'translateX(5px)'
                                        }
                                    }}
                                >
                                    <Checkbox
                                        size="small"
                                        checked={isVisible}
                                        sx={{
                                            color: '#ccc',
                                            p: 0,
                                            mr: 2,
                                            '&.Mui-checked': { color: '#a38f6d' }
                                        }}
                                    />
                                    <Typography variant="body2" sx={{
                                        fontWeight: isVisible ? 600 : 400,
                                        color: isVisible ? '#333' : '#999',
                                        flex: 1
                                    }}>
                                        {col.label}
                                    </Typography>
                                    {!isVisible && (
                                        <Typography variant="caption" sx={{ color: '#999', fontStyle: 'italic' }}>
                                            {t('common:hidden') || 'Hidden'}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: '#fdfaf5' }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => setManageDialogOpen(false)}
                        sx={{
                            bgcolor: '#a38f6d',
                            '&:hover': { bgcolor: '#8c7a5d' },
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            py: 1
                        }}
                    >
                        {t('common:done') || 'DONE'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ChipTitleModal open={modalOpen} titleData={selectedTitle} onClose={() => setModalOpen(false)} onSuccess={fetchTitles} />
        </Box>




    );
};



export default ChipTitlesPage;

