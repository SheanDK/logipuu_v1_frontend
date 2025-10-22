// frontend/src/components/common/SettingsModal.tsx
'use client';

import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { useSettings } from '@/contexts/SettingsContext';
import { useSnackbar } from 'notistack';

interface SettingsModalProps {
    open: boolean;
    onCloseAction: () => void;
}

export default function SettingsModal({ open, onCloseAction }: SettingsModalProps) {
    const { apiBaseUrl, setApiBaseUrl } = useSettings();
    const [url, setUrl] = useState(apiBaseUrl);
    const { enqueueSnackbar } = useSnackbar();

    const handleSave = () => {
        setApiBaseUrl(url);
        enqueueSnackbar('Server address updated. The application will now reload.', { variant: 'success' });
        onCloseAction();
        setTimeout(() => window.location.reload(), 1500);
    };

    return (
        <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm">
            <DialogTitle>Server Settings</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Change the base URL of the API server.
                </Typography>
                <TextField
                    autoFocus
                    margin="dense"
                    id="server-address"
                    label="Server Address (e.g., https://api.example.com)"
                    type="url"
                    fullWidth
                    variant="outlined"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCloseAction}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save and Reload</Button>
            </DialogActions>
        </Dialog>
    );
}