import { TableCell, TableRow } from "@/components/ui/table";
import type { ReactNode } from "react";

interface TableEmptyRowProps {
  colSpan: number;
  message?: string;
  children?: ReactNode;
  className?: string;
}

export function TableEmptyRow({
  colSpan,
  message = "No results found.",
  children,
  className = "",
}: TableEmptyRowProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className={`h-24 text-center text-muted-foreground ${className}`}
      >
        {children || message}
      </TableCell>
    </TableRow>
  );
}
