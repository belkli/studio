"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ComboboxProps = {
  options: { value: string; label: string }[];
  selectedValue: string;
  onSelectedValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundMessage?: string;
  onInputChange?: (search: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
};

export function Combobox({
  options,
  selectedValue,
  onSelectedValueChange,
  placeholder = "בחר פריט...",
  searchPlaceholder = "חפש פריט...",
  notFoundMessage = "לא נמצאו פריטים.",
  onInputChange,
  isLoading = false,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedValue
            ? options.find((option) => option.value === selectedValue || option.label === selectedValue)?.label ?? placeholder
            : placeholder}
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            onValueChange={onInputChange}
          />
          <CommandList>
            {isLoading && <div className="p-4 text-sm text-center text-muted-foreground">טוען...</div>}
            {!isLoading && <CommandEmpty>{notFoundMessage}</CommandEmpty>}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    const selectedOption = options.find(opt => opt.value.toLowerCase() === currentValue.toLowerCase());
                    onSelectedValueChange(selectedOption ? selectedOption.value : "");
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "me-2 h-4 w-4",
                      selectedValue === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
