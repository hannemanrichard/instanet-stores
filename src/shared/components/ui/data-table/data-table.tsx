"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/shared/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";

interface BulkAction<T> {
  label: string;
  action: (items: T[]) => void;
}

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onCreateClick?: () => void;
  createButtonLabel?: string;
  onRowsSelect?: (rows: T[]) => void;
  bulkActions?: BulkAction<T>[];
  isSelectable?: boolean;
  // Pagination props
  totalItems?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  searchQuery: externalSearchQuery,
  onSearchChange,
  onCreateClick,
  createButtonLabel,
  onRowsSelect,
  bulkActions,
  isSelectable = false,
  // Pagination props
  totalItems = 0,
  currentPage = 1,
  pageSize = 25,
  onPageChange,
}: DataTableProps<T>) {
  const t = useTranslations("dashboard.dataTable");
  const [sorting, setSorting] = React.useState<{
    key: string;
    asc: boolean;
  } | null>(null);
  const [internalSearchQuery, setInternalSearchQuery] = React.useState("");

  // Use external search query if provided, otherwise use internal state
  const searchQuery =
    externalSearchQuery !== undefined
      ? externalSearchQuery
      : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;
  // Use external pagination props if provided, otherwise use internal state
  const [internalPageIndex, setInternalPageIndex] = React.useState(0);
  const internalPageSize = 25;

  const pageIndex = onPageChange ? currentPage - 1 : internalPageIndex;
  const effectivePageSize = pageSize || internalPageSize;
  const [selectedRows, setSelectedRows] = React.useState<
    Record<number, boolean>
  >({});

  const filteredData = React.useMemo(() => {
    let processed = [...data];

    // Only apply internal search filtering if no external search is provided
    if (searchKey && searchQuery && externalSearchQuery === undefined) {
      processed = processed.filter((item) =>
        String(item[searchKey])
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    if (sorting) {
      processed.sort((a, b) => {
        const modifier = sorting.asc ? 1 : -1;
        return a[sorting.key] > b[sorting.key] ? modifier : -modifier;
      });
    }

    return processed;
  }, [data, searchKey, searchQuery, sorting, externalSearchQuery]);

  // Use external totalItems if provided, otherwise calculate from filtered data
  const totalCount = onPageChange ? totalItems : filteredData.length;
  const pageCount = Math.ceil(totalCount / effectivePageSize);

  // Only slice data if using internal pagination
  const paginatedData = onPageChange
    ? filteredData
    : filteredData.slice(
        pageIndex * effectivePageSize,
        (pageIndex + 1) * effectivePageSize
      );

  const handleSelectAll = React.useCallback(
    (checked: boolean) => {
      const newSelected = {} as Record<number, boolean>;
      paginatedData.forEach((_, index) => {
        newSelected[index] = checked;
      });
      setSelectedRows(newSelected);

      if (onRowsSelect) {
        onRowsSelect(checked ? paginatedData : []);
      }
    },
    [paginatedData, onRowsSelect]
  );

  const handleSelectRow = React.useCallback(
    (index: number, checked: boolean) => {
      setSelectedRows((prev) => ({ ...prev, [index]: checked }));

      if (onRowsSelect) {
        const selectedItems = paginatedData.filter((_, idx) =>
          idx === index ? checked : selectedRows[idx]
        );
        onRowsSelect(selectedItems);
      }
    },
    [paginatedData, selectedRows, onRowsSelect]
  );

  const selectedItems = React.useMemo(
    () => paginatedData.filter((_, idx) => selectedRows[idx]),
    [paginatedData, selectedRows]
  );

  const hasSelectedItems = selectedItems.length > 0;
  const showToolbar =
    Boolean(searchKey) ||
    Boolean(onCreateClick) ||
    (hasSelectedItems && Boolean(bulkActions?.length));

  return (
    <div className="w-full space-y-4">
      {showToolbar ? (
        <div className="flex items-center justify-between gap-2 px-4 pt-4 sm:px-6">
          <div className="flex flex-1 items-center space-x-2">
            {searchKey ? (
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            ) : null}
            {hasSelectedItems && bulkActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {t("bulkActions")} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>
                    {t("itemsSelected", { count: selectedItems.length })}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {bulkActions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => action.action(selectedItems)}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          {onCreateClick ? (
            <Button onClick={onCreateClick}>
              {createButtonLabel ?? t("create")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              {isSelectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      Object.values(selectedRows).every(Boolean) &&
                      paginatedData.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setSorting((prev) =>
                          prev?.key === column.key
                            ? { key: column.key, asc: !prev.asc }
                            : { key: column.key, asc: true }
                        )
                      }
                    >
                      {column.label}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (isSelectable ? 1 : 0)}
                  className="h-24 text-center"
                >
                  {t("noResults")}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, i) => (
                <TableRow key={i}>
                  {isSelectable && (
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedRows[i] || false}
                        onCheckedChange={(checked) =>
                          handleSelectRow(i, checked as boolean)
                        }
                        aria-label={`Select row ${i}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <p className="text-xs font-medium tabular-nums text-muted-foreground">
          {t("page", {
            current: pageCount === 0 ? 0 : pageIndex + 1,
            total: pageCount,
          })}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden size-8 rounded-lg border-border text-muted-foreground hover:text-foreground lg:inline-flex"
            onClick={() => {
              if (onPageChange) {
                onPageChange(1);
              } else {
                setInternalPageIndex(0);
              }
            }}
            disabled={pageIndex <= 0 || pageCount === 0}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="size-3.5 rtl:rotate-180" strokeWidth={1.75} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-border text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (onPageChange) {
                onPageChange(currentPage - 1);
              } else {
                setInternalPageIndex(pageIndex - 1);
              }
            }}
            disabled={pageIndex <= 0 || pageCount === 0}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="size-3.5 rtl:rotate-180" strokeWidth={1.75} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-border text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (onPageChange) {
                onPageChange(currentPage + 1);
              } else {
                setInternalPageIndex(pageIndex + 1);
              }
            }}
            disabled={pageIndex >= pageCount - 1 || pageCount === 0}
            aria-label="Go to next page"
          >
            <ChevronRight className="size-3.5 rtl:rotate-180" strokeWidth={1.75} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden size-8 rounded-lg border-border text-muted-foreground hover:text-foreground lg:inline-flex"
            onClick={() => {
              if (onPageChange) {
                onPageChange(pageCount);
              } else {
                setInternalPageIndex(pageCount - 1);
              }
            }}
            disabled={pageIndex >= pageCount - 1 || pageCount === 0}
            aria-label="Go to last page"
          >
            <ChevronsRight className="size-3.5 rtl:rotate-180" strokeWidth={1.75} />
          </Button>
        </div>
      </div>
    </div>
  );
}
