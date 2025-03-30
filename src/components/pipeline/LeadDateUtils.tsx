
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function formatLeadDate(dateStr: string | null): string {
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
}
