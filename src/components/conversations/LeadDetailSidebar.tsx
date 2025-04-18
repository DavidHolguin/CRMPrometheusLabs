import React from 'react';
import { Lead } from '@/hooks/useLeads'; // Asumiendo que la interfaz Lead está aquí
import LeadInfo from './LeadInfo';
import LeadComments from './LeadComments';
import { Button } from '@/components/ui/button'; // Para el botón de añadir comentario

interface LeadDetailSidebarProps {
  selectedLead: Lead | null;
  leadComments: any[]; // Ajusta el tipo según tu definición
  isLoadingComments: boolean;
  onAddComment: () => void;
  // Añade aquí todas las props necesarias que usan LeadInfo y LeadComments
  // Por ejemplo: user, isAssigning, isReleasing, handleAssignToMe, etc.
  user: any; // Ajusta el tipo
  isAssigning: boolean;
  isReleasing: boolean;
  handleAssignToMe: () => Promise<void>;
  handleReleaseAssignment: () => Promise<void>;
  openTransferDialog: () => void;
  leadConversations: any[]; // Ajusta el tipo
}

const LeadDetailSidebar: React.FC<LeadDetailSidebarProps> = ({
  selectedLead,
  leadComments,
  isLoadingComments,
  onAddComment,
  user,
  isAssigning,
  isReleasing,
  handleAssignToMe,
  handleReleaseAssignment,
  openTransferDialog,
  leadConversations
}) => {
  if (!selectedLead) {
    return (
      <aside className="w-80 border-l border-border bg-card p-4 flex flex-col items-center justify-center text-center h-full">
        <p className="text-muted-foreground">Selecciona una conversación para ver los detalles del lead.</p>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col h-full overflow-y-auto">
      <div className="p-4 flex-grow">
        {/* Aquí iría LeadInfo y LeadComments, quizás con pestañas o secciones */}
        <LeadInfo
          selectedLead={selectedLead}
          leadConversations={leadConversations}
          user={user}
          isAssigning={isAssigning}
          isReleasing={isReleasing}
          handleAssignToMe={handleAssignToMe}
          handleReleaseAssignment={handleReleaseAssignment}
          openTransferDialog={openTransferDialog}
        />
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Comentarios</h3>
          <LeadComments
            isLoading={isLoadingComments}
            comments={leadComments}
            onAddComment={onAddComment}
          />
        </div>
      </div>
      {/* Puedes añadir acciones fijas en la parte inferior si es necesario */}
      {/* <div className="p-4 border-t border-border">
        <Button onClick={onAddComment} className="w-full">Añadir Comentario</Button>
      </div> */}
    </aside>
  );
};

export default LeadDetailSidebar;
