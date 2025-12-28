/**
 * QuotationActionsDropdown Component
 *
 * A reusable dropdown menu for quotation actions.
 * Replaces duplicate dropdown implementations across quotation pages.
 */

import { MoreVertical, Printer, Copy, Trash2, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface QuotationActionsDropdownProps {
  /**
   * View action handler
   */
  onView?: () => void;

  /**
   * Edit action handler
   */
  onEdit?: () => void;

  /**
   * Print action handler
   */
  onPrint?: () => void;

  /**
   * Supersede (create new version) action handler
   */
  onSupersede?: () => void;

  /**
   * Delete action handler
   */
  onDelete?: () => void;

  /**
   * Whether to show the edit option
   * @default true
   */
  showEdit?: boolean;
}

/**
 * Displays a dropdown menu with quotation actions
 *
 * @example
 * <QuotationActionsDropdown
 *   onView={() => handleView(id)}
 *   onPrint={() => handlePrint(id)}
 *   onDelete={() => handleDelete(id)}
 * />
 *
 * @example
 * <QuotationActionsDropdown
 *   onView={handleView}
 *   onEdit={handleEdit}
 *   onPrint={handlePrint}
 *   onSupersede={handleSupersede}
 *   onDelete={handleDelete}
 *   showEdit={false}
 * />
 */
export function QuotationActionsDropdown({
  onView,
  onEdit,
  onPrint,
  onSupersede,
  onDelete,
  showEdit = true,
}: QuotationActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
        )}
        {showEdit && onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {onPrint && (
          <DropdownMenuItem onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </DropdownMenuItem>
        )}
        {onSupersede && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSupersede}>
              <Copy className="mr-2 h-4 w-4" />
              Create New Version
            </DropdownMenuItem>
          </>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
