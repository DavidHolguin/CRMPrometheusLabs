
import { useState } from "react";
import { Grid2X2, List, Plus } from "lucide-react";
import { useChatbots } from "@/hooks/useChatbots";
import { ChatbotCard } from "@/components/chatbots/ChatbotCard";
import { ChatbotList } from "@/components/chatbots/ChatbotList";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { CreateChatbotModal } from "@/components/chatbots/CreateChatbotModal";

const Chatbots = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: chatbots = [], isLoading, isError, refetch } = useChatbots();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (isError) {
    toast.error("Error al cargar los chatbots. Intente de nuevo.");
  }

  // Verificamos si hay un ID de empresa en el contexto del usuario
  if (!user?.companyId && !isLoading) {
    console.error("No hay ID de empresa asociada al usuario actual");
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Chatbots</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus chatbots y personaliza sus configuraciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted p-1 rounded-md flex">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md ${
                viewMode === "grid" ? "bg-background shadow" : ""
              }`}
              title="Vista de cuadrícula"
            >
              <Grid2X2 size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md ${
                viewMode === "list" ? "bg-background shadow" : ""
              }`}
              title="Vista de lista"
            >
              <List size={18} />
            </button>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" /> Crear Chatbot
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p className="animate-pulse text-muted-foreground">Cargando chatbots...</p>
          </div>
        ) : (
          <>
            {chatbots && chatbots.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {chatbots.map((chatbot) => (
                    <ChatbotCard 
                      key={chatbot.id} 
                      chatbot={chatbot} 
                      onDelete={() => refetch()}
                      onEdit={() => refetch()}
                      onLiveView={() => navigate(`/chat/${chatbot.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <ChatbotList 
                  chatbots={chatbots} 
                  onDelete={() => refetch()}
                  onEdit={() => refetch()}
                  onLiveView={(id) => navigate(`/chat/${id}`)}
                />
              )
            ) : (
              <div className="text-center p-10 border rounded-lg">
                <h3 className="text-xl font-medium mb-2">No hay chatbots</h3>
                <p className="text-muted-foreground mb-4">
                  Comienza creando tu primer chatbot para interactuar con tus clientes.
                </p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus size={16} className="mr-2" /> Crear mi primer Chatbot
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <CreateChatbotModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          refetch();
          toast.success("Chatbot creado exitosamente");
        }}
      />
    </div>
  );
};

export default Chatbots;
