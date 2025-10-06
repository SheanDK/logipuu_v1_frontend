'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Checkbox, IconButton, Button,
  CircularProgress, Alert, Tooltip, AlertColor
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  fetchAllWoodTypes,
  createWoodType,
  updateWoodType,
  deleteWoodType,
} from '@/services/woodCategoriesServices';
import NewWoodTypeModal from '@/components/wood-categories/newWoodTypeModal';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n/useTranslation';

type EditableRow = {
  id: string;         // always string for stable keys
  name: string;
  description: string;
  active: boolean;
  dirty?: boolean;
};

export default function WoodCategoriesPage() {
  const { user } = useAuth();
  const { t } = useTranslation(['woodCategories', 'common']); // re-use common strings for feedback/buttons

  const canView = useMemo(() => user?.permissions?.includes('wood categories_view'), [user]);
  const canCreate = useMemo(() => user?.permissions?.includes('wood categories_create'), [user]);
  const canEdit = useMemo(() => user?.permissions?.includes('wood categories_edit'), [user]);
  const canDelete = useMemo(() => user?.permissions?.includes('wood categories_delete'), [user]);

  const [rows, setRows] = useState<EditableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: AlertColor; message: string } | null>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EditableRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!canView) {
      setFeedback({ type: 'error', message: t('common:messages.noPermission') });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchAllWoodTypes(); // [{ id, name, description, active }]
      setRows(list.map(w => ({ ...w, id: String(w.id), description: w.description ?? '', dirty: false })));
    } catch (e: any) {
      setFeedback({ type: 'error', message: e?.message ?? t('woodCategories:feedback.loadError') });
    } finally {
      setLoading(false);
    }
  }, [canView, t]);

  useEffect(() => { if (user) load(); }, [user, load]);

  // auto clear feedback
  useEffect(() => {
    if (!feedback) return;
    const to = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(to);
  }, [feedback]);

  const handleChange =
    (id: string, key: keyof EditableRow) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canEdit) return;
        const val = key === 'active' ? (e.target as any).checked : e.target.value;
        setRows(prev => prev.map(r => (r.id === id ? { ...r, [key]: val as any, dirty: true } : r)));
      };

  const saveRow = async (row: EditableRow) => {
    if (!canEdit) return;
    setSavingId(row.id);
    try {
      await updateWoodType(row.id, {
        name: row.name,
        description: row.description ?? '',
        active: row.active,
      });
      setRows(prev => prev.map(r => (r.id === row.id ? { ...r, dirty: false } : r)));
      setFeedback({
        type: 'success',
        message: t('woodCategories:feedback.saved', { name: row.name })
      });
    } catch (e: any) {
      setFeedback({
        type: 'error', message: e?.response?.data?.message ?? t('woodCategories:feedback.saveError')
      });
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = (row: EditableRow) => {
    if (!canDelete) return;
    setDeleteTarget(row);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteWoodType(deleteTarget.id);
      setRows(prev => prev.filter(r => r.id !== deleteTarget.id));
      setFeedback({
        type: 'success', message: t('woodCategories:feedback.deleted', { name: deleteTarget.name })
      });
    } catch (e: any) {
      setFeedback({
        type: 'error', message: e?.response?.data?.message ?? t('woodCategories:feedback.deleteError')
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns = useMemo(
    () => [
      { key: 'name', label: t('woodCategories:columns.name') },
      { key: 'description', label: t('woodCategories:columns.description') },
      { key: 'active', label: t('woodCategories:columns.active') },
      { key: 'actions', label: t('woodCategories:columns.actions') },
    ],
    []
  );

  if (loading || !user) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!canView) {
    return <Paper sx={{ p: 3, m: 2 }}><Alert severity="error">{t('common:messages.noPermission')}</Alert></Paper>;
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{t('woodCategories:title')}</Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewOpen(true)}>
            {t('woodCategories:new')}
          </Button>
        )}
      </Box>

      {feedback && <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>
        {feedback.message}
      </Alert>}

      <TableContainer component={Box}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map(c => (
                <TableCell key={c.key} sx={{ fontWeight: 600 }}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ width: 340 }}>
                  <TextField
                    value={r.name ?? ''}
                    onChange={handleChange(r.id, 'name')}
                    fullWidth
                    size="small"
                    disabled={!canEdit}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={r.description ?? ''}
                    onChange={handleChange(r.id, 'description')}
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    disabled={!canEdit}
                  />
                </TableCell>
                <TableCell align="center" sx={{ width: 120 }}>
                  <Checkbox
                    checked={!!r.active}
                    onChange={handleChange(r.id, 'active')}
                    disabled={!canEdit}
                  />
                </TableCell>
                <TableCell align="center" sx={{ width: 140 }}>
                  <Tooltip title={t('woodCategories:tooltips.save')}>
                    <span>
                      <IconButton
                        color="primary"
                        onClick={() => saveRow(r)}
                        disabled={!canEdit || !r.dirty || savingId === r.id}
                        size="small"
                      >
                        {savingId === r.id ? <CircularProgress size={20} /> : <SaveIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  {canDelete && (
                    <Tooltip title={t('woodCategories:tooltips.delete')}>
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => confirmDelete(r)}
                          disabled={savingId === r.id}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* CREATE MODAL */}
      {newOpen && canCreate && (
        <NewWoodTypeModal
          open={newOpen}
          onClose={() => setNewOpen(false)}
          onCreated={async (payload) => {
            const created = await createWoodType(payload);
            setRows(prev => [
              ...prev,
              {
                ...created,
                id: String(created.id),
                description: created.description ?? '',
                dirty: false,
              } as EditableRow,
            ]);

            setFeedback({ type: 'success', message: t('woodCategories:feedback.created') });
            setNewOpen(false);
            return created;
          }}
        />
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <ConfirmationDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title={t('woodCategories:confirmDelete.title')}
          message={t('woodCategories:confirmDelete.message', { name: deleteTarget.name })}
          isConfirming={isDeleting}
          confirmButtonColor="error"
        />
      )}
    </Paper>
  );
}
