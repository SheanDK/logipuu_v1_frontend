//frontend/src/components/invoicing/ConsigmentBillingTable.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Stack,
  Tooltip,
  IconButton,
  Chip,
  Checkbox,
} from "@mui/material";
import {
  DataGrid,
  GridRowId,
  GridColDef,
  GridToolbar,
  GridRenderCellParams,
  GridColumnGroupingModel,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import { useTranslation } from "@/i18n/useTranslation";
import type { BillingRow } from "@/services/invoicingService";

/* -----------------------------------------------------------------------------
 * Helper utilities
 * ---------------------------------------------------------------------------*/

/** Normalize any input into a YYYY-MM-DD key. */
const toKey = (v: unknown): string => {
  if (!v) return "";
  const s = String(v);
  const iso = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : new Date(s).toISOString().slice(0, 10);
};

/** Format an ISO date (YYYY-MM-DD) into DD.MM.YYYY (Finnish-style). */
const fmtDate = (iso: string) => {
  const [y, m, d] = (iso || "").split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
};

const num = (v: any) => Number(v ?? 0);
const fix2 = (v: any) => num(v).toFixed(2);
/** Value is considered set when not null/undefined/empty/"null". */
const hasVal = (v: any) =>
  v !== null && v !== undefined && String(v).trim() !== "" && String(v).toLowerCase() !== "null";

/**
 * Derive row billing status from its data.
 * Priority: billed > changed > noPrice > unbilled
 */
const getStatus = (row: any): "billed" | "unbilled" | "changed" | "noPrice" => {
  const billed = row?.billed === true || hasVal(row?.billedDate);
  if (billed) return "billed";
  if (row?.changed) return "changed";
  const zero = (x: any) => Number(x || 0) === 0;
  if (
    zero(row?.unitPriceM3 ?? row?.unitPrice) &&
    zero(row?.unitPriceKm) &&
    zero(row?.unitPriceHour) &&
    zero(row?.unitPricePiece) &&
    zero(row?.total)
  )
    return "noPrice";
  return "unbilled";
};

const sanitize = (v: unknown) => String(v ?? "").trim();

/** Build a stable grouping key: date__customer__vehicle. */
const makeGroupKey = (date: unknown, customer: unknown, vehicle: unknown) => {
  const d = toKey(date);
  const c = sanitize(customer);
  const v = sanitize(vehicle);
  return `${d}__${c}__${v}`;
};

/** Split a previously generated group key back into components. */
const splitGroupKey = (key: string): [string, string, string] => {
  const [d = "", c = "", v = ""] = key.split("__");
  return [d, c, v];
};

/** Small UI helper to render a colored status chip. */
const StatusChip: React.FC<{ status: ReturnType<typeof getStatus>; t: any }> = ({ status, t }) => {
  switch (status) {
    case "billed":
      return (
        <Chip
          size="small"
          variant="outlined"
          color="success"
          icon={<CheckCircleIcon />}
          label={t("consigmentBillingTable:labels.billed")}
        />
      );
    case "unbilled":
      return (
        <Chip
          size="small"
          variant="outlined"
          color="info"
          icon={<HourglassEmptyIcon />}
          label={t("consigmentBillingTable:labels.unbilled")}
        />
      );
    case "changed":
      return (
        <Chip
          size="small"
          variant="outlined"
          color="warning"
          icon={<EditIcon />}
          label={t("consigmentBillingTable:labels.changed")}
        />
      );
    case "noPrice":
      return (
        <Chip
          size="small"
          variant="outlined"
          color="error"
          icon={<MoneyOffIcon />}
          label={t("consigmentBillingTable:labels.noPrice")}
        />
      );
    default:
      return <Chip size="small" variant="outlined" label={String(status)} />;
  }
};

/* -----------------------------------------------------------------------------
 * Component types
 * ---------------------------------------------------------------------------*/

type Props = {
  rows: BillingRow[];
  onEdit: (row: BillingRow) => void;
  onRowsChange?: (next: BillingRow[]) => void;
  onSelectionChange?: (ids: GridRowId[]) => void;
  onRequestDelete?: (dayKey: string, ids: GridRowId[]) => void;
  onRequestAddRow?: (payload: { group: Group; row: BillingRow }) => void;
};

type Group = {
  key: string;
  dateKey: string;
  dateLabel: string;
  customer: string;
  vehicle: string;
  driver: string;
  rows: BillingRow[];
};

/** Compute row total from all unit prices & quantities plus road/toll tax. */
const computeRowTotal = (row: Partial<BillingRow> & Record<string, any>) => {
  const qM3 = num(row.quantityM3);
  const km = num(row.km);
  const pcs = num(row.pieces);
  const hrs = num(row.hours);

  // Support legacy/fallback fields
  const pM3 = num(row.unitPriceM3 ?? row.unitPrice);
  const pKm = num(row.unitPriceKm);
  const pPc = num(row.unitPricePiece);
  const pHr = num(row.unitPriceHour);

  // Support multiple tax field names
  const roadTax = num(row.roadTax ?? row.tollTax ?? row.tievero);

  const part = qM3 * pM3 + km * pKm + pcs * pPc + hrs * pHr;
  return part + roadTax;
};

/* -----------------------------------------------------------------------------
 * ConsigmentBillingTablesByDate
 * Renders one DataGrid per (date, customer, vehicle) group with toolbar/actions.
 * ---------------------------------------------------------------------------*/

const ConsigmentBillingTablesByDate: React.FC<Props> = ({
  rows,
  onEdit,
  onRowsChange,
  onSelectionChange,
  onRequestDelete,
  onRequestAddRow,
}) => {
  const { t } = useTranslation(["consigmentBillingTable", "common"]);

  /**
   * Group rows by (date, customer, vehicle).
   * Sort order: date asc -> customer asc -> vehicle asc.
   */
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, BillingRow[]>();

    for (const r of rows ?? []) {
      const key = makeGroupKey((r as any).date, (r as any).customer, (r as any).vehicle);
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }

    // Sort: date -> customer -> vehicle
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const [da, ca, va] = splitGroupKey(a);
        const [db, cb, vb] = splitGroupKey(b);
        const dCmp = da.localeCompare(db);
        if (dCmp !== 0) return dCmp;
        const cCmp = ca.localeCompare(cb);
        return cCmp !== 0 ? cCmp : va.localeCompare(vb);
      })
      .map(([key, list]) => {
        const [dateKey, customer, vehicle] = splitGroupKey(key);
        const driverSource = list.find(
          (item) => hasVal((item as any)?.driverName) || hasVal((item as any)?.driver)
        );
        const driverName = sanitize(
          ((driverSource as any)?.driverName ?? (driverSource as any)?.driver) ?? ""
        );
        return { key, dateKey, dateLabel: fmtDate(dateKey), customer, vehicle, driver: driverName, rows: list };
      });
  }, [rows]);

  /** Checkbox selection state per group (top-left checkbox per grid). */
  const [selectionByDay, setSelectionByDay] = useState<Record<string, GridRowId[]>>({});
  /** Whether an entire group (all rows in that grid) is selected. */
  const [selectedGroups, setSelectedGroups] = useState<Record<string, boolean>>({});

  /** Toggle the “select whole group” header checkbox. */
  const toggleGroup = (g: Group) => (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setSelectedGroups((prev) => ({ ...prev, [g.key]: checked }));
  };

  /**
   * Whenever group checkboxes change, emit a flat list of selected IDs upstream.
   * This keeps parent selection state in sync with grouped UI.
   */
  useEffect(() => {
    const selectedIds = groups.flatMap((g) =>
      selectedGroups[g.key] ? g.rows.map((r) => (r as any).id) : []
    ) as GridRowId[];
    onSelectionChange?.(selectedIds);
  }, [selectedGroups, groups, onSelectionChange]);

  /** Track row selection model for a given day/group (not used by header chip). */
  const handleSelection = (dayKey: string, model: unknown) => {
    const ids: GridRowId[] = Array.isArray(model)
      ? (model as GridRowId[])
      : Array.from((model as any)?.ids ?? []);
    setSelectionByDay((prev) => ({ ...prev, [dayKey]: ids }));
  };

  // ---------------------------------------------------------------------------
  // Columns & column groups (localized "Amount" and "Price" sections)
  // Note: Column grouping requires Pro/Premium; if not present, DataGrid ignores it.
  // ---------------------------------------------------------------------------

  /** Column that renders a header checkbox to select the entire group/grid. */
  const groupSelectCol = (g: Group): GridColDef<BillingRow> => ({
    field: "__groupSel__",
    headerName: "",
    width: 56,
    minWidth: 56,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    headerAlign: "center",
    align: "center",
    renderHeader: () => (
      <Checkbox
        size="small"
        checked={!!selectedGroups[g.key]}
        onChange={toggleGroup(g)}
        inputProps={{ "aria-label": t("consigmentBillingTable:labels.selectGroup") }}
      />
    ),
    renderCell: () => null, // no per-row checkbox in this column
  });

  /** Base column set shared by every group grid. */
  const colsBase: GridColDef<BillingRow>[] = useMemo(
    () => [
      {
        field: "billed",
        headerName: t("consigmentBillingTable:columns.status"),
        width: 160,
        sortable: true,
        filterable: true,
        renderCell: (p: GridRenderCellParams<any, BillingRow>) => (
          <StatusChip status={getStatus(p.row)} t={t} />
        ),
      },
      {
        field: "actions",
        headerName: t("consigmentBillingTable:columns.actions"),
        sortable: false,
        filterable: false,
        width: 130,
        renderCell: (p) => {
          const rk = p.row as any;
          return (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title={t("common:buttons.edit")}>
                <IconButton
                  size="small"
                  aria-label={t("common:buttons.edit")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(p.row);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("common:buttons.delete")}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    const gkey = makeGroupKey(rk.date, rk.customer, rk.vehicle);
                    onRequestDelete?.(gkey, [rk.id]);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
      {
        field: "date",
        headerName: t("consigmentBillingTable:columns.date"),
        width: 130,
        renderCell: (p) => <span>{fmtDate((p.row as any)?.date ?? "")}</span>,
      },
      {
        field: "waybillNumber",
        headerName: t("consigmentBillingTable:columns.waybillNumber"),
        width: 150,
        renderCell: (p) => <Ellipsis value={(p.row as any)?.waybillNumber} />,
      },
      {
        field: "route",
        headerName: t("consigmentBillingTable:columns.route"),
        flex: 1.2,
        minWidth: 220,
        renderCell: (p) => <Ellipsis value={(p.row as any)?.route} />,
      },
      {
        field: "notes",
        headerName: t("consigmentBillingTable:columns.notes"),
        flex: 1.2,
        minWidth: 220,
        renderCell: (p) => <Ellipsis value={(p.row as any)?.notes} />,
      },
      // --- Amount ---
      {
        field: "quantityM3",
        headerName: t("consigmentBillingTable:columns.quantityM3"),
        width: 94,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (p) => <span>{fix2((p.row as any).quantityM3)}</span>,
      },
      {
        field: "km",
        headerName: t("consigmentBillingTable:columns.km"),
        width: 94,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (p) => <span>{fix2((p.row as any).km)}</span>,
      },
      {
        field: "pieces",
        headerName: t("consigmentBillingTable:columns.pieces"),
        width: 94,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (p) => <span>{fix2((p.row as any).pieces)}</span>,
      },
      {
        field: "hours",
        headerName: t("consigmentBillingTable:columns.hours"),
        width: 110,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (p) => <span>{fix2((p.row as any).hours)}</span>,
      },
      // --- Unit prices ---
      {
        field: "unitPriceM3",
        headerName: t("consigmentBillingTable:columns.unitPriceM3"),
        width: 94,
        type: "number",
        align: "right",
        headerAlign: "right",
        valueGetter: (_v, r) => num((r as any).unitPriceM3 ?? (r as any).unitPrice),
        renderCell: (p) => <span>{fix2(num(p.value))}</span>,
      },
      {
        field: "unitPriceKm",
        headerName: t("consigmentBillingTable:columns.unitPriceKm"),
        width: 94,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (p) => <span>{fix2((p.row as any).unitPriceKm)}</span>,
      },
      {
        field: "unitPricePiece",
        headerName: t("consigmentBillingTable:columns.unitPricePiece"),
        width: 94,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (p) => <span>{fix2((p.row as any).unitPricePiece)}</span>,
      },
      {
        field: "unitPriceHour",
        headerName: t("consigmentBillingTable:columns.unitPriceHour"),
        width: 110,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (p) => <span>{fix2((p.row as any).unitPriceHour)}</span>,
      },
      // --- Taxes & totals ---
      {
        field: "roadTax",
        headerName: t("consigmentBillingTable:columns.roadTax"),
        width: 110,
        type: "number",
        align: "right",
        headerAlign: "right",
        valueGetter: (_v, r) =>
          num((r as any).roadTax ?? (r as any).tollTax ?? (r as any).tievero),
        renderCell: (p) => <span>{fix2(num(p.value))}</span>,
      },
      {
        field: "total",
        headerName: t("consigmentBillingTable:columns.total"),
        width: 130,
        type: "number",
        align: "right",
        headerAlign: "right",
        valueGetter: (_v, r) => num((r as any).total || computeRowTotal(r as any)),
        renderCell: (p) => <strong>{fix2(num(p.value))}</strong>,
      },
    ],
    [t, onEdit, onRowsChange, rows]
  );

  /** Column grouping model to visually cluster Amount and Price sections. */
  const columnGroupingModel: GridColumnGroupingModel = [
    {
      groupId: "Amount",
      headerName: t("consigmentBillingTable:groups.amount"),
      headerClassName: "groupCenter",
      children: [{ field: "quantityM3" }, { field: "km" }, { field: "pieces" }, { field: "hours" }],
    },
    {
      groupId: "Price",
      headerName: t("consigmentBillingTable:groups.price"),
      headerClassName: "groupCenter",
      children: [{ field: "unitPriceM3" }, { field: "unitPriceKm" }, { field: "unitPricePiece" }, { field: "unitPriceHour" }],
    },
  ];

  /**
   * Add a new temporary row to the given group.
   * Pre-fills context (date, customer, vehicle) from the group.
   */
  const handleAddRow = (day: Group) => {
    const base = day.rows[0];
    const temp: BillingRow = {
      id: `temp-${day.key}-${Date.now()}`,
      kuormaId: Number((base as any)?.kuormaId ?? NaN),
      date: day.dateKey,
      customer: day.customer,
      vehicle: day.vehicle,
      driverName: (base as any)?.driverName ?? "",
      waybillNumber: "",
      route: "",
      notes: "",
      woodType: (base as any)?.woodType ?? "",
      quantityM3: 0,
      km: 0,
      pieces: 0,
      hours: 0,
      unitPriceM3: 0,
      unitPriceKm: 0,
      unitPriceHour: 0,
      unitPricePiece: 0,
      unitPrice: 0,
      roadTax: 0,
      sum: 0,
      total: 0,
      billed: false,
      // Mark as changed so status chip reflects it's an unsaved/draft edit
      // @ts-ignore
      changed: true,
    } as BillingRow;

    if (onRequestAddRow) {
      onRequestAddRow({ group: day, row: temp });
      return;
    }

    const next = [...rows, temp];
    onRowsChange?.(next);
    onEdit(temp);
  };

  /**
   * Delete all rows currently visible in a selected group.
   * Relies on the “select whole group” checkbox being enabled.
   */
  const handleDeleteSelected = (day: Group) => {
    if (!selectedGroups[day.key]) return;
    const ids = day.rows.map((r) => (r as any).id);
    onRequestDelete?.(day.key, ids);
  };

  if (!rows?.length) return null;

  return (
    <Stack spacing={3}>
      {groups.map((g) => {
        const first = g.rows[0];

        return (
          <Paper key={g.key} variant="outlined" sx={{ p: 2 }}>
            {/* Group header: date + context summary + actions */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  {g.dateLabel}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {t("consigmentBillingTable:columns.customer")}: <strong>{g.customer || "-"}</strong>
                  &nbsp; | &nbsp;
                  {t("consigmentBillingTable:columns.vehicle")}: <strong>{g.vehicle || "-"}</strong>
                  &nbsp; | &nbsp;
                  {t("consigmentBillingTable:columns.driver")}: <strong>{g.driver || "-"}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleAddRow(g)}>
                  {t("common:buttons.add") || "Add row"}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteSelected(g)}
                  disabled={!selectedGroups[g.key]}
                >
                  {t("common:buttons.delete") || "Delete selected"}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 1 }} />

            {/* One DataGrid per group */}
            <div style={{ width: "100%" }}>
              <DataGrid<BillingRow>
                rows={g.rows}
                columns={[groupSelectCol(g), ...colsBase]}
                density="compact"
                disableRowSelectionOnClick
                getRowId={(r) => (r as any).id}
                slots={{ toolbar: GridToolbar }}
                slotProps={{
                  toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } },
                }}
                autoHeight
                columnGroupingModel={columnGroupingModel}
                // Optional: keep if you later add per-row selection
                onRowSelectionModelChange={(m) => handleSelection(g.key, m)}
                sx={{
                  // Hide the built-in header checkbox (we use a custom group one)
                  "& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-checkboxInput": { display: "none" },

                  // Center group headers visually (when column grouping is available)
                  "& .groupCenter": { paddingLeft: 0, paddingRight: 0 },
                  "& .groupCenter .MuiDataGrid-columnHeaderDraggableContainer": {
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    flex: 1,
                  },
                  "& .groupCenter .MuiDataGrid-columnHeaderTitleContainer, \
       & .groupCenter .MuiDataGrid-columnHeaderTitleContainerContent": {
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    marginLeft: "auto",
                    marginRight: "auto",
                    padding: 0,
                  },
                  "& .groupCenter .MuiDataGrid-columnHeaderTitle": {
                    width: "100%",
                    textAlign: "center",
                    fontWeight: 600,
                  },
                  "& .groupCenter .MuiDataGrid-menuIcon, \
       & .groupCenter .MuiDataGrid-iconSeparator, \
       & .groupCenter .MuiDataGrid-columnHeaderTitleContainer .MuiDataGrid-iconButtonContainer": {
                    display: "none",
                  },
                }}
              />
            </div>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default ConsigmentBillingTablesByDate;

/* -----------------------------------------------------------------------------
 * Small helper: show truncated text with ellipsis inside grid cells
 * ---------------------------------------------------------------------------*/
const Ellipsis: React.FC<{ value?: string | null }> = ({ value }) => (
  <span
    style={{
      display: "inline-block",
      width: "100%",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    }}
  >
    {value ?? ""}
  </span>
);
