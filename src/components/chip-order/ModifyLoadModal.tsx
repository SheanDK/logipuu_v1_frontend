// src/components/chip-order/ModifyLoadModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, TextField, Stack, Divider, Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useTranslation } from '@/i18n/useTranslation';

// Confirmation Dialog
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';

const ModifyLoadModal = ({ open, loadData, onClose, onSave, onDelete }: any) => {
    const { t } = useTranslation(['chip-management']);
    const [notes, setNotes] = useState('');
    const [m3, setM3] = useState('');

    // Confirmation window
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (loadData) {
            setNotes(loadData.driverNotes || loadData.driver_notes || '');
            setM3(loadData.plannedM3 || loadData.planned_m3 || '45');
        }
    }, [loadData, open]);

    // Delete confirmation
    const handleConfirmDelete = () => {
        onDelete(loadData.loadId || loadData.load_id);
        setIsConfirmOpen(false);
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="xs"
                PaperProps={{
                    sx: { borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }
                }}
            >
                <DialogTitle component="div" sx={{
                    p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: '#fdfaf5', borderBottom: '1px solid #eee'
                }}>
                    <LocalShippingIcon sx={{ color: '#a38f6d', fontSize: '28px' }} />
                    <Typography variant="h6" component="span" sx={{ fontWeight: 800, color: '#444' }}>
                        {t('loadDetails.title')}
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#fafafa', border: '1px dashed #d1d1d1', position: 'relative' }}>
                            <Typography variant="caption" sx={{ position: 'absolute', top: -10, left: 10, bgcolor: '#fafafa', px: 1, color: '#a38f6d', fontWeight: 'bold', fontSize: '10px' }}>
                                {t('loadDetails.vehicleAndItem')}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#333' }}>
                                {loadData?.rekNro || loadData?.reknro} | {loadData?.titleName || loadData?.titlename}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 800, mb: 0.5, display: 'block', ml: 0.5 }}>
                                {t('loadDetails.instructionsLabel')}
                            </Typography>
                            <TextField
                                multiline rows={6} fullWidth
                                placeholder={t('loadDetails.instructionsPlaceholder')}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }}
                            />
                        </Box>
                    </Stack>
                </DialogContent>

                <Divider />

                <DialogActions sx={{ p: 2.5, justifyContent: 'space-between', bgcolor: '#fbfbfb' }}>
                    <Button variant="contained" startIcon={<CancelIcon />} onClick={onClose}
                        sx={{ bgcolor: '#eeeeee', color: '#555', borderRadius: '25px', px: 3, fontWeight: 'bold' }}>
                        {t('loadDetails.buttons.close')}
                    </Button>

                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="contained"
                            startIcon={<DeleteIcon />}
                            onClick={() => setIsConfirmOpen(true)} // Open confirmation window
                            sx={{ bgcolor: '#d32f2f', color: 'white', borderRadius: '25px', px: 3, fontWeight: 'bold' }}
                        >
                            {t('loadDetails.buttons.delete')}
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={() => onSave(loadData.loadId || loadData.load_id, notes)}
                            sx={{ bgcolor: '#a38f6d', color: 'white', borderRadius: '25px', px: 3, fontWeight: 'bold' }}
                        >
                            {t('loadDetails.buttons.save')}
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>

            {/* --- DELETE CONFIRMATION DIALOG --- */}
            <DeleteConfirmationDialog
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('loadDetails.deleteTitle')}
                message={t('loadDetails.deleteMessage', { rekNro: loadData?.rekNro || loadData?.reknro || '' })}
            />
        </>
    );
};

export default ModifyLoadModal;