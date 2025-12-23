// src/app/[lng]/(main)/wood-categories/page.tsx
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, CircularProgress, Alert, AlertColor, Chip, Tooltip
} from '@mui/material';
import { 
  DataGrid, GridColDef, GridActionsCellItem, GridToolbar, GridRenderCellParams 
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';

import {
  fetchAllWoodTypes,
  createWoodType,
  updateWoodType,
  deleteWoodType,
} from '@/services/woodCategoriesServices';
// Assuming you reuse the same modal for Edit, or you might need to adapt it to accept initialData
import NewWoodTypeModal from '@/components/wood-categories/newWoodTypeModal';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n/useTranslation';

// Define the data shape for the grid
interface IWoodTypeRow {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export default function WoodCategoriesPage() {
  const { user } = useAuth();
  const { t } = useTranslation(['woodCategories', 'common']);

  // Permissions
  const canView = useMemo(() => user?.permissions?.includes('wood categories_view'), [user]);
  const canCreate = useMemo(() => user?.permissions?.includes('wood categories_create'), [user]);
  const canEdit = useMemo(() => user?.permissions?.includes('wood categories_edit'), [user]);
  const canDelete = useMemo(() => user?.permissions?.includes('wood categories_delete'), [user]);

  const [rows, setRows] = useState<IWoodTypeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IWoodTypeRow | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<IWoodTypeRow | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    if (!canView) {
      setFeedback({ type: 'error', message: t('common:messages.noPermission') });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const list = await fetchAllWoodTypes(); 
      // Transform to ensure ID is string for DataGrid
      const formattedRows = list.map((w: any) => ({
        id: String(w.id),
        name: w.name,
        description: w.description ?? '',
        active: w.active
      }));
      setRows(formattedRows);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e?.message ?? t('woodCategories:feedback.loadError') });
    } finally {
      setIsLoading(false);
    }
  }, [canView, t]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  // Modal Handlers
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: IWoodTypeRow) => {
    setEditingItem(row);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Save Handler (Create or Update)
  // Note: Ensure NewWoodTypeModal passes the data back correctly
  const handleSave = async (payload: any) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        // Update
        await updateWoodType(editingItem.id, payload);
        setFeedback({ type: 'success', message: t('woodCategories:feedback.saved', { name: payload.name }) });
      } else {
        // Create
        await createWoodType(payload);
        setFeedback({ type: 'success', message: t('woodCategories:feedback.created') });
      }
      handleCloseModal();
      loadData();
    } catch (e: any) {
        const msg = axios.isAxiosError(e) ? e.response?.data?.message : e.message;
        setFeedback({ type: 'error', message: msg || t('woodCategories:feedback.saveError') });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Handler
  const handleDeleteClick = (row: IWoodTypeRow) => {
    setDeleteTarget(row);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await deleteWoodType(deleteTarget.id);
      setFeedback({ type: 'success', message: t('woodCategories:feedback.deleted', { name: deleteTarget.name }) });
      loadData();
    } catch (e: any) {
        const msg = axios.isAxiosError(e) ? e.response?.data?.message : e.message;
        setFeedback({ type: 'error', message: msg || t('woodCategories:feedback.deleteError') });
    } finally {
      setIsSaving(false);
      setDeleteTarget(null);
    }
  };

  // Columns Definition
  const columns: GridColDef<IWoodTypeRow>[] = useMemo(() => {
    const baseCols: GridColDef<IWoodTypeRow>[] = [
      { 
        field: 'name', 
        headerName: t('woodCategories:columns.name'), 
        // FIX: Removed default flex behavior if it was implicit, set specific width
        width: 300 
      },
      { 
        field: 'description', 
        headerName: t('woodCategories:columns.description'), 
        // FIX: Replaced 'flex: 1' with specific width to avoid stretching
        width: 400 
      },
      {
        field: 'active',
        headerName: t('woodCategories:columns.active'),
        width: 150, // Fixed width
        renderCell: (params: GridRenderCellParams<IWoodTypeRow, boolean>) => (
          <Chip
            icon={params.value ? <CheckCircleIcon /> : <CancelIcon />}
            label={params.value ? t('status.active') : t('status.inactive')}
            color={params.value ? 'success' : 'default'}
            size="small"
            variant="outlined"
          />
        ),
      },
    ];

    if (canEdit || canDelete) {
      baseCols.push({
        field: 'actions',
        type: 'actions',
        headerName: t('woodCategories:columns.actions'),
        width: 120, // Fixed width
        getActions: ({ row }) => {
          const actions = [];
          if (canEdit) {
            actions.push(
              <GridActionsCellItem
                key="edit"
                icon={<Tooltip title={t('common:actions.edit')}><EditIcon /></Tooltip>}
                label="Edit"
                onClick={() => handleOpenEdit(row)}
              />
            );
          }
          if (canDelete) {
            actions.push(
              <GridActionsCellItem
                key="delete"
                icon={<Tooltip title={t('common:actions.delete')}><DeleteIcon color="error" /></Tooltip>}
                label="Delete"
                onClick={() => handleDeleteClick(row)}
              />
            );
          }
          return actions;
        },
      });
    }
    return baseCols;
  }, [canEdit, canDelete, t]);

  if (isLoading || !user) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!canView) {
    return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">{t('common:messages.noPermission')}</Alert></Paper>;
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, height: 'calc(100vh - 128px)', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">{t('woodCategories:title')}</Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            {t('woodCategories:new')}
          </Button>
        )}
      </Box>

      {feedback && (
        <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      )}

      <Box sx={{ height: `calc(100% - ${feedback ? '112px' : '56px'})`, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          density="compact"
          loading={isLoading}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
          // Common styles for Header (Bold & Uppercase)
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
            },
          }}
        />
      </Box>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <NewWoodTypeModal
          open={isModalOpen}
          onCloseAction={handleCloseModal}
          // Adapt the modal to handle both create/update via this callback
          onCreatedAction={handleSave} 
          // You might need to update NewWoodTypeModal to accept 'initialData' prop 
          // to pre-fill the form for editing.
          // @ts-ignore - Assuming you will update the component to accept this prop
          initialData={editingItem}
        />
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <ConfirmationDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title={t('woodCategories:confirmDelete.title')}
          message={t('woodCategories:confirmDelete.message', { name: deleteTarget.name })}
          isConfirming={isSaving}
          confirmButtonColor="error"
        />
      )}
    </Paper>
  );
}