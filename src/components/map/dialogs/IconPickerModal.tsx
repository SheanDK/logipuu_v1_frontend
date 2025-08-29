// src/components/map/dialogs/IconPickerModal.tsx
'use client';

import { Dialog, DialogTitle, DialogContent, IconButton, TextField, Box, DialogActions, Button } from '@mui/material';
import * as Icons from '@mui/icons-material';
import { useEffect, useState } from 'react';

// Predefined lists of icons for better UX
const allIconNames = Object.keys(Icons).filter(name => /^[A-Z]/.test(name) && !name.endsWith('Outlined'));
const logisticsIconNames = [ 'UTurnLeft', 'UTurnRight', 'PushPin', 'ControlPoint', 'Add', 'Route', 'Directions', 'LocalParking', 'Warehouse', 'SyncAlt', 'ChangeCircle', 'DoNotDisturb', 'Dangerous', 'ReportProblem', 'FlagCircle', 'WarningAmber', 'Report' ];

interface IconPickerModalProps {
  open: boolean;
  onCloseAction: () => void;
  onSelectAction: (iconName: string) => void;
}

export default function IconPickerModal({ open, onCloseAction, onSelectAction }: IconPickerModalProps) {
    const [search, setSearch] = useState('');
    const filteredMuiIcons = search ? allIconNames.filter(name => name.toLowerCase().includes(search.toLowerCase())).slice(0, 50) : logisticsIconNames;

    useEffect(() => { if (!open) setSearch(''); }, [open]);

    return (
        <Dialog open={open} onClose={onCloseAction}>
            <DialogTitle>Select Icon</DialogTitle>
            <DialogContent sx={{ width: 400 }}>
                <TextField label="Search Icon (English only)" fullWidth size="small" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mt: 1, mb: 2 }} />
                <Box display="flex" flexWrap="wrap" gap={1}>
                    {filteredMuiIcons.map((name) => {
                        const Icon = Icons[name as keyof typeof Icons];
                        return <IconButton key={name} onClick={() => onSelectAction(name)} title={name}><Icon /></IconButton>;
                    })}
                </Box>
            </DialogContent>
            <DialogActions><Button onClick={onCloseAction} color="error">Cancel</Button></DialogActions>
        </Dialog>
    );
}