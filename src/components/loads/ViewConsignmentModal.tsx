// frontend/src/components/loads/ViewConsignmentModal.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Box, Divider, CircularProgress } from '@mui/material';
import { getTripById } from '@/services/loadService';
import dayjs from 'dayjs';

interface ViewConsignmentModalProps {
    open: boolean;
    onClose: () => void;
    loadId: number | null;
}

export default function ViewConsignmentModal({ open, onClose, loadId }: ViewConsignmentModalProps) {
    const [loadData, setLoadData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && loadId) {
            setLoading(true);
            getTripById(loadId)
                .then(data => {
                    console.log("Loaded Consignment Data:", data); // Debugging
                    setLoadData(data);
                })
                .catch(err => {
                    console.error("Failed to load consignment:", err);
                })
                .finally(() => setLoading(false));
        } else {
            setLoadData(null);
        }
    }, [open, loadId]);

    if (!open) return null;

    // Helper to safely format numbers
    const fmtNum = (val: any) => Number(val || 0).toFixed(2);
    const fmtInt = (val: any) => Number(val || 0);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd', pb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Consignment Details #{loadData?.kuormaId || '...'}
                    </Typography>
                    {loadData?.status && (
                        <Chip 
                            label={loadData.status} 
                            color={loadData.status === 'Completed' ? 'success' : 'warning'} 
                            size="small" 
                        />
                    )}
                </Stack>
            </DialogTitle>
            
            <DialogContent sx={{ py: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : loadData ? (
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {/* Header Info */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Date</Typography>
                                <Typography variant="body1" fontWeight="500">
                                    {loadData.pvm ? dayjs(loadData.pvm).format('DD.MM.YYYY') : '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                                <Typography variant="body1" fontWeight="500">{loadData.rekNro || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Driver</Typography>
                                <Typography variant="body1" fontWeight="500">{loadData.kuljettajanNimi || '-'}</Typography>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Waybills Table */}
                        <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Waybills ({loadData.rahtikirjat?.length || 0})
                            </Typography>
                            <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Waybill #</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>M3</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>KM</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Pcs</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(!loadData.rahtikirjat || loadData.rahtikirjat.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                    No waybills found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            loadData.rahtikirjat.map((wb: any, idx: number) => (
                                                <TableRow key={idx} hover>
                                                    <TableCell>{wb.customerName || '-'}</TableCell>
                                                    <TableCell>{wb.rahtikirjanNro || '-'}</TableCell>
                                                    <TableCell>{wb.reitti || '-'}</TableCell>
                                                    <TableCell align="right">{fmtNum(wb.m3)}</TableCell>
                                                    <TableCell align="right">{fmtNum(wb.km)}</TableCell>
                                                    <TableCell align="right">{fmtInt(wb.kpl)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                        {/* Totals Row */}
                                        <TableRow sx={{ bgcolor: '#e3f2fd', '& td': { fontWeight: 'bold' } }}>
                                            <TableCell colSpan={3} align="right">Total:</TableCell>
                                            <TableCell align="right">{fmtNum(loadData.m3)}</TableCell>
                                            <TableCell align="right">{fmtNum(loadData.km)}</TableCell>
                                            <TableCell align="right">{fmtInt(loadData.kpl)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        {/* Global Notes */}
                        {loadData.lisatiedot && (
                            <Box sx={{ bgcolor: '#fffde7', p: 2, borderRadius: 1, border: '1px solid #fff9c4' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Additional Notes</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>{loadData.lisatiedot}</Typography>
                            </Box>
                        )}
                    </Stack>
                ) : (
                    <Typography color="error">Failed to load data.</Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="contained" color="primary">Close</Button>
            </DialogActions>
        </Dialog>
    );
}