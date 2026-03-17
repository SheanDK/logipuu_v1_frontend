// frontend/src/components/loads/EditConsignmentModal.tsx

'use client';
import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogContent, DialogActions, Button, TextField,
    Stack, Box, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Typography, CircularProgress, alpha, useTheme,
    Paper,
    IconButton
} from '@mui/material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { updateLoad } from '@/services/loadService';
import { useSnackbar } from 'notistack';
import { useTranslation } from '@/i18n/useTranslation';
import CloseIcon from '@mui/icons-material/Close';

export default function EditConsignmentModal({ open, onCloseAction, onSaveSuccessAction, loadData, currentUser }: any) {
    const { t } = useTranslation(['loadsPage', 'common']);
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: { pvm: '', lisatiedot: '', rahtikirjat: [] as any[] }
    });
    const { fields } = useFieldArray({ control, name: 'rahtikirjat' });

    const getSafeAsiakasId = (data: any) => {
        return data?.asiakasId || data?.asiakas_id || data?.customerId || null;
    };

    useEffect(() => {
        if (loadData && open) {
            console.log("🔍 Checking loadData structure:", loadData);

            const mainAsiakasId = getSafeAsiakasId(loadData);

            const formatted = (loadData.rahtikirjat || []).map((wb: any) => ({
                id: wb.rahtiId || wb.rahti_id || wb.id,
                asiakasId: getSafeAsiakasId(wb) || mainAsiakasId || '',
                customerName: wb.customerName || wb.asiakkaan_nimi || 'N/A',
                rahtikirjanNumero: wb.rahtikirjanNro || wb.waybillNumber || '',
                reitti: wb.reitti || '',
                m3: wb.m3 || 0,
                kpl: wb.kpl || 0,
                km: wb.km || 0,
                jako: wb.jako || 0,
                tievero: wb.tievero || 0,
                lisatiedot: wb.lisatiedot || ''
            }));

            reset({
                pvm: loadData.pvm ? new Date(loadData.pvm).toISOString().split('T')[0] : '',
                lisatiedot: loadData.lisatiedot || '',
                rahtikirjat: formatted
            });
        }
    }, [loadData, open, reset]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const mainId = getSafeAsiakasId(loadData) || (data.rahtikirjat.length > 0 ? getSafeAsiakasId(data.rahtikirjat[0]) : null);

            if (!mainId) {
                throw new Error("Customer ID could not be identified. Please check the data.");
            }

            const payload = {
                tyyppi: 1,
                pvm: data.pvm,
                lisatiedot: data.lisatiedot,
                asiakasId: Number(mainId),
                kalustoNro: Number(loadData.kalusto_nro || loadData.kalustoNro),
                kuljId: Number(loadData.kulj_id || loadData.kuljId),

                m3: data.rahtikirjat.reduce((s: number, w: any) => s + Number(w.m3 || 0), 0),
                km: data.rahtikirjat.reduce((s: number, w: any) => s + Number(w.km || 0), 0),
                kpl: data.rahtikirjat.reduce((s: number, w: any) => s + Number(w.kpl || 0), 0),
                tunnit: data.rahtikirjat.reduce((s: number, w: any) => s + Number(w.jako || 0), 0),

                rahtikirjat: data.rahtikirjat.map((wb: any) => ({
                    id: wb.id,
                    asiakasId: Number(getSafeAsiakasId(wb) || mainId),
                    rahtikirjanNumero: wb.rahtikirjanNumero,
                    reitti: wb.reitti,
                    m3: Number(wb.m3 || 0),
                    kpl: Number(wb.kpl || 0),
                    km: Number(wb.km || 0),
                    jako: Number(wb.jako || 0),
                    tievero: Number(wb.tievero || 0),
                    lisatiedot: wb.lisatiedot
                }))
            };

            await updateLoad(loadData.kuormaId, payload, currentUser);
            onSaveSuccessAction(t('common:notifications.updateSuccess'));
            onCloseAction();

        } catch (error: any) {
            console.error("❌ Final Update Error:", error.message);
            enqueueSnackbar(error.message || t('common:notifications.error'), { variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onCloseAction}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    bgcolor: isDarkMode ? '#1e1e1e' : '#fff',
                    backgroundImage: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh',
                    overflow: 'hidden'
                }
            }}
        >
            {/* TITLE ROW */}
            <Box
                sx={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: isDarkMode ? '#252525' : '#fdfaf5',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    px: 3,
                    py: 2,
                    minHeight: 64
                }}
            >
                <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>
                    {t('editConsignmentModal.title', { id: loadData?.kuormaId })}
                </Typography>
                <IconButton
                    size="small"
                    onClick={onCloseAction}
                    disabled={isSubmitting}
                    sx={{ color: 'text.secondary' }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    px: 3,
                    py: 3,
                    '&.MuiDialogContent-root': {
                        paddingTop: '24px !important'
                    }
                }}
            >
                <Stack spacing={4}>

                    {/* Top Row: Date + Global Notes */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '180px 1fr',
                            gap: 3,
                            alignItems: 'start'
                        }}
                    >
                        <Controller name="pvm" control={control} render={({ field }) => (
                            <TextField {...field} type="date" label={t('loadsPage:columns.date')} size="small" InputLabelProps={{ shrink: true }} fullWidth />
                        )} />
                        <Controller name="lisatiedot" control={control} render={({ field }) => (
                            <TextField {...field} label={t('loadsPage:columns.globalNotes')} size="small" fullWidth InputLabelProps={{ shrink: true }} />
                        )} />
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#a38f6d', textTransform: 'uppercase', fontSize: '11px' }}>
                            {t('loadsPage:waybillsList')} ({fields.length})
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: isDarkMode ? '#252525' : '#f8f9fa' }}>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', width: '15%', bgcolor: 'inherit' }}>CUSTOMER</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', width: '12%', bgcolor: 'inherit' }}>WAYBILL</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', width: '8%', textAlign: 'center', bgcolor: 'inherit' }}>m³</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', width: '8%', textAlign: 'center', bgcolor: 'inherit' }}>PCS</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', width: '8%', textAlign: 'center', bgcolor: 'inherit' }}>KM</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', width: '6%', textAlign: 'center', bgcolor: 'inherit' }}>HRS</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', width: '6%', textAlign: 'center', bgcolor: 'inherit' }}>TAX</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', width: '15%', bgcolor: 'inherit' }}>ROUTE</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', width: '22%', bgcolor: 'inherit' }}>NOTES</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {fields.map((wb: any, idx) => (
                                        <TableRow key={wb.id || idx} hover>
                                            <TableCell sx={{ py: 1.2 }}>
                                                <Typography variant="body2" fontWeight="700" sx={{ fontSize: '11px' }}>{wb.customerName}</Typography>
                                            </TableCell>
                                            {[
                                                { name: 'rahtikirjanNumero', type: 'text' },
                                                { name: 'm3', type: 'number' },
                                                { name: 'kpl', type: 'number' },
                                                { name: 'km', type: 'number' },
                                                { name: 'jako', type: 'number' },
                                                { name: 'tievero', type: 'number' },
                                                { name: 'reitti', type: 'text' },
                                                { name: 'lisatiedot', type: 'text' }
                                            ].map((col) => (
                                                <TableCell key={col.name} sx={{ p: 0.5 }}>
                                                    <Controller
                                                        name={`rahtikirjat.${idx}.${col.name}`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <TextField {...field} type={col.type} size="small" fullWidth
                                                                sx={{ '& .MuiOutlinedInput-input': { p: '6px 8px', fontSize: '12px', textAlign: col.type === 'number' ? 'center' : 'left' }, '& .MuiOutlinedInput-root': { bgcolor: isDarkMode ? '#2c2c2c' : '#fff' } }}
                                                            />
                                                        )}
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: isDarkMode ? '#252525' : '#fdfaf5' }}>
                <Button onClick={onCloseAction} disabled={isSubmitting} color="inherit" sx={{ fontWeight: 'bold', borderRadius: '20px', px: 3 }}>{t('common:buttons.cancel')}</Button>
                <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} sx={{ bgcolor: '#a38f6d', borderRadius: '25px', px: 4, fontWeight: 'bold' }}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('common:buttons.save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}