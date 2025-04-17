import React from "react";
import { 
  MessageSquare, 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Smartphone, 
  Globe, 
  Mail
} from "lucide-react";

type CanalIconProps = {
  tipo: string;
  size?: number;
  className?: string;
  color?: string | null;
};

const CANAL_COLORS: Record<string, string> = {
  "whatsapp": "rgb(46, 204, 113)",
  "messenger": "rgb(66, 103, 178)",
  "instagram": "rgb(225, 48, 108)",
  "telegram": "rgb(0, 136, 204)",
  "sms": "rgb(144, 89, 255)",
  "web": "rgb(255, 126, 41)",
  "email": "rgb(255, 193, 7)",
  "default": "rgb(156, 163, 175)",
};

export function CanalIcon({ tipo, size = 24, className = "", color = null }: CanalIconProps) {
  // Usar el color proporcionado o usar el color predefinido para el tipo de canal
  const iconColor = color || CANAL_COLORS[tipo.toLowerCase()] || CANAL_COLORS.default;
  const style = color ? { color: iconColor } : {};
  
  // Si hay un color proporcionado, no usar las clases Tailwind preestablecidas
  const combinedClassName = `${className}`;
  
  switch (tipo.toLowerCase()) {
    case "whatsapp":
      return <MessageCircle size={size} className={combinedClassName} style={style} />;
    case "messenger":
      return <Facebook size={size} className={combinedClassName} style={style} />;
    case "instagram":
      return <Instagram size={size} className={combinedClassName} style={style} />;
    case "telegram":
      return <MessageCircle size={size} className={combinedClassName} style={style} />;
    case "sms":
      return <Smartphone size={size} className={combinedClassName} style={style} />;
    case "web":
      return <Globe size={size} className={combinedClassName} style={style} />;
    case "email":
      return <Mail size={size} className={combinedClassName} style={style} />;
    default:
      return <MessageSquare size={size} className={combinedClassName} style={style} />;
  }
}

export function getCanalColor(tipo: string, color?: string | null, opacity: number = 0.125): string {
  if (color) {
    return `rgba(${hexToRgb(color)}, ${opacity})`;
  }
  
  // Usar los colores predefinidos con transparencia
  const baseColor = CANAL_COLORS[tipo.toLowerCase()] || CANAL_COLORS.default;
  return baseColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
}

// Función auxiliar para convertir colores HEX a RGB
function hexToRgb(hex: string): string {
  // Eliminar # si existe
  hex = hex.replace('#', '');
  
  // Convertir hex corto a forma completa
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Convertir a valores RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}
