import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Table({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>): React.JSX.Element {
  return (
    <div className="w-full overflow-auto rounded-lg border border-border bg-card shadow-sm">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}

export function TableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): React.JSX.Element {
  return <thead className={cn('bg-muted/40 [&_tr]:border-b', className)} {...props} />
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): React.JSX.Element {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>): React.JSX.Element {
  return (
    <tr
      className={cn('border-b border-border transition-colors hover:bg-muted/40', className)}
      {...props}
    />
  )
}

export function TableHead({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>): React.JSX.Element {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left align-middle text-xs font-medium tracking-wide text-muted-foreground uppercase',
        className
      )}
      {...props}
    />
  )
}

export function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>): React.JSX.Element {
  return <td className={cn('px-4 py-3 align-middle', className)} {...props} />
}
