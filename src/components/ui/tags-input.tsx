import * as React from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  badgeClassName?: string;
  inputClassName?: string;
}

export function TagsInput({
  value = [],
  onChange,
  placeholder = "Agregar...",
  maxTags = 10,
  className = "",
  badgeClassName = "",
  inputClassName = "",
}: TagsInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    if (!inputValue.trim() || value.length >= maxTags) return;
    if (!value.includes(inputValue.trim())) {
      const newTags = [...value, inputValue.trim()];
      onChange(newTags);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = value.filter((t) => t !== tag);
    onChange(newTags);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      handleRemoveTag(value[value.length - 1]);
    }
  };

  const handleClickContainer = () => {
    inputRef.current?.focus();
  };

  return (
    <div 
      className={`flex flex-wrap items-center gap-1.5 p-1 border rounded-md bg-background min-h-10 ${className}`}
      onClick={handleClickContainer}
    >
      {value.map((tag, index) => (
        <Badge 
          key={index} 
          variant="secondary" 
          className={`px-2 py-0.5 text-xs gap-1 ${badgeClassName}`}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTag(tag);
            }}
            className="hover:bg-secondary/50 rounded-full"
          >
            <X size={12} />
          </button>
        </Badge>
      ))}
      <div className="flex-1 flex min-w-[120px]">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleAddTag}
          placeholder={value.length === 0 ? placeholder : ""}
          className={`border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-0 h-auto min-h-8 ${inputClassName}`}
          disabled={value.length >= maxTags}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleAddTag}
            className="p-1 hover:bg-secondary/50 rounded-full mr-1"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </div>
  );
}