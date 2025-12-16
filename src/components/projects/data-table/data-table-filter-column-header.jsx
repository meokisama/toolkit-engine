import { Filter, Check, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function DataTableFilterColumnHeader({ column, title, className, filterOptions = [] }) {
  const filterValue = column.getFilterValue();
  const hasFilter = filterValue && filterValue !== "all";

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
            <span>{title}</span>
            {hasFilter ? (
              <Badge variant="secondary" className="h-5 px-1 text-xs">
                <Filter className="h-3 w-3" />
              </Badge>
            ) : (
              <Filter className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          {filterOptions.map((option) => {
            const isSelected = filterValue === option.value || (!filterValue && option.value === "all");
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => {
                  if (option.value === "all") {
                    column.setFilterValue(undefined);
                  } else {
                    column.setFilterValue(option.value);
                  }
                }}
                className="cursor-pointer"
              >
                <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                {option.label}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
