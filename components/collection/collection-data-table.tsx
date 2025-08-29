'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Rating } from '@/components/ui/rating';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  Calendar,
  Clock,
  ExternalLink,
  Heart,
  MoreHorizontal,
  Star,
  Edit3,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// TypeScript interfaces for collection data
interface FragranceBrand {
  id: string;
  name: string;
}

interface Fragrance {
  id: string;
  name: string;
  brand_id: string;
  fragrance_family?: string;
  image_url?: string;
  sample_available?: boolean;
  sample_price_usd?: number;
  fragrance_brands?: FragranceBrand | FragranceBrand[];
}

interface CollectionItem {
  id: string;
  user_id: string;
  fragrance_id: string;
  status: 'saved' | 'owned' | 'wishlist' | 'tried';
  rating?: number;
  notes?: string;
  purchase_date?: string;
  purchase_date?: string;
  purchase_price?: number;
  added_at: string;
  fragrances: Fragrance;
}

interface CollectionDataTableProps {
  data: CollectionItem[];
  onItemClick: (item: CollectionItem) => void;
  onItemEdit?: (item: CollectionItem) => void;
  onItemRemove?: (item: CollectionItem) => void;
  onSelectionChange?: (selectedItems: CollectionItem[]) => void;
  className?: string;
}

export function CollectionDataTable({
  data,
  onItemClick,
  onItemEdit,
  onItemRemove,
  onSelectionChange,
  className,
}: CollectionDataTableProps) {
  const [selectedItems, setSelectedItems] = React.useState<CollectionItem[]>(
    []
  );

  // Helper function to get brand name
  const getBrandName = (fragrance: Fragrance): string => {
    if (Array.isArray(fragrance.fragrance_brands)) {
      return fragrance.fragrance_brands[0]?.name || 'Unknown Brand';
    }
    return fragrance.fragrance_brands?.name || 'Unknown Brand';
  };

  // Helper function to get status styling
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'saved':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'owned':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'wishlist':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'tried':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Handle selection changes
  const handleSelectionChange = React.useCallback(
    (selectedRows: CollectionItem[]) => {
      setSelectedItems(selectedRows);
      onSelectionChange?.(selectedRows);
    },
    [onSelectionChange]
  );

  // Column definitions
  const columns: ColumnDef<CollectionItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'fragrance',
      accessorKey: 'fragrances.name',
      header: 'Fragrance',
      cell: ({ row }) => {
        const item = row.original;
        const fragrance = item.fragrances;
        const brandName = getBrandName(fragrance);

        return (
          <div className='flex items-center space-x-3'>
            <div className='w-12 h-12 relative bg-gradient-to-br from-cream-100 to-cream-200 rounded-lg overflow-hidden flex-shrink-0'>
              {fragrance.image_url ? (
                <Image
                  src={fragrance.image_url}
                  alt={`${fragrance.name} bottle`}
                  fill
                  className='object-cover'
                  sizes='48px'
                />
              ) : (
                <div className='flex items-center justify-center h-full text-xs'>
                  🌸
                </div>
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <div className='font-medium text-foreground truncate'>
                {fragrance.name}
              </div>
              <div className='text-sm text-muted-foreground truncate'>
                {brandName}
              </div>
              {fragrance.fragrance_family && (
                <Badge variant='outline' className='text-xs mt-1'>
                  {fragrance.fragrance_family}
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 px-2 lg:px-3'
          >
            Status
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant='outline'
            className={cn('text-xs', getStatusStyling(status))}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'rating',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 px-2 lg:px-3'
          >
            Rating
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const rating = row.getValue('rating') as number;
        return rating ? (
          <div className='flex items-center space-x-2'>
            <Rating value={rating} size='sm' />
            <span className='text-xs text-muted-foreground'>{rating}/5</span>
          </div>
        ) : (
          <span className='text-xs text-muted-foreground'>Unrated</span>
        );
      },
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => {
        const rating = row.getValue('rating') as number;
        const displayMap = {
          daily: 'Daily',
          weekly: 'Weekly',
          occasional: 'Occasional',
          special: 'Special',
        };
        return (
          <div className='flex items-center space-x-1'>
            <Clock className='h-3 w-3 text-muted-foreground' />
            <span className='text-sm'>
              {frequency
                ? displayMap[frequency as keyof typeof displayMap]
                : 'Not set'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'added_at',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-8 px-2 lg:px-3'
          >
            Added
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('added_at'));
        return (
          <div className='flex items-center space-x-1'>
            <Calendar className='h-3 w-3 text-muted-foreground' />
            <span className='text-sm'>
              {date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => {
        const notes = row.getValue('notes') as string;
        return notes ? (
          <div className='max-w-[200px] truncate text-sm text-muted-foreground italic'>
            "{notes}"
          </div>
        ) : (
          <span className='text-xs text-muted-foreground'>No notes</span>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onItemClick(item)}>
                <ExternalLink className='mr-2 h-4 w-4' />
                View Details
              </DropdownMenuItem>
              {onItemEdit && (
                <DropdownMenuItem onClick={() => onItemEdit(item)}>
                  <Edit3 className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
              )}
              {item.status === 'wishlist' && (
                <DropdownMenuItem>
                  <Heart className='mr-2 h-4 w-4' />
                  Mark as Owned
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onItemRemove && (
                <DropdownMenuItem
                  onClick={() => onItemRemove(item)}
                  className='text-destructive'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className={className}>
      <DataTable
        columns={columns}
        data={data}
        searchKey='fragrances.name'
        searchPlaceholder='Search fragrances...'
        onRowClick={row => onItemClick(row)}
        pageSize={20}
        className='border rounded-lg'
      />

      {/* Selection Summary */}
      {selectedItems.length > 0 && (
        <div className='mt-4 p-4 bg-accent rounded-lg border'>
          <div className='flex items-center justify-between'>
            <span className='font-medium'>
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}{' '}
              selected
            </span>
            <div className='flex items-center space-x-2'>
              <Button size='sm' variant='outline'>
                Mark as Tried
              </Button>
              <Button size='sm' variant='outline'>
                Add Tags
              </Button>
              <Button size='sm' variant='destructive'>
                Remove Selected
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setSelectedItems([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export type definitions for use in parent components
export type { CollectionItem, Fragrance, FragranceBrand };
