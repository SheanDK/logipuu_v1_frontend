// frontend/src/components/drivers/SelectVehicleModal.tsx
'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Button, FormControl, InputLabel,
    Select, MenuItem, Box, Typography, Stack, CircularProgress
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { IVehicleBasicInfo } from '@/types';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SelectVehicleModalProps {
    open: boolean;
    vehicles: IVehicleBasicInfo[];
    onVehicleSelectAction: (vehicleId: string, regNo: string) => Promise<void>;
}

export default function SelectVehicleModal({ open, vehicles, onVehicleSelectAction }: SelectVehicleModalProps) {
    const [selectedId, setSelectedId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorPopup, setErrorPopup] = useState<{ open: boolean, message: string }>({ open: false, message: '' });

    const { t } = useTranslation(['selectVehicleModal', 'common']);
    const router = useRouter();
    const { user, logout } = useAuth(); // 🚀 රියදුරාගේ තොරතුරු ලබා ගනී

    const handleConfirm = async () => {
        const selectedVehicle = vehicles.find(v => v.id === selectedId);
        if (selectedVehicle) {
            setIsSubmitting(true);
            try {
                await onVehicleSelectAction(selectedVehicle.id, selectedVehicle.registrationNo);
            } catch (error: any) {
                const msg = error.response?.data?.message || "An unexpected error occurred.";
                setErrorPopup({ open: true, message: msg });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleRedirectToLogin = () => {
        setErrorPopup({ ...errorPopup, open: false });
        logout();
        router.push('/login');
    };

    return (
        <>
            <Dialog open={open} disableEscapeKeyDown PaperProps={{ sx: { minWidth: 400, borderRadius: '12px' } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>{t('selectVehicleTitle')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">{t('selectVehicleHelp')}</Typography>
                        <FormControl fullWidth required>
                            <InputLabel>{t('vehicleLabel')}</InputLabel>
                            <Select
                                value={selectedId}
                                label={t('vehicleLabel')}
                                onChange={(e) => setSelectedId(e.target.value as string)}
                                disabled={isSubmitting}
                            >
                                {vehicles.map((v, index) => {
                                    // 🚀 වාහනය භාවිතා කරන්නේ වෙනත් රියදුරෙකු දැයි පරීක්ෂා කරයි
                                    // රියදුරු 'Aleksi' ලොග් වී සිටී නම් සහ වාහනය 'In Use by Aleksi' නම්, එය disabled නොවේ.
                                    const isUsedBySomeoneElse = !!(
                                        v.currentDriverTunnus &&
                                        v.currentDriverTunnus !== "" &&
                                        v.currentDriverTunnus !== user?.userId // 'user.userId' යනු ලොග් වූ අයගේ tunnus එකයි
                                    );

                                    return (
                                        <MenuItem
                                            // 🚀 FIX: Key එක සැමවිටම unique බව සහතික කිරීමට ID සහ Index එකතු කළා
                                            key={`${v.id}-${v.registrationNo}-${index}`}
                                            value={v.id}
                                            disabled={isUsedBySomeoneElse}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                <Typography
                                                    sx={{
                                                        color: isUsedBySomeoneElse ? 'text.disabled' : 'inherit',
                                                        fontWeight: v.currentDriverTunnus === user?.userId ? 'bold' : 'normal'
                                                    }}
                                                >
                                                    {v.registrationNo}
                                                </Typography>

                                                {v.currentDriverTunnus && (
                                                    <Typography
                                                        variant="caption"
                                                        color={v.currentDriverTunnus === user?.userId ? "primary" : "error"}
                                                    >
                                                        {v.currentDriverTunnus === user?.userId
                                                            ? `(Currently yours)`
                                                            : `${t('common:inUse')}: ${v.currentDriverTunnus}`
                                                        }
                                                    </Typography>
                                                )}
                                            </Box>
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={handleConfirm}
                            disabled={!selectedId || isSubmitting}
                            sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' }, py: 1.5, fontWeight: 'bold' }}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('confirmAndStart')}
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* Error Popup (Remain same) */}
            <Dialog
                open={errorPopup.open}
                onClose={() => setErrorPopup({ ...errorPopup, open: false })}
                PaperProps={{ sx: { borderRadius: '16px', p: 1, width: '380px' } }}
            >
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <WarningAmberIcon sx={{ fontSize: 60, color: '#d32f2f', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {t('common:attentionRequired', { defaultValue: 'Attention Required' })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {errorPopup.message}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button
                            fullWidth variant="outlined" color="inherit"
                            onClick={() => setErrorPopup({ ...errorPopup, open: false })}
                            sx={{ borderRadius: '8px', fontWeight: 'bold' }}
                        >
                            {t('common:cancel', { defaultValue: 'Cancel' })}
                        </Button>
                        <Button
                            fullWidth variant="contained"
                            sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' }, borderRadius: '8px', fontWeight: 'bold' }}
                            onClick={handleRedirectToLogin}
                        >
                            {t('common:understand', { defaultValue: 'Understand' })}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </>
    );
}