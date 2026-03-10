// frontend/src/components/loads/EditConsignmentModal.tsx

'use client';
import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogContent, Button, TextField,
    Stack, Box, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Typography, CircularProgress, alpha, useTheme,
    Paper, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { updateLoad } from '@/services/loadService';
import { useSnackbar } from 'notistack';
import { useTranslation } from '@/i18n/useTranslation';

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

    useEffect(() => {
        if (loadData && open) {
            const formatted = (loadData.rahtikirjat || []).map((wb: any) => ({
                id: wb.rahtiId,
                customerName: wb.customerName || 'N/A',
                rahtikirjanNumero: wb.rahtikirjanNro || '',
                reitti: wb.reitti || '',
                m3: wb.m3 || 0,
                km: wb.km || 0,
                kpl: wb.kpl || 0,
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
            const payload = {
                tyyppi: 1,
                pvm: data.pvm,
                lisatiedot: data.lisatiedot,
                kalustoNro: loadData.kalusto_nro || loadData.kalustoNro,
                kuljId: loadData.kulj_id || loadData.kuljId,
                rahtikirjat: data.rahtikirjat.map((wb: any) => ({
                    ...wb,
                    asiakasId: wb.asiakasId || loadData.asiakasId
                }))
            };
            await updateLoad(loadData.kuormaId, payload, currentUser);
            onSaveSuccessAction(t('common:notifications.updateSuccess'));
        } catch (error) {
            enqueueSnackbar(t('common:notifications.error'), { variant: 'error' });
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
                        <Controller
                            name="pvm"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    type="date"
                                    label={t('columns.date')}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            )}
                        />
                        <Controller
                            name="lisatiedot"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={t('columns.globalNotes')}
                                    size="small"
                                    placeholder={t('columns.globalNotesPlaceholder') || 'Enter general notes...'}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </Box>

                    {/* Waybills Table */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 800,
                                mb: 1.5,
                                color: '#a38f6d',
                                textTransform: 'uppercase',
                                fontSize: '11px',
                                letterSpacing: '0.5px'
                            }}
                        >
                            {t('waybillsList') || 'Waybills List'} ({fields.length})
                        </Typography>

                        <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: isDarkMode ? '1px solid #444' : '1px solid #eee'
                            }}
                        >
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {[
                                            { label: t('columns.customer'), width: '15%' },
                                            { label: t('columns.waybill'), width: '12%' },
                                            { label: t('columns.cubicMeters'), width: '8%', center: true },
                                            { label: t('columns.pcs'), width: '8%', center: true },
                                            { label: t('columns.km'), width: '8%', center: true },
                                            { label: t('columns.hours'), width: '6%', center: true },
                                            { label: t('columns.tax'), width: '6%', center: true },
                                            { label: t('columns.route'), width: '15%' },
                                            { label: t('columns.notes'), width: '22%' }
                                        ].map(({ label, width, center }) => (
                                            <TableCell
                                                key={label}
                                                sx={{
                                                    fontWeight: 'bold',
                                                    fontSize: '11px',
                                                    width,
                                                    textAlign: center ? 'center' : 'left',
                                                    bgcolor: isDarkMode ? '#252525' : '#f8f9fa'
                                                }}
                                            >
                                                {label}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {fields.map((wb: any, idx) => (
                                        <TableRow
                                            key={wb.id || idx}
                                            hover
                                            sx={{
                                                '&:hover': {
                                                    bgcolor: isDarkMode
                                                        ? alpha('#fff', 0.02)
                                                        : '#fdfdfd'
                                                }
                                            }}
                                        >
                                            <TableCell sx={{ py: 1.2 }}>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="700"
                                                    sx={{ fontSize: '12px' }}
                                                >
                                                    {wb.customerName}
                                                </Typography>
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
                                                            <TextField
                                                                {...field}
                                                                type={col.type}
                                                                size="small"
                                                                variant="outlined"
                                                                fullWidth
                                                                sx={{
                                                                    '& .MuiOutlinedInput-input': {
                                                                        p: '6px 8px',
                                                                        fontSize: '12px',
                                                                        textAlign: col.type === 'number'
                                                                            ? 'center'
                                                                            : 'left'
                                                                    },
                                                                    '& .MuiOutlinedInput-root': {
                                                                        bgcolor: isDarkMode ? '#2c2c2c' : '#fff'
                                                                    }
                                                                }}
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

            <Box
                sx={{
                    flexShrink: 0,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2.5,
                    py: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: isDarkMode ? '#252525' : '#fdfaf5'
                }}
            >
                <Button
                    onClick={onCloseAction}
                    disabled={isSubmitting}
                    color="inherit"
                    sx={{ fontWeight: 'bold', borderRadius: '20px', px: 3 }}
                >
                    {t('common:buttons.cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    sx={{
                        bgcolor: '#a38f6d',
                        borderRadius: '25px',
                        px: 4,
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#8c7a5d' }
                    }}
                >
                    {isSubmitting
                        ? <CircularProgress size={24} color="inherit" />
                        : t('common:buttons.save')
                    }
                </Button>
            </Box>
        </Dialog>
    );
}