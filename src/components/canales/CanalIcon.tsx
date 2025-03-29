
import React from "react";
import { 
  MessageSquare, 
  Facebook, 
  Instagram, 
  Telegram, 
  Smartphone, 
  Globe, 
  WhatsApp,
  MessageCircle,
  Mail
} from "lucide-react";

type CanalIconProps = {
  tipo: string;
  size?: number;
  className?: string;
};

const CANAL_COLORS: Record<string, string> = {
  "whatsapp": "text-green-500",
  "messenger": "text-blue-500",
  "instagram": "text-pink-500",
  "telegram": "text-sky-500",
  "sms": "text-purple-500",
  "web": "text-orange-500",
  "email": "text-yellow-500",
  "default": "text-gray-500",
};

export function CanalIcon({ tipo, size = 24, className = "" }: CanalIconProps) {
  const color = CANAL_COLORS[tipo.toLowerCase()] || CANAL_COLORS.default;
  const combinedClassName = `${color} ${className}`;
  
  switch (tipo.toLowerCase()) {
    case "whatsapp":
      return <WhatsApp size={size} className={combinedClassName} />;
    case "messenger":
      return <Facebook size={size} className={combinedClassName} />;
    case "instagram":
      return <Instagram size={size} className={combinedClassName} />;
    case "telegram":
      return <Telegram size={size} className={combinedClassName} />;
    case "sms":
      return <Smartphone size={size} className={combinedClassName} />;
    case "web":
      return <Globe size={size} className={combinedClassName} />;
    case "email":
      return <Mail size={size} className={combinedClassName} />;
    default:
      return <MessageSquare size={size} className={combinedClassName} />;
  }
}

export function getCanalColor(tipo: string): string {
  const baseColor = CANAL_COLORS[tipo.toLowerCase()]?.replace("text-", "bg-") || "bg-gray-500";
  // Convertir a versión más suave para fondos
  return baseColor.replace(/-500/g, "-100");
}
