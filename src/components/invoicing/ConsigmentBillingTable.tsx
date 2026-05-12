// frontend/src/components/invoicing/ConsigmentBillingTable.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Box, Paper, Typography, Stack, IconButton, Chip, Checkbox, alpha, useTheme, Button
} from "@mui/material";
import {
  DataGrid, GridColDef, GridColumnGroupingModel, GridRowId
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "@/i18n/useTranslation";
import type { BillingRow } from "@/services/invoicingService";
import dayjs from "dayjs";

/* -----------------------------------------------------------------------------
 * 🚀 Column Width Constants
 * ---------------------------------------------------------------------------*/
const AMNT_COL_WIDTH = 70;
const PRCE_COL_WIDTH = 85;
const TOTAL_COL_WIDTH = 100;

/* -----------------------------------------------------------------------------
 * Helper utilities
 * ---------------------------------------------------------------------------*/
const num = (v: any) => Number(v ?? 0);
const fix2 = (v: any) => num(v).toFixed(2);
const hasVal = (v: any) => v !== null && v !== undefined && String(v).trim() !== "" && String(v).toLowerCase() !== "null";

const computeRowTotal = (row: any) => {
  const part = (num(row.quantityM3) * num(row.unitPriceM3 || row.unitPrice)) +
    (num(row.km) * num(row.unitPriceKm)) +
    (num(row.pieces) * num(row.unitPricePiece)) +
    (num(row.hours) * num(row.unitPriceHour));
  return part + num(row.roadTax || row.tievero);
};

const getStatus = (row: any): "billed" | "unbilled" | "changed" | "noPrice" => {
  if (row?.billed || hasVal(row?.billedDate)) return "billed";
  if (row?.changed) return "changed";
  const total = num(row.total || computeRowTotal(row));
  return total === 0 ? "noPrice" : "unbilled";
};

const StatusChip: React.FC<{ row: any; t: any }> = ({ row, t }) => {
  const status = getStatus(row);
  const config: any = {
    billed: { color: "success", label: t("consigmentBillingTable:labels.billed") },
    unbilled: { color: "info", label: t("consigmentBillingTable:labels.unbilled") },
    noPrice: { color: "error", label: t("consigmentBillingTable:labels.noPrice") },
    changed: { color: "warning", label: t("consigmentBillingTable:labels.changed") }
  };

  const active = config[status] || config.unbilled;

  return <Chip
    size="small"
    variant="outlined"
    color={active.color}
    icon={active.icon}
    label={active.label}
    sx={{ fontWeight: 600, fontSize: '0.65rem', border: '1px solid' }} />;
};

type Group = {
  key: string;
  dateLabel: string;
  customer: string;
  vehicle: string;
  driver: string;
  rows: BillingRow[];
};

type Props = {
  rows: BillingRow[];
  onEdit: (row: BillingRow) => void;
  onSelectionChange?: (ids: GridRowId[]) => void;
  onRequestDelete?: (dayKey: string, ids: GridRowId[]) => void;
  onRequestAddRow?: (payload: { group: Group; row: BillingRow }) => void; // 🚀 ADDED
  errorTrigger?: number;
};

const ConsigmentBillingTablesByDate: React.FC<Props> = ({
  rows, onEdit, onSelectionChange, onRequestDelete, onRequestAddRow, errorTrigger = 0
}) => {
  const { t } = useTranslation(["consigmentBillingTable", "common"]);
  const theme = useTheme();

  const blinkKeyframes = `@keyframes blink-red { 
    0% { background-color: transparent; } 
    50% { background-color: ${alpha(theme.palette.error.main, 0.25)}; } 
    100% { background-color: transparent; } 
  }`;

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, BillingRow[]>();
    for (const r of rows) {
      const key = `${r.date}__${r.customer}__${r.vehicle}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).map(([key, list]) => {
      const [date, cust, veh] = key.split("__");
      const driver = (list[0] as any).driverName || (list[0] as any).driver || 'N/A';
      return { key, dateLabel: dayjs(date).format('DD.MM.YYYY'), customer: cust, vehicle: veh, driver, rows: list };
    });
  }, [rows]);

  const [selectedGroups, setSelectedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const selectedIds = groups.flatMap(g => selectedGroups[g.key] ? g.rows.map(r => r.id) : []);
    onSelectionChange?.(selectedIds as GridRowId[]);
  }, [selectedGroups, groups, onSelectionChange]);

  // --- 🚀 ADD ROW Logic ---
  const handleAddClick = (g: Group) => {
    const first = g.rows[0];
    const tempRow: any = {
      id: `temp-${g.key}-${Date.now()}`,
      kuormaId: Number((first as any).kuormaId),
      date: (first as any).date,
      customer: g.customer,
      vehicle: g.vehicle,
      driverName: g.driver,
      waybillNumber: "",
      route: "",
      notes: "",
      quantityM3: 0, km: 0, pieces: 0, hours: 0,
      unitPriceM3: 0, unitPriceKm: 0, unitPricePiece: 0, unitPriceHour: 0,
      roadTax: 0, total: 0,
      changed: true,
      billed: false
    };

    if (onRequestAddRow) {
      onRequestAddRow({ group: g, row: tempRow });
    } else {
      onEdit(tempRow); // Fallback to editing if no parent handler
    }
  };

  const handleDeleteGroup = (g: Group) => {
    const ids = g.rows.map(r => r.id);
    onRequestDelete?.(g.key, ids as GridRowId[]);
  };

  const cols: GridColDef[] = [
    { field: "status", headerName: "Status", width: 110, renderCell: (p) => <StatusChip row={p.row} t={t} /> },
    {
      field: "actions", headerName: "Actions", width: 80, sortable: false, renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={() => onEdit(p.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => onRequestDelete?.(p.row.date, [p.row.id])}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
      )
    },
    { field: "date", headerName: "Date", width: 110, valueFormatter: (v: any) => v ? dayjs(v).format('DD.MM.YYYY') : '' },
    { field: "waybillNumber", headerName: "Waybill no.", width: 90 },
    { field: "route", headerName: "Route", flex: 1, minWidth: 150 },
    { field: "notes", headerName: "Notes", width: 150 },

    { field: "quantityM3", headerName: "m³", width: AMNT_COL_WIDTH, align: "right", type: "number", renderCell: (p) => fix2(p.value) },
    { field: "km", headerName: "Km", width: AMNT_COL_WIDTH, align: "right", type: "number", renderCell: (p) => fix2(p.value) },
    { field: "pieces", headerName: "Pcs", width: AMNT_COL_WIDTH, align: "right", type: "number", renderCell: (p) => fix2(p.value) },
    { field: "hours", headerName: "Hours", width: AMNT_COL_WIDTH, align: "right", type: "number", renderCell: (p) => fix2(p.value) },

    {
      field: "unitPriceM3", headerName: "m³ price", width: PRCE_COL_WIDTH, align: "right",
      valueGetter: (v, r) => num(r.unitPriceM3 || r.unitPrice),
      renderCell: (p) => `${fix2(p.value)} €`
    },
    { field: "unitPriceKm", headerName: "Km price", width: PRCE_COL_WIDTH, align: "right", renderCell: (p) => `${fix2(p.value)} €` },
    { field: "unitPricePiece", headerName: "Pcs price", width: PRCE_COL_WIDTH, align: "right", renderCell: (p) => `${fix2(p.value)} €` },
    { field: "unitPriceHour", headerName: "Hour price", width: PRCE_COL_WIDTH, align: "right", renderCell: (p) => `${fix2(p.value)} €` },
    { field: "roadTax", headerName: "Road tax", width: PRCE_COL_WIDTH, align: "right", renderCell: (p) => `${fix2(p.value)} €` },
    { field: "total", headerName: "Total", width: TOTAL_COL_WIDTH, align: "right", renderCell: (p) => <strong style={{ color: '#a38f6d' }}>{fix2(p.row.total || computeRowTotal(p.row))} €</strong> }
  ];

  const columnGroupingModel: GridColumnGroupingModel = [
    { groupId: "Amount", headerName: "Amount", headerAlign: "center", children: [{ field: "quantityM3" }, { field: "km" }, { field: "pieces" }, { field: "hours" }] },
    { groupId: "Price", headerName: "Price", headerAlign: "center", children: [{ field: "unitPriceM3" }, { field: "unitPriceKm" }, { field: "unitPricePiece" }, { field: "unitPriceHour" }, { field: "roadTax" }, { field: "total" }] }
  ];

  return (
    <Stack spacing={3}>
      <style>{blinkKeyframes}</style>
      {groups.map((g) => {
        const isGroupSelected = !!selectedGroups[g.key];
        return (
          <Paper key={g.key} variant="outlined" sx={{ p: 0, overflow: 'hidden', borderRadius: 1, bgcolor: 'background.paper' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.2, bgcolor: alpha(theme.palette.text.primary, 0.03), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Checkbox
                  size="small"
                  checked={isGroupSelected}
                  onChange={(e) => setSelectedGroups(prev => ({ ...prev, [g.key]: e.target.checked }))}
                  sx={{ color: '#a38f6d', '&.Mui-checked': { color: '#a38f6d' }, p: 0.5 }}
                />
                <Stack spacing={0.1}>
                  <Typography variant="subtitle2" fontWeight="bold">{g.dateLabel}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Customer: <strong>{g.customer}</strong> | Vehicle: <strong>{g.vehicle}</strong> | Driver: <strong>{g.driver}</strong>
                  </Typography>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  size="small" variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddClick(g)} // 🚀 Trigger Add Logic
                  sx={{ bgcolor: '#a38f6d', color: 'white', height: 26, fontSize: '0.65rem', fontWeight: 'bold' }}>
                  ADD
                </Button>
                <Button
                  size="small" variant="outlined"
                  startIcon={<DeleteIcon />}
                  color="error" disabled={!isGroupSelected}
                  onClick={() => handleDeleteGroup(g)} // 🚀 Trigger Delete Logic
                  sx={{ height: 26, fontSize: '0.65rem', fontWeight: 'bold' }}>
                  DELETE
                </Button>
              </Stack>
            </Stack>

            <Box sx={{ width: "100%" }}>
              <DataGrid rows={g.rows} columns={cols} columnGroupingModel={columnGroupingModel} density="compact" autoHeight hideFooter getRowId={(r) => r.id}
                getRowClassName={(params) => {
                  const total = num(params.row.total || computeRowTotal(params.row));
                  const isInvalid = total === 0 && !params.row.billed;
                  return (isGroupSelected && isInvalid && errorTrigger > 0) ? 'blink-error-row' : '';
                }}
                sx={{
                  border: 'none',
                  '& .blink-error-row': { animation: `blink-red 0.8s ease-in-out 3`, border: `1px solid ${theme.palette.error.main} !important` },
                  '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold', fontSize: '0.7rem' }
                }}
              />
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default ConsigmentBillingTablesByDate;