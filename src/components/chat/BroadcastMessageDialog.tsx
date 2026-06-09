// frontend/src/components/chat/BroadcastMessageDialog.tsx
'use client';
import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Stack, MenuItem, Autocomplete, Typography, alpha
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

interface BroadcastMessageDialogProps {
    open: boolean;
    onCloseAction: () => void;
    contacts: any[];
    socket: any;
    senderId: number;
    onSuccessAction: (msg: string) => void;
}

export const BroadcastMessageDialog: React.FC<BroadcastMessageDialogProps> = ({
    open, onCloseAction, contacts, socket, senderId, onSuccessAction
}) => {
    const [targetType, setTargetType] = useState<'all' | 'selected'>('all');
    const [selectedDrivers, setSelectedDrivers] = useState<any[]>([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(false);

    const { t } = useTranslation(['chat', 'common']);

    const handleSend = () => {
        if (!messageText.trim() || !socket) return;
        setLoading(true);

        if (targetType === 'all') {
            socket.emit('broadcast_all', { senderId, text: messageText });
            onSuccessAction(t('chat:broadcastSendSuccess'));
        } else {
            const recipientIds = selectedDrivers.map(d => d.driverId);
            if (recipientIds.length === 0) {
                alert(t('chat.selectDriver'));
                setLoading(false);
                return;
            }
            socket.emit('broadcast_selected', { senderId, recipientIds, text: messageText });
            onSuccessAction(t('chat:broadcastSentSuccessfullyTo') + recipientIds.length + t('chat:selectedDrivers'));
        }

        setMessageText('');
        setSelectedDrivers([]);
        setLoading(false);
        onCloseAction();
    };

    return (
        <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle sx={{ bgcolor: alpha('#a38f6d', 0.02), borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <CampaignIcon sx={{ color: '#a38f6d', fontSize: 30 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#a38f6d' }}>
                        {t('chat:createBroadcastMessage')}
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                <Stack spacing={3}>
                    {/* Target Selector */}
                    <TextField
                        select
                        label={t('chat:recipientType')}
                        size="small"
                        value={targetType}
                        onChange={(e) => setTargetType(e.target.value as 'all' | 'selected')}
                        fullWidth
                    >
                        <MenuItem value="all">{t('chat:allActiveDrivers')}</MenuItem>
                        <MenuItem value="selected">{t('chat:selectSpecificDrivers')}</MenuItem>
                    </TextField>

                    {/* Multi-Select Autocomplete for Drivers */}
                    {targetType === 'selected' && (
                        <Autocomplete
                            multiple
                            size="small"
                            options={contacts}
                            getOptionLabel={(option) => `${option.driverName} (${option.vehicleRegNo || 'No Vehicle'})`}
                            value={selectedDrivers}
                            onChange={(_, newValue) => setSelectedDrivers(newValue)}
                            renderInput={(params) => (
                                <TextField {...params} label={t('chat:selectDriversForBroadcast')} placeholder="Search drivers..." />
                            )}
                            fullWidth
                        />
                    )}

                    {/* Message Box */}
                    <TextField
                        label="Message Text"
                        placeholder="Type the message to broadcast..."
                        multiline
                        rows={4}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        fullWidth
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: alpha('#a38f6d', 0.02) }}>
                <Button onClick={onCloseAction} variant="outlined" color="inherit">{t('common:buttons.cancel')}</Button>
                <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={loading || !messageText.trim()}
                    endIcon={<SendIcon />}
                    sx={{ bgcolor: '#a38f6d', px: 4, '&:hover': { bgcolor: '#8e7a5a' } }}
                >
                    {loading ? t('common:loading.searching') : t('chat:broadcastSentSuccessfully')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};