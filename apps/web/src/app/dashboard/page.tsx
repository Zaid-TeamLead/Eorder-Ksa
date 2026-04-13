'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { SectionCards, type SectionCardMetric } from '@/components/section-cards';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { queryKeys } from '@/lib/query-keys';
import { getSalespersonDashboard, type SalespersonDashboardRow } from '@/services/enquiry';

const groupedChartConfig = {
  value: {
    label: 'Value',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

function toNumeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function toReadableLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function findColumn(columns: string[], candidates: string[]): string | undefined {
  const normalizedMap = new Map(columns.map((column) => [normalizeKey(column), column]));
  const normalizedCandidates = candidates.map(normalizeKey);

  for (const candidate of normalizedCandidates) {
    const exact = normalizedMap.get(candidate);
    if (exact) return exact;
  }

  return columns.find((column) => {
    const normalizedColumn = normalizeKey(column);
    return normalizedCandidates.some(
      (candidate) =>
        normalizedColumn.includes(candidate) || candidate.includes(normalizedColumn)
    );
  });
}

function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;

    if (/^\d{8}$/.test(raw)) {
      const yyyy = Number(raw.slice(0, 4));
      const mm = Number(raw.slice(4, 6)) - 1;
      const dd = Number(raw.slice(6, 8));
      const date = new Date(yyyy, mm, dd);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const date = new Date(raw.slice(0, 10));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function toMonthKey(value: unknown): string | null {
  const date = parseDateValue(value);
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function toMonthLabel(monthKey: string, includeYear: boolean): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

function renderCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = toNumeric(value);
  return num !== null ? num.toLocaleString('en-US') : String(value);
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const slpCodeFromQuery = searchParams.get('slpCode')?.trim() || undefined;

  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.enquiries.dashboard, slpCodeFromQuery],
    queryFn: () => getSalespersonDashboard(slpCodeFromQuery),
  });

  const rows = data as SalespersonDashboardRow[];

  const columns = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
    return Array.from(keys);
  }, [rows]);

  const quantityColumn = useMemo(
    () => findColumn(columns, ['QUANTITY', 'QTY']),
    [columns]
  );
  const amountWithoutTaxColumn = useMemo(
    () =>
      findColumn(columns, [
        'AMOUNTWITHOUTTAX',
        'AMOUNT_WITHOUT_TAX',
        'NETTOTAL',
        'NETAMOUNT',
        'TOTALBEFORETAX',
      ]),
    [columns]
  );
  const customerColumn = useMemo(
    () =>
      findColumn(columns, [
        'CUSTOMERID',
        'CUSTOMERCODE',
        'CARDCODE',
        'CUSTOMERNAME',
        'CUSTOMER',
      ]),
    [columns]
  );
  const dateColumn = useMemo(
    () =>
      findColumn(columns, [
        'DOCDATE',
        'DOC_DATE',
        'DOCUMENTDATE',
        'CREATEDDATE',
        'CREATED_DATE',
        'DATE',
        'POSTINGDATE',
        'ORDERDATE',
        'INVOICEDATE',
      ]),
    [columns]
  );
  const yyColumn = useMemo(
    () => findColumn(columns, ['YY', 'YEAR', 'YYYY']),
    [columns]
  );
  const mmColumn = useMemo(
    () => findColumn(columns, ['MM', 'MONTH', 'MON']),
    [columns]
  );
  const brandColumn = useMemo(
    () => findColumn(columns, ['BRAND', 'MAKE']),
    [columns]
  );
  const originColumn = useMemo(
    () => findColumn(columns, ['ORIGIN', 'COUNTRY']),
    [columns]
  );
  const regionColumn = useMemo(
    () => findColumn(columns, ['REGION', 'AREA', 'ZONE']),
    [columns]
  );
  const cardCodeColumn = useMemo(
    () => findColumn(columns, ['CARDCODE', 'CUSTOMERCODE', 'CUSTOMERID']),
    [columns]
  );
  const cardNameColumn = useMemo(
    () => findColumn(columns, ['CARDNAME', 'CUSTOMERNAME', 'CUSTOMER']),
    [columns]
  );
  const itemCodeColumn = useMemo(
    () => findColumn(columns, ['ITEMCODE', 'ITEM', 'PRODUCTCODE']),
    [columns]
  );

  const [groupBy, setGroupBy] = useState<string>('brand');
  const [groupMetric, setGroupMetric] = useState<'amount' | 'quantity'>('amount');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all');
  const [detailFilterColumn, setDetailFilterColumn] = useState<string>('all');
  const [detailFilterValue, setDetailFilterValue] = useState<string>('all');

  const getRowMonthKey = (row: SalespersonDashboardRow): string | null => {
    if (dateColumn) {
      return toMonthKey(row[dateColumn]);
    }

    if (yyColumn && mmColumn) {
      const year = toNumeric(row[yyColumn]);
      const month = toNumeric(row[mmColumn]);

      if (
        year !== null &&
        month !== null &&
        Number.isInteger(year) &&
        Number.isInteger(month) &&
        month >= 1 &&
        month <= 12
      ) {
        return `${year}-${String(month).padStart(2, '0')}`;
      }
    }

    return null;
  };

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((row) => {
      const monthKey = getRowMonthKey(row);
      if (monthKey) keys.add(monthKey);
    });

    const sorted = Array.from(keys).sort((a, b) => a.localeCompare(b));
    const includeYear = new Set(sorted.map((item) => item.split('-')[0])).size > 1;

    return sorted.map((monthKey) => ({
      key: monthKey,
      label: toMonthLabel(monthKey, includeYear),
    }));
  }, [rows, dateColumn, yyColumn, mmColumn]);

  const groupOptions = useMemo(
    () =>
      [
        { key: 'brand', label: 'Brand', column: brandColumn },
        { key: 'origin', label: 'Origin', column: originColumn },
        { key: 'region', label: 'Region', column: regionColumn },
        { key: 'cardCode', label: 'Card Code', column: cardCodeColumn },
        { key: 'cardName', label: 'Card Name', column: cardNameColumn },
        { key: 'itemCode', label: 'Item Code', column: itemCodeColumn },
      ].filter((item) => !!item.column),
    [brandColumn, originColumn, regionColumn, cardCodeColumn, cardNameColumn, itemCodeColumn]
  );

  useEffect(() => {
    if (!groupOptions.some((item) => item.key === groupBy)) {
      setGroupBy(groupOptions[0]?.key || '');
    }
  }, [groupBy, groupOptions]);

  useEffect(() => {
    if (selectedMonthKey === 'all') return;
    if (!monthOptions.some((item) => item.key === selectedMonthKey)) {
      setSelectedMonthKey('all');
    }
  }, [selectedMonthKey, monthOptions]);

  const detailFilterColumns = useMemo(
    () =>
      columns
        .map((column) => {
          const values = new Set<string>();

          rows.forEach((row) => {
            const value = row[column];
            if (value !== null && value !== undefined && String(value).trim() !== '') {
              values.add(String(value).trim());
            }
          });

          return {
            key: column,
            label: toReadableLabel(column),
            count: values.size,
          };
        })
        .filter((column) => column.count > 1)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [columns, rows]
  );

  useEffect(() => {
    if (detailFilterColumn === 'all') return;
    if (!detailFilterColumns.some((column) => column.key === detailFilterColumn)) {
      setDetailFilterColumn('all');
    }
  }, [detailFilterColumn, detailFilterColumns]);

  const detailFilterValueOptions = useMemo(() => {
    if (detailFilterColumn === 'all') return [];

    const values = new Set<string>();
    rows.forEach((row) => {
      const value = row[detailFilterColumn];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        values.add(String(value).trim());
      }
    });

    return Array.from(values)
      .sort((a, b) =>
        a.localeCompare(b, 'en-US', { numeric: true, sensitivity: 'base' })
      )
      .map((value) => ({
        key: value,
        label: value,
      }));
  }, [detailFilterColumn, rows]);

  useEffect(() => {
    if (detailFilterColumn === 'all') {
      if (detailFilterValue !== 'all') {
        setDetailFilterValue('all');
      }
      return;
    }

    if (detailFilterValue === 'all') return;
    if (!detailFilterValueOptions.some((item) => item.key === detailFilterValue)) {
      setDetailFilterValue('all');
    }
  }, [detailFilterColumn, detailFilterValue, detailFilterValueOptions]);

  const metrics = useMemo(() => {
    const totalQuantity = rows.reduce((total, row) => {
      const value = quantityColumn ? toNumeric(row[quantityColumn]) : null;
      return total + (value ?? 0);
    }, 0);

    const totalAmountWithoutTax = rows.reduce((total, row) => {
      const value = amountWithoutTaxColumn ? toNumeric(row[amountWithoutTaxColumn]) : null;
      return total + (value ?? 0);
    }, 0);

    const uniqueCustomers = new Set<string>();
    if (customerColumn) {
      rows.forEach((row) => {
        const value = row[customerColumn];
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          uniqueCustomers.add(String(value).trim());
        }
      });
    }

    return {
      totalQuantity,
      totalAmountWithoutTax,
      customerCount: uniqueCustomers.size,
      totalRecords: rows.length,
    };
  }, [rows, quantityColumn, amountWithoutTaxColumn, customerColumn]);

  const monthlyTrend = useMemo(() => {
    if (!dateColumn && !(yyColumn && mmColumn)) return [];

    const monthlyMap = new Map<string, { amountWithoutTax: number; quantity: number }>();

    rows.forEach((row) => {
      const monthKey = getRowMonthKey(row);
      if (!monthKey) return;

      const existing = monthlyMap.get(monthKey) || { amountWithoutTax: 0, quantity: 0 };
      const amount = amountWithoutTaxColumn ? toNumeric(row[amountWithoutTaxColumn]) || 0 : 0;
      const quantity = quantityColumn ? toNumeric(row[quantityColumn]) || 0 : 0;

      existing.amountWithoutTax += amount;
      existing.quantity += quantity;
      monthlyMap.set(monthKey, existing);
    });

    const sorted = Array.from(monthlyMap.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const hasMultiYear = new Set(sorted.map(([monthKey]) => monthKey.split('-')[0])).size > 1;

    return sorted.map(([monthKey, totals]) => ({
      monthLabel: toMonthLabel(monthKey, hasMultiYear),
      amountWithoutTax: totals.amountWithoutTax,
      quantity: totals.quantity,
    }));
  }, [rows, dateColumn, yyColumn, mmColumn, amountWithoutTaxColumn, quantityColumn]);

  const sectionMetrics: SectionCardMetric[] = [
    {
      title: 'Sum Quantity',
      value: metrics.totalQuantity.toLocaleString('en-US'),
      footerTitle: 'Monthly KPI',
      footerDescription: quantityColumn
        ? `From ${toReadableLabel(quantityColumn)}`
        : 'Quantity column not found',
      badgeText: 'Live',
      trend: 'up',
    },
    {
      title: 'Sum Amount Without Tax',
      value: formatCurrency(metrics.totalAmountWithoutTax),
      footerTitle: 'Monthly KPI',
      footerDescription: amountWithoutTaxColumn
        ? `From ${toReadableLabel(amountWithoutTaxColumn)}`
        : 'Amount column not found',
      badgeText: 'Live',
      trend: 'up',
    },
    {
      title: 'Count Customers',
      value: metrics.customerCount.toLocaleString('en-US'),
      footerTitle: 'Distinct Count',
      footerDescription: customerColumn
        ? `From ${toReadableLabel(customerColumn)}`
        : 'Customer column not found',
      badgeText: 'Live',
      trend: 'up',
    },
    {
      title: 'Total Records',
      value: metrics.totalRecords.toLocaleString('en-US'),
      footerTitle: 'Procedure Rows',
      footerDescription: 'Returned by DMS_KSA_100024',
      badgeText: 'Live',
      trend: 'up',
    },
  ];

  useEffect(() => {
    if (groupMetric === 'amount' && !amountWithoutTaxColumn && quantityColumn) {
      setGroupMetric('quantity');
    }
    if (groupMetric === 'quantity' && !quantityColumn && amountWithoutTaxColumn) {
      setGroupMetric('amount');
    }
  }, [groupMetric, amountWithoutTaxColumn, quantityColumn]);

  const activeGroupColumn = useMemo(
    () => groupOptions.find((item) => item.key === groupBy)?.column,
    [groupOptions, groupBy]
  );
  const activeGroupLabel = useMemo(
    () => groupOptions.find((item) => item.key === groupBy)?.label || 'Group',
    [groupOptions, groupBy]
  );
  const selectedMonthLabel = useMemo(
    () =>
      selectedMonthKey === 'all'
        ? 'All months'
        : monthOptions.find((item) => item.key === selectedMonthKey)?.label || 'Month',
    [selectedMonthKey, monthOptions]
  );

  const groupedChartData = useMemo(() => {
    if (!activeGroupColumn) return [];

    const aggregate = new Map<string, number>();

    rows.forEach((row) => {
      const monthKey = getRowMonthKey(row);
      if (selectedMonthKey !== 'all' && monthKey !== selectedMonthKey) {
        return;
      }

      const groupValueRaw = row[activeGroupColumn];
      const groupValue =
        groupValueRaw !== null && groupValueRaw !== undefined && String(groupValueRaw).trim() !== ''
          ? String(groupValueRaw).trim()
          : 'Unknown';

      const metricValue =
        groupMetric === 'amount'
          ? amountWithoutTaxColumn
            ? toNumeric(row[amountWithoutTaxColumn]) || 0
            : 0
          : quantityColumn
            ? toNumeric(row[quantityColumn]) || 0
            : 0;

      aggregate.set(groupValue, (aggregate.get(groupValue) || 0) + metricValue);
    });

    return Array.from(aggregate.entries())
      .map(([group, value]) => ({ group, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 12);
  }, [
    rows,
    activeGroupColumn,
    selectedMonthKey,
    groupMetric,
    amountWithoutTaxColumn,
    quantityColumn,
    dateColumn,
    yyColumn,
    mmColumn,
  ]);

  const filteredDetailRows = useMemo(() => {
    if (detailFilterColumn === 'all' || detailFilterValue === 'all') {
      return rows;
    }

    return rows.filter((row) => {
      const value = row[detailFilterColumn];
      if (value === null || value === undefined) return false;
      return String(value).trim() === detailFilterValue;
    });
  }, [rows, detailFilterColumn, detailFilterValue]);

  const activeDetailFilterLabel = useMemo(
    () =>
      detailFilterColumn === 'all'
        ? 'All data'
        : detailFilterColumns.find((column) => column.key === detailFilterColumn)?.label || 'Filter',
    [detailFilterColumn, detailFilterColumns]
  );

  if (isLoading) {
    return <LoadingState message="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Dashboard"
        message={(error as Error).message || 'Failed to load dashboard data'}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards metrics={sectionMetrics} />

      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={monthlyTrend} />
      </div>

      <div className="px-4 lg:px-6">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle className="text-lg">Grouped Sales Analysis</CardTitle>
            <CardDescription className="text-xs">
              Compare grouped totals with the same dashboard style
            </CardDescription>
            <CardAction>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="h-8 w-[132px] text-xs">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupOptions.map((item) => (
                      <SelectItem key={item.key} value={item.key} className="text-xs">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={groupMetric}
                  onValueChange={(value) => setGroupMetric(value as 'amount' | 'quantity')}
                >
                  <SelectTrigger className="h-8 w-[112px] text-xs">
                    <SelectValue placeholder="Metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount" className="text-xs">
                      Amount
                    </SelectItem>
                    <SelectItem value="quantity" className="text-xs">
                      Quantity
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
                  <SelectTrigger className="h-8 w-[124px] text-xs">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All months
                    </SelectItem>
                    {monthOptions.map((item) => (
                      <SelectItem key={item.key} value={item.key} className="text-xs">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[11px]">
                Group: {activeGroupLabel}
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                Metric: {groupMetric === 'amount' ? 'Amount' : 'Quantity'}
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                Month: {selectedMonthLabel}
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                Top {groupedChartData.length}
              </Badge>
            </div>
            {groupedChartData.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                No grouped data available for the selected filters.
              </div>
            ) : (
              <ChartContainer config={groupedChartConfig} className="h-[340px] w-full">
                <BarChart
                  data={groupedChartData}
                  layout="vertical"
                  margin={{ left: 4, right: 20, top: 6, bottom: 6 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="group"
                    type="category"
                    width={190}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      const text = String(value);
                      return text.length > 26 ? `${text.slice(0, 26)}…` : text;
                    }}
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => String(value)}
                        formatter={(value) => {
                          const numeric = Number(value);
                          return (
                            <span className="font-mono text-xs tabular-nums">
                              {groupMetric === 'amount'
                                ? formatCurrency(numeric)
                                : numeric.toLocaleString('en-US')}
                            </span>
                          );
                        }}
                      />
                    }
                  />
                  <Bar dataKey="value" fill="var(--color-value)" radius={6} barSize={18} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Salesperson Performance Details</CardTitle>
            <CardAction>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={detailFilterColumn} onValueChange={setDetailFilterColumn}>
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue placeholder="Filter column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All columns
                    </SelectItem>
                    {detailFilterColumns.map((column) => (
                      <SelectItem key={column.key} value={column.key} className="text-xs">
                        {column.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={detailFilterValue}
                  onValueChange={setDetailFilterValue}
                  disabled={detailFilterColumn === 'all'}
                >
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <SelectValue placeholder="Filter value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All values
                    </SelectItem>
                    {detailFilterValueOptions.map((item) => (
                      <SelectItem key={item.key} value={item.key} className="text-xs">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardAction>
            {slpCodeFromQuery ? (
              <div className="pt-1">
                <Badge variant="outline" className="text-[11px]">
                  SLPCODE override: {slpCodeFromQuery}
                </Badge>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[11px]">
                Filter: {activeDetailFilterLabel}
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                Value: {detailFilterValue === 'all' ? 'All values' : detailFilterValue}
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                Rows: {filteredDetailRows.length} / {rows.length}
              </Badge>
            </div>
            {rows.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                No dashboard data returned.
              </div>
            ) : filteredDetailRows.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                No dashboard rows match the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border text-xs">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column} className="h-8 text-xs">
                          {toReadableLabel(column)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDetailRows.map((row, rowIndex) => (
                      <TableRow key={`dashboard-row-${rowIndex}`}>
                        {columns.map((column) => (
                          <TableCell key={`${rowIndex}-${column}`} className="py-2 text-xs">
                            {renderCellValue(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
