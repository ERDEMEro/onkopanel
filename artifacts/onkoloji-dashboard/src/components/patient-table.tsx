import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { useGetPatients, getGetPatientsQueryKey } from "@workspace/api-client-react";
import type { PatientList } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Patient {
  id: string;
  clientId: string;
  gender: string;
  birthDate?: string;
  age?: number;
  department: string;
  admissionDate?: string;
  hasGeneticTest?: boolean;
  admissionType?: string;
  arrivalType?: string;
}

const columns: ColumnDef<Patient>[] = [
  {
    accessorKey: "clientId",
    header: "Hasta No",
    cell: ({ row }) => <span className="font-mono text-[13px] text-muted-foreground">{row.original.clientId}</span>,
  },
  {
    accessorKey: "age",
    header: "Yaş",
    cell: ({ row }) => row.original.age ?? "-",
  },
  {
    accessorKey: "gender",
    header: "Cinsiyet",
    cell: ({ row }) => {
      const gender = row.original.gender;
      const isFemale = gender.toLowerCase().includes("kadın") || gender.toLowerCase().includes("female");
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium ${isFemale ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
          {gender}
        </span>
      );
    }
  },
  {
    accessorKey: "department",
    header: "Poliklinik",
    cell: ({ row }) => <span className="text-[13px] truncate max-w-[200px] block" title={row.original.department}>{row.original.department}</span>,
  },
  {
    accessorKey: "admissionDate",
    header: "Başvuru Tarihi",
    cell: ({ row }) => {
      if (!row.original.admissionDate) return "-";
      return <span className="text-[13px] text-muted-foreground">{row.original.admissionDate}</span>;
    }
  },
  {
    accessorKey: "hasGeneticTest",
    header: "Genetik Test",
    cell: ({ row }) => {
      if (row.original.hasGeneticTest === undefined) return "-";
      return row.original.hasGeneticTest ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Yapıldı</span>
      ) : (
        <span className="text-[13px] text-muted-foreground">-</span>
      );
    }
  }
];

export function PatientTable() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("");

  // Debounce search
  useMemo(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const queryParams = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch || undefined,
    gender: genderFilter || undefined
  };

  const { data, isLoading, isFetching } = useGetPatients(queryParams, {
    query: {
      enabled: true,
      queryKey: getGetPatientsQueryKey(queryParams),
      placeholderData: (prev: PatientList | undefined) => prev
    }
  });

  const tableData = data?.patients || [];
  const totalCount = data?.total || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const table = useReactTable({
    data: tableData,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hasta No ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[240px] pl-9 h-9 text-[13px] bg-background"
            />
          </div>
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPagination(prev => ({ ...prev, pageIndex: 0 }));
            }}
            className="h-9 border border-input rounded-md px-3 py-1 text-[13px] bg-background text-foreground"
          >
            <option value="">Tüm Cinsiyetler</option>
            <option value="Kadın">Kadın</option>
            <option value="Erkek">Erkek</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border bg-background overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs uppercase font-semibold text-muted-foreground h-10">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && tableData.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="h-12"><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : tableData.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={isFetching ? "opacity-60 transition-opacity" : ""}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[13px] text-muted-foreground">
          Toplam <span className="font-medium text-foreground">{totalCount}</span> kayıttan{" "}
          <span className="font-medium text-foreground">{Math.min(pagination.pageIndex * pagination.pageSize + 1, totalCount)}</span>-
          <span className="font-medium text-foreground">{Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount)}</span> arası gösteriliyor
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-[13px]"
            onClick={() => table.previousPage()} 
            disabled={!table.getCanPreviousPage() || isFetching}
          >
            Önceki
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-[13px]"
            onClick={() => table.nextPage()} 
            disabled={!table.getCanNextPage() || isFetching}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}
