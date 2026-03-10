//frontend/src/components/common/DeleteConfirmationDialog.tsx
'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useTranslation } from '@/i18n/useTranslation';

interface DeleteConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    cancelText?: string;
    confirmText?: string;
    confirmButtonColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    confirmButtonText?: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
    open, onClose, onConfirm, title, message, cancelText, confirmText
}) => {
    const { t } = useTranslation(['common']);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
            <DialogTitle sx={{ fontWeight: 'bold', pt: 3 }}>
                {title}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" color="text.secondary">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, px: 3 }}>
                <Button onClick={onClose} sx={{ color: '#666', fontWeight: 'bold' }}>
                    {cancelText || t('buttons.cancel', { defaultValue: 'CANCEL' }).toUpperCase()}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8c7a5d' }, fontWeight: 'bold', px: 3 }}
                >
                    {confirmText || t('buttons.confirm', { defaultValue: 'CONFIRM' }).toUpperCase()}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteConfirmationDialog;