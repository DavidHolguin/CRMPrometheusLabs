
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Common emoji categories with a selection of popular emojis
const emojiCategories = {
  "😊": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙"],
  "👍": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌"],
  "❤️": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️"],
  "🔥": ["🔥", "💫", "⭐", "🌟", "✨", "⚡", "💥", "💯", "💢", "💦", "💧", "🌊", "🍓", "🥝", "🍒", "🎁", "🎉", "🎊", "🎂", "🎈"]
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(emojiCategories)[0]);

  return (
    <Card className="w-64 border shadow-lg">
      <CardContent className="p-3">
        <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-4 h-9 mb-2">
            {Object.keys(emojiCategories).map((category) => (
              <TabsTrigger key={category} value={category} className="p-0">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(emojiCategories).map(([category, emojis]) => (
            <TabsContent key={category} value={category} className="mt-0">
              <ScrollArea className="h-36">
                <div className="grid grid-cols-5 gap-1">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onEmojiSelect(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
