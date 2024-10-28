"use client";

import { Checkbox } from '@/components/ui/checkbox';
import { Employee } from '@/constants/data';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

// export const columns: ColumnDef<Employee>[] = [
export const columns = (): ColumnDef<Employee>[] => ([
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'title',
    header: 'TITLE'
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    accessorFn: (row) => {
      // return new Date(row.created_at).toLocaleDateString()
      return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'full', 
        timeStyle: 'short',
        hour12: true,
        // hour: "numeric",
        // minute: "numeric", 
      }).format(new Date(row.created_at))
    }
  },
  // {
  //   accessorKey: 'none',
  //   header: ''
  // },
  // {
  //   accessorKey: 'none',
  //   header: ''
  // },
  // {
  //   accessorKey: 'none',
  //   header: ''
  // },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction 
    data={row.original} />
  }
]
);
