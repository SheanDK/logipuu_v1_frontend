'use client';

import React, { useMemo } from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowId,
  GridToolbar,
} from '@mui/x-data-grid';
import { Chip, Tooltip, IconButton } from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import EditIcon from '@mui/icons-material/Edit';

import { useTranslation } from '@/i18n/useTranslation';
import type { BillingRow } from '@/services/invoicingService';

type Props = {
  rows: BillingRow[];
  onEdit: (row: BillingRow) => void;
  onSelectionChange: (ids: GridRowId[]) => void;
};

/** Compact ellipsis cell renderer to prevent layout shifts on long text */
const Ellipsis: React.FC<{ value?: string | null }> = ({ value }) => (
  <span
    style={{
      display: 'inline-block',
      width: '100%',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    }}
  >
    {value ?? ''}
  </span>
);

/** Safe date formatter -> "DD.MM.YYYY" (handles 'YYYY-MM-DD' and ISO datetimes) */
const fmtDate = (v: unknown): string => {
  if (v == null) return '';
  const s = String(v);
  const iso = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fi-FI');
};

type RowStatus = 'billed' | 'unbilled' | 'changed' | 'noPrice';

/** Determine the row status from billing flags and numeric values */
const getStatus = (row: any): RowStatus => {
  const hasValue = (v: any) =>
    v !== null && v !== undefined && String(v).trim() !== '' && String(v).toLowerCase() !== 'null';

  // Accept several possible field names from API/DB mappers
  const billedDate =
    row?.billedDate ??
    row?.pvmLaskutus ??
    row?.pvm_laskutus ??
    row?.laskutusPvm;

  if (row?.billed === true || hasValue(billedDate)) return 'billed';

  // Mark as “changed” when the edit dialog has toggled this flag
  if (row?.changed === true) return 'changed';

  // Mark as “noPrice” when all unit prices and total are zero
  const toNum = (x: unknown) => (x == null ? 0 : Number(x));
  const unitPricesZero =
    toNum(row?.unitPriceM3 ?? row?.unitPrice) === 0 &&
    toNum(row?.unitPriceKm ?? row?.kmUnitPrice) === 0 &&
    toNum(row?.unitPriceHour ?? row?.hoursUnitPrice) === 0 &&
    toNum(row?.unitPricePiece ?? row?.piecesUnitPrice) === 0;
  const sumZero = toNum(row?.total ?? row?.sum) === 0;
  if (unitPricesZero && sumZero) return 'noPrice';

  return 'unbilled';
};

/** Visual chip representing the computed status */
const StatusChip: React.FC<{ status: RowStatus; t: any }> = ({ status, t }) => {
  switch (status) {
    case 'billed':
      return (
        <Chip size="small" variant="outlined" color="success" icon={<CheckCircleIcon />} label={t('woodBillingTable:labels.billed')} />
      );
    case 'unbilled':
      return (
        <Chip size="small" variant="outlined" color="info" icon={<HourglassEmptyIcon />} label={t('woodBillingTable:labels.unbilled')} />
      );
    case 'changed':
      return (
        <Chip size="small" variant="outlined" color="warning" icon={<EditIcon />} label={t('woodBillingTable:labels.changed')} />
      );
    case 'noPrice':
      return (
        <Chip size="small" variant="outlined" color="error" icon={<MoneyOffIcon />} label={t('woodBillingTable:labels.noPrice')} />
      );
    default:
      return <Chip size="small" variant="outlined" label={String(status)} />;
  }
};

const WoodBillingTable: React.FC<Props> = ({ rows, onEdit, onSelectionChange }) => {
  const { t } = useTranslation(['woodBillingTable', 'common']);

  const columns: GridColDef[] = useMemo(
    () => [
      // 1) STATUS
      {
        field: 'billed',
        headerName: t('woodBillingTable:columns.status'),
        width: 160,
        sortable: true,
        filterable: true,
        renderCell: (p: any) => <StatusChip status={getStatus(p?.row)} t={t} />,
      },
      // 2) ACTIONS
      {
        field: 'actions',
        headerName: t('woodBillingTable:columns.actions'),
        sortable: false,
        filterable: false,
        width: 110,
        renderCell: (p: any) => (
          <Tooltip title={t('common:buttons.edit')}>
            <IconButton
              size="small"
              aria-label={t('common:buttons.edit')}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(p.row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
      // 3) DATE
      {
        field: 'date',
        headerName: t('woodBillingTable:columns.date'),
        width: 130,
        renderCell: (p: any) => <span>{fmtDate(p?.row?.date ?? p?.value ?? '')}</span>,
      },
      // 4) CUSTOMER
      {
        field: 'customer',
        headerName: t('woodBillingTable:columns.customer'),
        flex: 1,
        minWidth: 160,
        renderCell: (p: any) => <Ellipsis value={p?.row?.customer} />,
      },
      // 5) TIMBER STACKS (puulaani)
      {
        field: 'puulaaniName',
        headerName: t('woodBillingTable:columns.timberStacks') || 'Puulaani',
        flex: 1,
        minWidth: 160,
        renderCell: (p: any) => <Ellipsis value={p?.row?.puulaaniName} />,
      },
      // 6) WAYBILL NUMBER (ajomääräysnro)
      {
        field: 'waybillNumber',
        headerName: t('woodBillingTable:columns.waybillNumber') || 'AjomääräysNro',
        width: 140,
        renderCell: (p: any) => <Ellipsis value={p?.row?.waybillNumber} />,
      },
      // 7) WOOD TYPE
      {
        field: 'woodType',
        headerName: t('woodBillingTable:columns.woodType'),
        flex: 1,
        minWidth: 160,
        renderCell: (p: any) => <Ellipsis value={p?.row?.woodType} />,
      },
      // 8) RECEIPT NUMBER (vastaanotto nro)
      {
        field: 'vastaanottoNro',
        headerName: t('woodBillingTable:columns.vastaanottoNro') || 'VastaanottoNro',
        width: 140,
        renderCell: (p: any) => <Ellipsis value={p?.row?.vastaanottoNro} />,
      },
      // 9) VEHICLE
      {
        field: 'vehicle',
        headerName: t('woodBillingTable:columns.vehicle'),
        width: 120,
        renderCell: (p: any) => <Ellipsis value={p?.row?.vehicle} />,
      },
      // 10) DRIVER NAME
      {
        field: 'driverName',
        headerName: t('woodBillingTable:columns.driverName') || 'Kuljettaja',
        flex: 1,
        minWidth: 160,
        renderCell: (p: any) => <Ellipsis value={p?.row?.driverName} />,
      },
      // 11) ROUTE
      {
        field: 'route',
        headerName: t('woodBillingTable:columns.route') || 'Ajoreitti',
        flex: 1,
        minWidth: 180,
        renderCell: (p: any) => <Ellipsis value={p?.row?.route} />,
      },
      // 12) NOTES
      {
        field: 'notes',
        headerName: t('woodBillingTable:columns.notes') || 'Lisätiedot',
        flex: 1.2,
        minWidth: 220,
        renderCell: (p: any) => <Ellipsis value={p?.row?.notes} />,
      },
    ],
    [t, onEdit]
  );

  if (!rows?.length) return null;

  return (
    <div style={{ height: '100%', width: '100%', minHeight: 0 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        density="compact"
        checkboxSelection
        disableRowSelectionOnClick
        getRowId={(r) => r.id}
        slots={{ toolbar: GridToolbar }}
        slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
        onRowSelectionModelChange={(model) => {
          const ids = Array.isArray(model) ? model : Array.from((model as any)?.ids ?? []);
          onSelectionChange(ids as GridRowId[]);
        }}
      />
    </div>
  );
};

export default WoodBillingTable;
