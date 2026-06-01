// frontend/src/app/[lng]/(main)/data-management/page.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Box, Typography, Button, Stepper, Step, StepLabel, Stack, Paper,
    TextField, MenuItem, CircularProgress, Alert, alpha, useTheme, Divider,
    Tabs, Tab
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import StorageIcon from '@mui/icons-material/Storage';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { backupService } from '@/services/backupService';
import { useTranslation } from '@/i18n/useTranslation';
import { useAuth } from '@/contexts/AuthContext';

// System columns per module for user mapping
const SYSTEM_KEYS: Record<string, string[]> = {
    vehicles: ['kalusto_nro', 'rek_nro', 'ed_katsastus', 'katsastus_aik', 'aktiivinen', 'planning_group'],
    drivers: ['kulj_id', 'nimi', 'puhelin_nro', 'email', 'halytys'],
    users: ['tunnus', 'nimi', 'taso', 'salasana', 'aktiivinen', 'kulj_id'],
    chip_loads: ['load_id', 'title_id', 'vehicle_number', 'order_id', 'scheduled_date', 'status', 'actual_m3', 'actual_ton', 'is_billed', 'driver_user_id'],
    timber_loads: ['kuorma_id', 'tyyppi', 'asiakas_id', 'puulaani_id', 'puutavara_id', 'auto_id', 'kulj_id', 'pvm', 'm3', 'km', 'laskutukseen', 'kalusto_nro'],
    consignment_loads: ['rahti_id', 'pvm', 'kuorma_id', 'rahtikirjan_nro', 'reitti', 'm3', 'm3_hinta', 'km', 'km_hinta', 'kpl', 'kpl_hinta', 'jako', 'jako_hinta', 'tievero', 'koko_hinta', 'lisatiedot', 'asiakas_id']
};

// SMART FUZZY HEADER MATCHER
const findMatchingHeader = (systemKey: string, csvHeaders: string[]): string => {
    const cleanSystem = systemKey.toLowerCase().replace(/_/g, '');
    let matched = csvHeaders.find(h => {
        const cleanHeader = h.toLowerCase().replace(/_/g, '');
        return cleanHeader === cleanSystem;
    });
    if (matched) return matched;
    matched = csvHeaders.find(h => {
        const cleanHeader = h.toLowerCase().replace(/_/g, '');
        return cleanHeader.startsWith(cleanSystem) || cleanSystem.startsWith(cleanHeader);
    });
    return matched || '';
};

export default function BackupPage() {
    const { t } = useTranslation(['data-management', 'common', 'vehicles']);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const params = useParams();
    const lng = params?.lng as string;
    const { user } = useAuth();

    // --- Tab State ---
    const [currentTab, setCurrentTab] = useState(0); // 0 = Export, 1 = Import

    // --- Global Configurations ---
    const [module, setModule] = useState('vehicles');
    const [conflictStrategy, setConflictStrategy] = useState('overwrite');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // --- Import Stepper States ---
    const [activeStep, setActiveStep] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<any[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [gridRows, setGridRows] = useState<any[]>([]);
    const [validationResult, setValidationResult] = useState<any>(null);

    // Role-based Access Control
    const hasAccess = user?.roles.includes('Superuser') || user?.roles.includes('Admin');

    // Download blank CSV templates
    const handleDownloadTemplate = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const blob = await backupService.downloadTemplate(module);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `template_${module}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError(t('data-management:messages.downloadTemplateFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Process Export
    const handleExport = async () => {
        if (!password) {
            setError(t('data-management:messages.passwordRequired'));
            return;
        }
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const blob = await backupService.exportData(module, password);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${module}_backup_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setPassword('');
            setSuccessMessage(t('data-management:messages.exportSuccess'));
        } catch (err: any) {
            setError(t('data-management:messages.exportFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Parse CSV Client-Side (Import Step 0)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setError(null);
        setSuccessMessage(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length === 0) return;

            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
            const rowsData = lines.slice(1).map((line, idx) => {
                const values = line.split(',').map(v => v.replace(/"/g, '').trim());
                return { id: idx, values };
            });

            setCsvHeaders(headers);
            setCsvRows(rowsData);

            const initialMapping: Record<string, string> = {};
            SYSTEM_KEYS[module].forEach(key => {
                const matched = findMatchingHeader(key, headers);
                if (matched) initialMapping[key] = matched;
            });
            setMapping(initialMapping);
            setActiveStep(1);
        };
        reader.readAsText(selectedFile);
    };

    // Apply mapping to grid (Import Step 1)
    const handleApplyMapping = () => {
        setError(null);
        setSuccessMessage(null);
        const mapped = csvRows.map((r, idx) => {
            const obj: any = { id: idx + 1 };
            SYSTEM_KEYS[module].forEach(key => {
                const csvHeader = mapping[key];
                const headerIndex = csvHeaders.indexOf(csvHeader);
                obj[key] = headerIndex !== -1 ? r.values[headerIndex] : '';
            });
            return obj;
        });
        setGridRows(mapped);
        setActiveStep(2);
    };

    // Validation (Dry Run)
    const handleValidateGrid = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const res = await backupService.validateImport(module, gridRows);
            setValidationResult(res);

            if (res.invalidCount > 0) {
                setError(t('data-management:messages.validationFailed').replace('{{count}}', res.invalidCount.toString()));
            } else {
                setSuccessMessage(t('data-management:messages.validationComplete'));
            }
        } catch (err: any) {
            const dbError = err.response?.data?.error || err.message || "Validation failed.";
            setError(t('data-management:messages.dryRunError').replace('{{error}}', dbError));
        } finally {
            setLoading(false);
        }
    };

    const handleProcessRowUpdate = (newRow: any) => {
        setGridRows(prev => prev.map(r => r.id === newRow.id ? newRow : r));
        return newRow;
    };

    // Execute Import Transaction
    const handleExecuteImport = async () => {
        if (!validationResult?.validRows) return;
        setLoading(true);
        setError(null);
        try {
            await backupService.executeImport(module, validationResult.validRows, conflictStrategy);
            setActiveStep(4);
        } catch (err) {
            setError(t('data-management:messages.transactionRolledBack'));
        } finally { setLoading(false); }
    };

    const handleReset = () => {
        setActiveStep(0);
        setFile(null);
        setValidationResult(null);
        setError(null);
        setSuccessMessage(null);
        setGridRows([]);
    };

    const handleProceedToConfirm = () => {
        setError(null);
        setSuccessMessage(null);
        setActiveStep(3);
    };

    const gridColumns: GridColDef[] = useMemo(() => {
        return SYSTEM_KEYS[module].map(key => ({
            field: key,
            headerName: key.toUpperCase().replace('_', ' '),
            flex: 1,
            editable: true
        }));
    }, [module]);

    const errorColumns: GridColDef[] = [
        { field: 'row', headerName: 'Row No', width: 100 },
        { field: 'error', headerName: 'Validation Fail Details', flex: 1 }
    ];

    if (!hasAccess) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="error" variant="h6">{t('data-management:accessDenied')}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <Stack spacing={3} sx={{ flex: 1 }}>

                {/* 1. Header Area */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{
                        p: 1.5, borderRadius: 3, bgcolor: '#a38f6d', color: 'white',
                        boxShadow: '0 4px 12px rgba(163, 143, 109, 0.3)', display: 'flex'
                    }}>
                        <StorageIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary', letterSpacing: -0.5 }}>
                            {t('data-management:title')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('data-management:subtitle')}
                        </Typography>
                    </Box>
                </Stack>

                {/* 2. Unified Navigation Tabs */}
                <Paper variant="outlined" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Tabs
                        value={currentTab}
                        onChange={(_, v) => { setCurrentTab(v); handleReset(); }}
                        indicatorColor="primary"
                        textColor="primary"
                        sx={{
                            '& .MuiTabs-indicator': { bgcolor: '#a38f6d' },
                            '& .MuiTab-root.Mui-selected': { color: '#a38f6d' }
                        }}
                    >
                        <Tab icon={<CloudDownloadIcon />} iconPosition="start" label={t('data-management:tabs.export')} />
                        <Tab icon={<CloudUploadOutlinedIcon />} iconPosition="start" label={t('data-management:tabs.import')} />
                    </Tabs>
                </Paper>

                {/* 3. Main Workspace Area */}
                <Paper variant="outlined" sx={{ p: 4, borderRadius: '16px', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>

                    {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
                    {successMessage && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}

                    {/* ─── TAB 1: EXPORT (BACKUP) WORKSPACE (🚀 Parallel UI applied here) ─── */}
                    {currentTab === 0 && (
                        <Stack spacing={4}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">{t('data-management:exportTab.title')}</Typography>
                                <Typography variant="caption" color="text.secondary">{t('data-management:exportTab.subtitle')}</Typography>
                            </Box>

                            {/* 🚀 FIXED: Export fields aligned horizontally in one row */}
                            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start" sx={{ width: '100%' }}>
                                <Box sx={{ flex: 1.5, width: '100%' }}>
                                    <TextField select label={t('data-management:exportTab.selectModule')} size="small" value={module} onChange={(e) => setModule(e.target.value)} fullWidth>
                                        <MenuItem value="vehicles">{t('data-management:exportTab.modules.vehicles')}</MenuItem>
                                        <MenuItem value="drivers">{t('data-management:exportTab.modules.drivers')}</MenuItem>
                                        <MenuItem value="users">{t('data-management:exportTab.modules.users')}</MenuItem>
                                        <MenuItem value="chip_loads">{t('data-management:exportTab.modules.chip_loads')}</MenuItem>
                                        <MenuItem value="timber_loads">{t('data-management:exportTab.modules.timber_loads')}</MenuItem>
                                        <MenuItem value="consignment_loads">{t('data-management:exportTab.modules.consignment_loads')}</MenuItem>
                                    </TextField>
                                </Box>

                                <Box sx={{ flex: 1, width: '100%' }}>
                                    <TextField label={t('data-management:exportTab.passwordLabel')} type="password" size="small" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
                                </Box>

                                <Box sx={{ width: { xs: '100%', lg: 'auto' }, pt: 0.2 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleExport}
                                        disabled={loading}
                                        sx={{
                                            bgcolor: '#a38f6d',
                                            fontWeight: 'bold',
                                            height: 40, // Height matched with small TextField
                                            minWidth: 260,
                                            '&:hover': { bgcolor: '#8e7a5a' }
                                        }}
                                    >
                                        {loading ? <CircularProgress size={20} color="inherit" /> : t('data-management:exportTab.generateBtn')}
                                    </Button>
                                </Box>
                            </Stack>
                        </Stack>
                    )}

                    {/* ─── TAB 2: IMPORT (RESTORE) WORKSPACE ─── */}
                    {currentTab === 1 && (
                        <Stack spacing={4}>
                            {/* Stepper Status Indicator */}
                            <Stepper activeStep={activeStep} alternativeLabel>
                                <Step><StepLabel>{t('data-management:importTab.stepper.upload')}</StepLabel></Step>
                                <Step><StepLabel>{t('data-management:importTab.stepper.map')}</StepLabel></Step>
                                <Step><StepLabel>{t('data-management:importTab.stepper.dryRun')}</StepLabel></Step>
                                <Step><StepLabel>{t('data-management:importTab.stepper.commit')}</StepLabel></Step>
                            </Stepper>

                            {/* STEP 0: Upload & Settings */}
                            {activeStep === 0 && (
                                <Stack spacing={3}>
                                    {/* Aligned Import Setup Row */}
                                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start" sx={{ width: '100%' }}>
                                        <Box sx={{ flex: 1.5, width: '100%' }}>
                                            <TextField
                                                select
                                                label={t('data-management:importTab.step0.selectModule')}
                                                size="small"
                                                value={module}
                                                onChange={(e) => setModule(e.target.value)}
                                                fullWidth
                                                helperText={t('data-management:importTab.step0.selectModuleHelper')}
                                                FormHelperTextProps={{ sx: { color: '#a38f6d', fontWeight: 'bold' } }}
                                            >
                                                <MenuItem disabled sx={{ fontWeight: 'bold', color: '#a38f6d' }}>{t('data-management:importTab.step0.moduleGroups.step1')}</MenuItem>
                                                <MenuItem value="drivers">  {t('data-management:importTab.step0.moduleGroups.drivers')}</MenuItem>
                                                <MenuItem value="vehicles">  {t('data-management:importTab.step0.moduleGroups.vehicles')}</MenuItem>

                                                <MenuItem disabled sx={{ fontWeight: 'bold', color: '#a38f6d' }}>{t('data-management:importTab.step0.moduleGroups.step2')}</MenuItem>
                                                <MenuItem value="timber_loads_locations">  {t('data-management:importTab.step0.moduleGroups.timber_loads_locations')}</MenuItem>

                                                <MenuItem disabled sx={{ fontWeight: 'bold', color: '#a38f6d' }}>{t('data-management:importTab.step0.moduleGroups.step3')}</MenuItem>
                                                <MenuItem value="users">  {t('data-management:importTab.step0.moduleGroups.users')}</MenuItem>

                                                <MenuItem disabled sx={{ fontWeight: 'bold', color: '#a38f6d' }}>{t('data-management:importTab.step0.moduleGroups.step4')}</MenuItem>
                                                <MenuItem value="chip_titles">  {t('data-management:importTab.step0.moduleGroups.chip_titles')}</MenuItem>
                                                <MenuItem value="chip_orders">  {t('data-management:importTab.step0.moduleGroups.chip_orders')}</MenuItem>

                                                <MenuItem disabled sx={{ fontWeight: 'bold', color: '#a38f6d' }}>{t('data-management:importTab.step0.moduleGroups.step5')}</MenuItem>
                                                <MenuItem value="timber_loads">  {t('data-management:importTab.step0.moduleGroups.timber_loads')}</MenuItem>
                                                <MenuItem value="chip_loads">  {t('data-management:importTab.step0.moduleGroups.chip_loads')}</MenuItem>
                                                <MenuItem value="consignment_loads">  {t('data-management:importTab.step0.moduleGroups.consignment_loads')}</MenuItem>
                                            </TextField>
                                        </Box>

                                        <Box sx={{ width: { xs: '100%', lg: 'auto' }, pt: 0.2 }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<DownloadIcon />}
                                                onClick={handleDownloadTemplate}
                                                disabled={loading}
                                                sx={{
                                                    borderColor: '#a38f6d',
                                                    color: '#a38f6d',
                                                    height: 40, // Height matched with small TextField
                                                    minWidth: 260,
                                                    fontWeight: 'bold',
                                                    '&:hover': { borderColor: '#8e7a5a' }
                                                }}
                                            >
                                                {t('data-management:importTab.step0.downloadTemplateBtn')}
                                            </Button>
                                        </Box>

                                        <Box sx={{ flex: 1, width: '100%' }}>
                                            <TextField select label={t('data-management:importTab.step0.conflictStrategy')} size="small" value={conflictStrategy} onChange={(e) => setConflictStrategy(e.target.value)} fullWidth>
                                                <MenuItem value="overwrite">{t('data-management:importTab.step0.strategyOverwrite')}</MenuItem>
                                                <MenuItem value="skip">{t('data-management:importTab.step0.strategySkip')}</MenuItem>
                                            </TextField>
                                        </Box>
                                    </Stack>

                                    <Paper variant="outlined" sx={{
                                        p: 4, textAlign: 'center', border: '2px dashed #a38f6d', borderRadius: '12px',
                                        cursor: 'pointer', bgcolor: alpha('#a38f6d', 0.02)
                                    }}>
                                        <input type="file" accept=".csv" style={{ display: 'none' }} id="csv-upload" onChange={handleFileChange} />
                                        <label htmlFor="csv-upload" style={{ cursor: 'pointer' }}>
                                            <CloudUploadIcon sx={{ fontSize: 40, color: '#a38f6d', mb: 1 }} />
                                            <Typography variant="body1" fontWeight="bold">{t('data-management:importTab.step0.dragDrop')}</Typography>
                                        </label>
                                    </Paper>
                                </Stack>
                            )}

                            {/* STEP 1: Column Header Mapping */}
                            {activeStep === 1 && (
                                <Stack spacing={3}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <LinkIcon sx={{ color: '#a38f6d' }} />
                                        <Typography variant="subtitle1" fontWeight="bold">{t('data-management:importTab.step1.title')}</Typography>
                                    </Stack>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                        {SYSTEM_KEYS[module].map(key => (
                                            <TextField key={key} select label={`${t('data-management:importTab.step1.systemPrefix')} ${key.toUpperCase()}`} size="small" value={mapping[key] || ''} onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })} fullWidth>
                                                <MenuItem value="">{t('data-management:importTab.step1.skipColumn')}</MenuItem>
                                                {csvHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                                            </TextField>
                                        ))}
                                    </Box>
                                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                                        <Button onClick={handleReset}>{t('data-management:importTab.step1.backBtn')}</Button>
                                        <Button variant="contained" onClick={handleApplyMapping} sx={{ bgcolor: '#a38f6d' }}>{t('data-management:importTab.step1.generateGridBtn')}</Button>
                                    </Stack>
                                </Stack>
                            )}

                            {/* STEP 2: Spreadsheet Grid Editing & Validation */}
                            {activeStep === 2 && (
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">{t('data-management:importTab.step2.title')}</Typography>
                                        <Typography variant="caption" color="text.secondary">{t('data-management:importTab.step2.subtitle')}</Typography>
                                    </Box>
                                    <Box sx={{ height: 400, width: '100%' }}>
                                        <DataGrid rows={gridRows} columns={gridColumns} processRowUpdate={handleProcessRowUpdate} density="compact" getRowId={(r) => r.id} />
                                    </Box>
                                    {validationResult && (
                                        <Alert severity={validationResult.invalidCount > 0 ? "error" : "success"}>
                                            {t('data-management:messages.dryRunResult')
                                                .replace('{{validCount}}', validationResult.validCount.toString())
                                                .replace('{{invalidCount}}', validationResult.invalidCount.toString())}
                                        </Alert>
                                    )}
                                    {validationResult?.errors.length > 0 && (
                                        <Box sx={{ height: 250, width: '100%' }}>
                                            <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>{t('data-management:importTab.step2.errorsDetected')}</Typography>
                                            <DataGrid rows={validationResult.errors} columns={errorColumns} getRowId={(r) => r.row} density="compact" />
                                        </Box>
                                    )}
                                    <Stack direction="row" spacing={2} justifyContent="space-between">
                                        <Button onClick={() => setActiveStep(1)}>{t('data-management:importTab.step2.backBtn')}</Button>
                                        <Stack direction="row" spacing={1}>
                                            <Button variant="outlined" color="warning" onClick={handleValidateGrid} disabled={loading}>
                                                {loading ? <CircularProgress size={18} /> : t('data-management:importTab.step2.validateBtn')}
                                            </Button>
                                            <Button variant="contained" color="success" onClick={handleProceedToConfirm} disabled={!validationResult || validationResult.invalidCount > 0}>
                                                {t('data-management:importTab.step2.proceedBtn')}
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Stack>
                            )}

                            {/* STEP 3: Execute and Confirm */}
                            {activeStep === 3 && (
                                <Stack spacing={3} alignItems="center">
                                    <SecurityIcon sx={{ fontSize: 60, color: '#a38f6d' }} />
                                    <Typography variant="h6">{t('data-management:importTab.step3.title')}</Typography>
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        {t('data-management:importTab.step3.subtitle')} {validationResult?.validCount} {t('data-management:importTab.step3.subtitle')}
                                    </Typography>
                                    <Stack direction="row" spacing={2} sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
                                        <Button onClick={() => setActiveStep(2)} fullWidth>{t('data-management:importTab.step3.backBtn')}</Button>
                                        <Button variant="contained" color="success" onClick={handleExecuteImport} disabled={loading} fullWidth>
                                            {loading ? <CircularProgress size={20} color="inherit" /> : t('data-management:importTab.step3.commitBtn')}
                                        </Button>
                                    </Stack>
                                </Stack>
                            )}

                            {/* STEP 4: Success */}
                            {activeStep === 4 && (
                                <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
                                    <CheckCircleIcon sx={{ fontSize: 70, color: 'success.main' }} />
                                    <Typography variant="h5" fontWeight="bold">{t('data-management:importTab.step4.title')}</Typography>
                                    <Typography variant="body1" color="text.secondary">{t('data-management:importTab.step4.subtitle')}</Typography>
                                    <Button variant="outlined" onClick={handleReset} sx={{ px: 4 }}>{t('data-management:importTab.step4.doneBtn')}</Button>
                                </Stack>
                            )}
                        </Stack>
                    )}

                </Paper>
            </Stack>
        </Box>
    );
}