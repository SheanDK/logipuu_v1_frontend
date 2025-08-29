// frontend/src/components/map/lists/WoodEntryList.tsx
'use client';

import React, { useState } from 'react';
import {
    Box, Typography, TextField, IconButton, Paper, Tooltip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { ITimberStackWoodEntry, IPuutavaraItem, IMapDropoffLocation } from '@/types';

interface WoodEntryListProps {
    entries: any[];
    onFieldChangeAction: (index: number, newValues: { totalVolume: number, fetchedVolume: number }) => void;
    onDeleteAction: (index: number) => void;
    woodTypeList: IPuutavaraItem[];
    dropoffLocationList: IMapDropoffLocation[];
    isEditMode: boolean;
}

export function WoodEntryList({
    entries, onFieldChangeAction, onDeleteAction, woodTypeList, dropoffLocationList, isEditMode
}: WoodEntryListProps) {
    
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempValues, setTempValues] = useState<{ totalVolume: number, fetchedVolume: number } | null>(null);

    const resolveWoodTypeName = (id: number) => 
        woodTypeList.find(wt => Number(wt.puutavaraNro) === Number(id))?.puutavara || `ID: ${id}`;

    const resolveDropoffName = (id: number) => 
        dropoffLocationList.find(dl => Number(dl.id) === Number(id))?.name || `ID: ${id}`;

    const handleEditClick = (index: number, entry: ITimberStackWoodEntry) => {
        setEditingIndex(index);
        setTempValues({ totalVolume: Number(entry.totalVolume), fetchedVolume: Number(entry.fetchedVolume) });
    };

    const handleCancelClick = () => {
        setEditingIndex(null);
        setTempValues(null);
    };

    // --- THIS IS THE CORRECTED FUNCTION ---
    const handleSaveClick = (index: number) => {
        if (tempValues) {
            // Call the action only ONCE with the complete object of new values.
            // This now matches the prop's type signature: (index, { totalVolume, fetchedVolume })
            onFieldChangeAction(index, tempValues);
        }
        setEditingIndex(null);
        setTempValues(null);
    };

    if (!entries || entries.length === 0) {
        return (
            <Box sx={{ mt: 2, p: 2, border: '1px dashed #bdbdbd', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    No timber types have been added to this Puulaani yet.
                </Typography>
            </Box>
        );
    }
    
    return (
        <Box sx={{ mt: 2, width: '100%' }}>
            <TableContainer component={Paper} sx={{border: '1px solid #ccc'}}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#004d40', '& .MuiTableCell-root': { color: 'white', fontWeight: 'bold', border: '1px solid #4db6ac' } }}>
                        <TableRow>
                            <TableCell>Type of timber</TableCell>
                            <TableCell>Unloading site</TableCell>
                            <TableCell align="right">Cubes</TableCell>
                            <TableCell align="right">Retrieved</TableCell>
                            <TableCell align="right">Left</TableCell>
                            <TableCell align="center">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((item, index) => {
                            const isEditing = editingIndex === index;
                            const totalVolume = Number(item.totalVolume) || 0;
                            const fetchedVolume = Number(item.fetchedVolume) || 0;
                            const remaining = totalVolume - fetchedVolume;
                            const currentEditValues = isEditing ? tempValues : { totalVolume, fetchedVolume };

                            return (
                                <TableRow key={item.keyId || item.id} hover sx={{ '& > td': { border: '1px solid #e0e0e0' } }}>
                                    <TableCell sx={{backgroundColor: '#e0f2f1'}}>{resolveWoodTypeName(item.woodTypeId)}</TableCell>
                                    <TableCell sx={{backgroundColor: '#e0f2f1'}}>{resolveDropoffName(item.dropoffLocationId)}</TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            size="small" type="number" variant={isEditing ? "outlined" : "standard"}
                                            disabled={!isEditing}
                                            // Using 'value' prop for controlled component
                                            value={isEditing ? tempValues?.totalVolume ?? '' : totalVolume.toFixed(2)}
                                            onChange={(e) => setTempValues(prev => ({ ...prev!, totalVolume: Number(e.target.value) || 0 }))}
                                            sx={{ width: '80px', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'inherit' }, '& .MuiInput-underline:before': { border: 'none' } }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            size="small" type="number" variant={isEditing ? "outlined" : "standard"}
                                            disabled={!isEditing}
                                            // Using 'value' prop for controlled component
                                            value={isEditing ? tempValues?.fetchedVolume ?? '' : fetchedVolume.toFixed(2)}
                                            onChange={(e) => setTempValues(prev => ({ ...prev!, fetchedVolume: Number(e.target.value) || 0 }))}
                                            sx={{ width: '80px', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'inherit' }, '& .MuiInput-underline:before': { border: 'none' } }}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{backgroundColor: '#e0f2f1'}}>
                                        <Typography variant="body2">
                                            {(currentEditValues!.totalVolume - currentEditValues!.fetchedVolume).toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{backgroundColor: '#e0f2f1'}}>
                                        {isEditing ? (
                                            <>
                                                <Tooltip title="Save"><IconButton size="small" color="primary" onClick={() => handleSaveClick(index)}><SaveIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Cancel"><IconButton size="small" onClick={handleCancelClick}><CancelIcon fontSize="small" /></IconButton></Tooltip>
                                            </>
                                        ) : (
                                            <>
                                                <Tooltip title="Update"><IconButton size="small" onClick={() => handleEditClick(index, item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDeleteAction(index)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}