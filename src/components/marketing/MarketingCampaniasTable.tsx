import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  Plus,
  Edit,
  Trash2,
  BarChart2,
  Calendar,
  ArrowUpDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MarketingCampania, 
  MarketingCampaniaInput,
  useMarketingCampanias 
} from "@/hooks/marketing/useMarketingCampanias";

interface DataTableProps {
  data: MarketingCampania[];
  isLoading: boolean;
  totalCount: number;
  pageCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (term: string) => void;
  onCampaniaClick: (campania: MarketingCampania) => void;
  onAddClick: () => void;
  onEditClick: (campania: MarketingCampania) => void;
  onDeleteClick: (campania: MarketingCampania) => void;
  onReportClick?: (campania: MarketingCampania) => void;
}

// Definir formatos para mostrar fechas
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

// Formatear números como monedas
const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Definición de columnas
const columns: ColumnDef<MarketingCampania>[] = [
  {
    accessorKey: "nombre",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("nombre")}</div>
    )
  },
  {
    accessorKey: "objetivo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Objetivo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "presupuesto",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Presupuesto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div>{formatCurrency(row.getValue("presupuesto"))}</div>
    ),
  },
  {
    accessorKey: "estado",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Estado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string;
      let badgeVariant:
        | "default"
        | "secondary"
        | "destructive"
        | "outline" = "default";

      switch (estado.toLowerCase()) {
        case "activa":
          badgeVariant = "default";
          break;
        case "pausada":
          badgeVariant = "secondary";
          break;
        case "finalizada":
          badgeVariant = "outline";
          break;
        case "borrador":
          badgeVariant = "outline";
          break;
        case "cancelada":
          badgeVariant = "destructive";
          break;
        default:
          badgeVariant = "outline";
      }

      return <Badge variant={badgeVariant}>{estado}</Badge>;
    },
  },
  {
    accessorKey: "fecha_inicio",
    header: () => <div className="text-right">Fecha Inicio</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            {formatDate(row.getValue("fecha_inicio"))}
          </div>
        </div>
      );
    },
  },
  {
    id: "acciones",
    cell: ({ row, table }) => {
      const campania = row.original;
      const { onEditClick, onDeleteClick, onReportClick } = table.options
        .meta as { 
          onEditClick: (campania: MarketingCampania) => void; 
          onDeleteClick: (campania: MarketingCampania) => void;
          onReportClick?: (campania: MarketingCampania) => void;
        };

      return (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEditClick(campania)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDeleteClick(campania)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {onReportClick && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onReportClick(campania)}
            >
              <BarChart2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];

export function MarketingCampaniasTable({
  data,
  isLoading,
  totalCount,
  pageCount,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onCampaniaClick,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onReportClick,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaniaToDelete, setCampaniaToDelete] = useState<MarketingCampania | null>(null);

  // Configuración de la tabla
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true,
    pageCount: pageCount,
    meta: {
      onEditClick: (campania: MarketingCampania) => {
        onEditClick(campania);
      },
      onDeleteClick: (campania: MarketingCampania) => {
        setCampaniaToDelete(campania);
        setDeleteDialogOpen(true);
      },
      onReportClick: onReportClick
        ? (campania: MarketingCampania) => {
            onReportClick(campania);
          }
        : undefined,
    },
  });

  // Manejador de búsqueda
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  // Manejador de confirmación de eliminación
  const handleDeleteConfirm = () => {
    if (campaniaToDelete) {
      onDeleteClick(campaniaToDelete);
    }
    setDeleteDialogOpen(false);
    setCampaniaToDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Campañas de Marketing</h2>
        <Button onClick={onAddClick} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Nueva Campaña
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar campañas..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Estado de carga
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={`skeleton-cell-${j}`}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              // Datos disponibles
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={() => onCampaniaClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Sin datos
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay campañas disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Mostrando {Math.min(totalCount, page * pageSize + 1)} -{" "}
          {Math.min(totalCount, (page + 1) * pageSize)} de {totalCount} campañas
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(0)}
            disabled={page === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Página {page + 1} de {pageCount}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page === pageCount - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(pageCount - 1)}
            disabled={page === pageCount - 1}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la campaña "{campaniaToDelete?.nombre}".
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Componente contenedor que conecta con los hooks
export function MarketingCampaniasTableContainer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const { toast } = useToast();

  const {
    campanias,
    isLoading,
    totalCount,
    totalPages,
    createCampania,
    updateCampania,
    deleteCampania,
    getCampaniaById,
    getCampaniaPerformance
  } = useMarketingCampanias({
    page: currentPage,
    pageSize,
    filters: {
      searchTerm: searchTerm || undefined
    }
  });

  // Handlers
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCampaniaClick = (campania: MarketingCampania) => {
    // Abrir vista detallada o realizar otra acción
    toast({
      title: "Campaña seleccionada",
      description: `Has seleccionado la campaña: ${campania.nombre}`,
    });
  };

  const handleAddClick = () => {
    // Abrir modal para crear
    toast({
      title: "Nueva campaña",
      description: "Abriendo formulario para crear una nueva campaña",
    });
  };

  const handleEditClick = (campania: MarketingCampania) => {
    // Abrir modal para editar
    toast({
      title: "Editar campaña",
      description: `Abriendo formulario para editar: ${campania.nombre}`,
    });
  };

  const handleDeleteClick = (campania: MarketingCampania) => {
    deleteCampania.mutate(campania.id);
  };

  const handleReportClick = async (campania: MarketingCampania) => {
    // Obtener y mostrar métricas
    const metricas = await getCampaniaPerformance(campania.id);
    if (metricas) {
      toast({
        title: `Métricas de ${campania.nombre}`,
        description: `Vistas: ${metricas.vistas} | Clics: ${metricas.clics} | CTR: ${metricas.ctr}%`,
      });
    } else {
      toast({
        title: "Error al obtener métricas",
        description: "No se pudieron cargar las métricas de la campaña",
        variant: "destructive"
      });
    }
  };

  return (
    <MarketingCampaniasTable
      data={campanias || []}
      isLoading={isLoading}
      totalCount={totalCount}
      pageCount={totalPages}
      page={currentPage}
      pageSize={pageSize}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      onCampaniaClick={handleCampaniaClick}
      onAddClick={handleAddClick}
      onEditClick={handleEditClick}
      onDeleteClick={handleDeleteClick}
      onReportClick={handleReportClick}
    />
  );
}