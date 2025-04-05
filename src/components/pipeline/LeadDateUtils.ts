
export function formatLeadDate(dateString: string | null): string {
  if (!dateString) return "No disponible";
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Fecha inválida";
  }
}
