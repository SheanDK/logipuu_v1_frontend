// frontend/src/components/drivers/TransferRequestPopup.tsx
'use client';

import React from 'react';
import { Dialog, DialogContent, Typography, Button, Box, alpha, Slide, CircularProgress } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { t } from 'i18next';


const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children: React.ReactElement<any, any> },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface TransferRequestPopupProps {
    open: boolean;
    data: any;
    onAcknowledge: () => void; // onAction වෙනුවට onAcknowledge භාවිතා කරමු
}

const TransferRequestPopup: React.FC<TransferRequestPopupProps> = ({ open, data, onAcknowledge }) => {
    if (!open || !data) return null;
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const isDeleted = data.type === 'LOAD_DELETED';

    const handleAcknowledge = async () => {
        setIsSubmitting(true);
        await onAcknowledge();
    };

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    background: alpha('#ffffff', 0.8),
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: alpha(isDeleted ? '#d32f2f' : '#a38f6d', 0.3),
                    boxShadow: isDeleted ? '0 8px 32px 0 rgba(211, 47, 47, 0.2)' : '0 8px 32px 0 rgba(163, 143, 109, 0.37)',
                }
            }}
            sx={{ '& .MuiBackdrop-root': { backgroundColor: alpha('#000', 0.6) } }}
        >
            <DialogContent sx={{ textAlign: 'center', p: 4 }}>
                <Box
                    sx={{
                        width: 70, height: 70,
                        bgcolor: isDeleted ? '#d32f2f' : '#a38f6d',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px', boxShadow: 3
                    }}
                >
                    {isDeleted ? (
                        <DeleteSweepIcon sx={{ color: 'white', fontSize: 40 }} />
                    ) : (
                        <AssignmentTurnedInIcon sx={{ color: 'white', fontSize: 40 }} />
                    )}
                </Box>

                <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
                    {isDeleted ? t('notifications:LOAD_DELETED.title', { defaultValue: 'Load Removed' }) : t('notifications:LOAD_ASSIGNED.title', { defaultValue: 'New Assignment' })}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                    {data.message}
                </Typography>

                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={24} color="inherit" /> : <CheckCircleIcon />}
                    onClick={handleAcknowledge}
                    sx={{
                        bgcolor: isDeleted ? '#d32f2f' : '#a38f6d',
                        '&:hover': { bgcolor: isDeleted ? '#b71c1c' : '#8c7a5d' },
                        fontWeight: 'bold',
                        py: 1.5,
                        borderRadius: 2
                    }}
                >
                    {t('common:buttons.ok', { defaultValue: 'Acknowledge' })}
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default TransferRequestPopup;