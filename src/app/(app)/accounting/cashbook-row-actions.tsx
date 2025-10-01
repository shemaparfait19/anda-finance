
'use client';

import { useState, useTransition } from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AppConfirmationDialog } from '@/components/ui/app-confirmation-dialog';
import AddEntryDialog from './add-entry-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteCashbookEntry } from './actions';
import type { CashbookEntry } from '@/lib/types';


export default function CashbookRowActions({ entry, type }: { entry: CashbookEntry; type: 'income' | 'expenses' }) {
  const { toast } = useToast();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  const handleDelete = async () => {
    startDeleteTransition(async () => {
      const result = await deleteCashbookEntry(type, entry.id);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
      setDeleteDialogOpen(false);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-haspopup="true" size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddEntryDialog entry={entry} open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        {/* This dialog is controlled by state, trigger is implicit */}
      </AddEntryDialog>

      <AppConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Entry"
        description="Are you sure you want to delete this cashbook entry? This action cannot be undone."
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </>
  );
}
