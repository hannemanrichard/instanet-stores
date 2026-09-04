import * as React from "react";

import { cn } from "@/shared/utils/utils";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

const Table: React.FC<TableProps> = ({ children, className, ...props }) => (
  <div className="relative w-full overflow-auto">
    <table
      className={cn(
        "min-w-full divide-y divide-border bg-card text-card-foreground",
        className
      )}
      {...props}
    >
      {children}
    </table>
  </div>
);
Table.displayName = "Table";

const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className,
  ...props
}) => (
  <thead className={cn("bg-muted/50", className)} {...props}>
    {children}
  </thead>
);
TableHeader.displayName = "TableHeader";

const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className,
  ...props
}) => (
  <tbody className={cn("divide-y divide-border", className)} {...props}>
    {children}
  </tbody>
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className,
  ...props
}) => (
  <tr
    className={cn("transition-colors hover:bg-muted/40", className)}
    {...props}
  >
    {children}
  </tr>
);
TableRow.displayName = "TableRow";

const TableHead: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className,
  ...props
}) => (
  <th
    className={cn(
      "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </th>
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.HTMLAttributes<HTMLTableCellElement> & {
    colSpan?: number;
  }
>(({ children, className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 py-3 whitespace-nowrap text-sm text-foreground", className)}
    {...props}
  >
    {children}
  </td>
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
