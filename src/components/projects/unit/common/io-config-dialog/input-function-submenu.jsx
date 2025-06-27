import React, { useMemo, useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Home,
  Lightbulb,
  Thermometer,
  ChevronsUpDown,
  Play,
  PlayCircle,
  Check,
} from "lucide-react";
import { INPUT_TYPES, getInputFunctionByValue } from "@/constants";
import { cn } from "@/lib/utils";

// Category configuration with icons and labels
const CATEGORY_CONFIG = {
  ROOM: {
    label: "Room Controls",
    icon: Home,
    color: "",
    description: "Key card, door switch, motion sensor",
  },
  LIGHTING: {
    label: "Lighting Controls",
    icon: Lightbulb,
    color: "",
    description: "Switch, dimmer, timer controls",
  },
  AIR_CONDITIONER: {
    label: "Air Conditioner",
    icon: Thermometer,
    color: "",
    description: "AC power, mode, fan speed, temperature",
  },
  CURTAIN: {
    label: "Curtain Controls",
    icon: ChevronsUpDown,
    color: "",
    description: "Curtain object controls",
  },
  SCENE: {
    label: "Scene Controls",
    icon: Play,
    color: "",
    description: "Scene triggers, toggles, sequences",
  },
  MULTI_SCENES: {
    label: "Multi-Scene Controls",
    icon: PlayCircle,
    color: "",
    description: "Multi-scene triggers and sequences",
  },
};

// Create a lookup map for faster category matching
const createCategoryLookup = () => {
  const lookup = new Map();
  Object.entries(INPUT_TYPES).forEach(([categoryKey, categoryFunctions]) => {
    categoryFunctions.forEach((func) => {
      lookup.set(func.value, categoryKey);
    });
  });
  return lookup;
};

// Memoize the category lookup to avoid recreating it
const CATEGORY_LOOKUP = createCategoryLookup();

// Memoized category submenu component
const CategorySubmenu = memo(
  ({ categoryKey, functions, selectedValue, onSelect }) => {
    const categoryConfig = CATEGORY_CONFIG[categoryKey];
    const CategoryIcon = categoryConfig.icon;

    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center gap-2 py-2">
          <CategoryIcon className={cn("h-4 w-4", categoryConfig.color)} />
          <div className="flex flex-col items-start">
            <span className="font-medium">{categoryConfig.label}</span>
            <span className="text-xs text-muted-foreground">
              {functions.length} option{functions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-56 max-h-[300px] overflow-y-auto">
          {functions.map((func) => (
            <DropdownMenuItem
              key={func.value}
              onClick={() => onSelect(func.value)}
              className={cn(
                "cursor-pointer py-2",
                parseInt(selectedValue) === func.value &&
                  "bg-accent text-accent-foreground"
              )}
            >
              <span className="font-medium">{func.label}</span>
              {parseInt(selectedValue) === func.value && (
                <Check className="h-4 w-4 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }
);

CategorySubmenu.displayName = "CategorySubmenu";

export const InputFunctionSubmenu = memo(function InputFunctionSubmenu({
  value,
  onValueChange,
  availableFunctions = [],
  placeholder = "Select function...",
  className,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  // Optimized function grouping using lookup map
  const categorizedFunctions = useMemo(() => {
    if (availableFunctions.length === 0) return [];

    const categories = {};

    // Initialize categories only for functions that exist
    const usedCategories = new Set();
    availableFunctions.forEach((func) => {
      const categoryKey = CATEGORY_LOOKUP.get(func.value) || "LIGHTING";
      usedCategories.add(categoryKey);
    });

    // Initialize only used categories
    usedCategories.forEach((categoryKey) => {
      categories[categoryKey] = [];
    });

    // Group functions by category using lookup
    availableFunctions.forEach((func) => {
      const categoryKey = CATEGORY_LOOKUP.get(func.value) || "LIGHTING";
      categories[categoryKey].push(func);
    });

    // Return sorted categories for consistent ordering
    const categoryOrder = [
      "ROOM",
      "LIGHTING",
      "AIR_CONDITIONER",
      "CURTAIN",
      "SCENE",
      "MULTI_SCENES",
    ];
    return categoryOrder
      .filter((categoryKey) => categories[categoryKey]?.length > 0)
      .map((categoryKey) => [categoryKey, categories[categoryKey]]);
  }, [availableFunctions]);

  // Memoize current function lookup
  const currentFunction = useMemo(() => {
    const numValue = parseInt(value);
    return isNaN(numValue) ? null : getInputFunctionByValue(numValue);
  }, [value]);

  // Memoize event handlers
  const handleSelect = useCallback(
    (functionValue) => {
      onValueChange(functionValue.toString());
      setOpen(false);
    },
    [onValueChange]
  );

  const handleOpenChange = useCallback((newOpen) => {
    setOpen(newOpen);
  }, []);

  const displayText = currentFunction?.label || placeholder;

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !currentFunction && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 max-h-[400px] overflow-y-auto">
        {categorizedFunctions.map(([categoryKey, functions]) => (
          <CategorySubmenu
            key={categoryKey}
            categoryKey={categoryKey}
            functions={functions}
            selectedValue={value}
            onSelect={handleSelect}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
