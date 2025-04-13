import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

// Categorías comunes de emojis
const commonEmojis = [
  "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", 
  "😋", "😎", "😍", "😘", "🥰", "😗", "😙", "😚", "🙂", "🤗"
];

const facesEmojis = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️",
  "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗",
  "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓",
  "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕",
  "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤",
  "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰"
];

const handsEmojis = [
  "👋", "🤚", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟",
  "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎",
  "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏",
  "💪", "🦾", "🖐️", "✍️", "🤳", "💅", "🦵", "🦶", "👂", "🦻"
];

const symbolsEmojis = [
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "❤️‍🔥",
  "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️",
  "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐",
  "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
  "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳"
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  return (
    <div className="bg-card rounded-lg shadow-lg border border-border w-72 overflow-hidden">
      <div className="p-2 border-b border-border">
        <input
          type="text"
          placeholder="Buscar emoji..."
          className="w-full bg-background text-sm rounded px-2 py-1.5 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
        />
      </div>

      <Tabs defaultValue="recientes">
        <TabsList className="grid grid-cols-4 h-auto p-0 bg-background">
          <TabsTrigger value="recientes" className="py-2 px-0 text-xs data-[state=active]:bg-muted">Recientes</TabsTrigger>
          <TabsTrigger value="caras" className="py-2 px-0 text-xs data-[state=active]:bg-muted">Caras</TabsTrigger>
          <TabsTrigger value="gestos" className="py-2 px-0 text-xs data-[state=active]:bg-muted">Gestos</TabsTrigger>
          <TabsTrigger value="símbolos" className="py-2 px-0 text-xs data-[state=active]:bg-muted">Símbolos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recientes" className="p-2 max-h-52 overflow-y-auto">
          <div className="grid grid-cols-6 gap-2">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="hover:bg-accent rounded flex items-center justify-center h-8 w-8 text-base"
              >
                {emoji}
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="caras" className="p-2 max-h-52 overflow-y-auto">
          <div className="grid grid-cols-6 gap-2">
            {facesEmojis
              .filter(emoji => !searchTerm || emoji.includes(searchTerm))
              .map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="hover:bg-accent rounded flex items-center justify-center h-8 w-8 text-base"
                >
                  {emoji}
                </button>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="gestos" className="p-2 max-h-52 overflow-y-auto">
          <div className="grid grid-cols-6 gap-2">
            {handsEmojis
              .filter(emoji => !searchTerm || emoji.includes(searchTerm))
              .map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="hover:bg-accent rounded flex items-center justify-center h-8 w-8 text-base"
                >
                  {emoji}
                </button>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="símbolos" className="p-2 max-h-52 overflow-y-auto">
          <div className="grid grid-cols-6 gap-2">
            {symbolsEmojis
              .filter(emoji => !searchTerm || emoji.includes(searchTerm))
              .map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="hover:bg-accent rounded flex items-center justify-center h-8 w-8 text-base"
                >
                  {emoji}
                </button>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
