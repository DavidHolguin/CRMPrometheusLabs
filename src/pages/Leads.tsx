import { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useLocation } from "react-router-dom";
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Grid3X3, 
  List, 
  Mail, 
  MessageSquare, 
  Phone, 
  Search, 
  Star, 
  User 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const LeadsPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const chatbotId = searchParams.get('chatbotId');
  
  const { data: leads = [], isLoading } = useLeads(chatbotId || undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter leads based on search query
  const filteredLeads = leads.filter(lead => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (lead.nombre && lead.nombre.toLowerCase().includes(searchLower)) ||
      (lead.apellido && lead.apellido.toLowerCase().includes(searchLower)) ||
      (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
      (lead.telefono && lead.telefono.toLowerCase().includes(searchLower)) ||
      (lead.canal_origen && lead.canal_origen.toLowerCase().includes(searchLower))
    );
  });

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let aValue: any = a[sortField as keyof typeof a];
    let bValue: any = b[sortField as keyof typeof b];
    
    // Handle null values
    if (aValue === null) aValue = "";
    if (bValue === null) bValue = "";
    
    // Handle dates
    if (sortField === "created_at" || sortField === "updated_at" || sortField === "ultima_interaccion") {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Paginate leads
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true,
        locale: es
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Fecha inválida";
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Button>Nuevo Lead</Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-2" />
            Filtrar
          </Button>
          
          <div className="border rounded-md p-1">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="rounded-r-none"
            >
              <Grid3X3 size={16} />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-primary">Cargando leads...</div>
        </div>
      ) : (
        <>
          {viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedLeads.map((lead) => (
                <Card key={lead.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {lead.nombre ? lead.nombre.charAt(0) : "?"}
                          {lead.apellido ? lead.apellido.charAt(0) : ""}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            {lead.nombre} {lead.apellido}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{lead.email || "Sin correo"}</p>
                        </div>
                      </div>
                      <Badge style={{ backgroundColor: lead.stage_color }}>
                        {lead.stage_name}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-2 pb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-muted-foreground" />
                        <span>{lead.telefono || "No disponible"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-muted-foreground" />
                        <span>{lead.message_count} mensajes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-muted-foreground" />
                        <span>{lead.interaction_count} interacciones</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-muted-foreground" />
                        <span>{lead.score} puntos</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {lead.tags && lead.tags.map(tag => (
                        <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                          {tag.nombre}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="mt-3 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Origen: {lead.canal_origen || "Desconocido"}</span>
                        <span>Creado: {formatDate(lead.created_at)}</span>
                      </div>
                      {lead.ultima_interaccion && (
                        <div className="text-right mt-1">
                          Última interacción: {formatDate(lead.ultima_interaccion)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="bg-muted/10 pt-2 pb-2 flex justify-between">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/dashboard/conversations/${lead.id}`}>
                        <Mail size={16} className="mr-1" />
                        Chat
                      </a>
                    </Button>
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("nombre")}
                    >
                      <div className="flex items-center">
                        Nombre
                        {sortField === "nombre" && (
                          sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("canal_origen")}
                    >
                      <div className="flex items-center">
                        Origen
                        {sortField === "canal_origen" && (
                          sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("score")}
                    >
                      <div className="flex items-center">
                        Score
                        {sortField === "score" && (
                          sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Mensajes</TableHead>
                    <TableHead>Interacciones</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("ultima_interaccion")}
                    >
                      <div className="flex items-center">
                        Última Interacción
                        {sortField === "ultima_interaccion" && (
                          sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                            {lead.nombre ? lead.nombre.charAt(0) : "?"}
                            {lead.apellido ? lead.apellido.charAt(0) : ""}
                          </div>
                          <div>
                            <p className="font-medium">{lead.nombre} {lead.apellido}</p>
                            <p className="text-xs text-muted-foreground">
                              Creado {formatDate(lead.created_at)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Mail size={14} className="text-muted-foreground" />
                            <span className="text-sm">{lead.email || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone size={14} className="text-muted-foreground" />
                            <span className="text-sm">{lead.telefono || "N/A"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{lead.canal_origen || "Desconocido"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.score}</Badge>
                      </TableCell>
                      <TableCell>{lead.message_count}</TableCell>
                      <TableCell>{lead.interaction_count}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: lead.stage_color }}>
                          {lead.stage_name}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(lead.ultima_interaccion)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/dashboard/conversations/${lead.id}`}>
                              <MessageSquare size={14} />
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <User size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default LeadsPage;
