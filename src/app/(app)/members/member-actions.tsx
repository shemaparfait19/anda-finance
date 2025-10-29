"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import type { Member } from "@/lib/types";
import { deactivateMember, reactivateMember } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { AppConfirmationDialog } from "@/components/ui/app-confirmation-dialog";
import EditMemberSheet from "./edit-member-sheet";

export default function MemberActions({ member }: { member: Member }) {
  const { toast } = useToast();
  const [isDeactivating, startDeactivationTransition] = useTransition();
  const [isReactivating, startReactivationTransition] = useTransition();
  const [isDeactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [isReactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  const image = getPlaceholderImage(member.avatarId);

  const handleDeactivate = async () => {
    startDeactivationTransition(async () => {
      const result = await deactivateMember(member.id);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
      setDeactivateDialogOpen(false);
    });
  };

  const handleReactivate = async () => {
    startReactivationTransition(async () => {
      const result = await reactivateMember(member.id);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
      setReactivateDialogOpen(false);
    });
  };

  return (
    <>
      <TableCell className="hidden sm:table-cell">
        <Image
          alt={`Avatar of ${member.name}`}
          className="aspect-square rounded-full object-cover"
          height="40"
          src={image.imageUrl}
          width="40"
          data-ai-hint={image.imageHint}
        />
      </TableCell>
      <TableCell className="font-medium">{member.name}</TableCell>
      <TableCell>{member.memberId}</TableCell>
      <TableCell>
        <Badge variant={
          member.status === "Active" ? "default" :
          member.status === "Inactive" ? "secondary" :
          member.status === "Dormant" ? "outline" :
          "destructive" // for Closed
        }>
          {member.status}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        RWF {member.savingsBalance.toLocaleString()}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        RWF {member.loanBalance.toLocaleString()}
      </TableCell>

      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/members/${member.id}`}>View Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => setDeactivateDialogOpen(true)}
              disabled={member.status === "Inactive"}
            >
              Deactivate
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setReactivateDialogOpen(true)}
              disabled={member.status === "Active"}
            >
              Reactive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      {/* Dialogs and Sheets for actions */}
      <EditMemberSheet
        member={member}
        open={isEditDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <AppConfirmationDialog
        open={isDeactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        title="Deactivate Member"
        description={`Are you sure you want to deactivate ${member.name}? This action cannot be undone.`}
        onConfirm={handleDeactivate}
        isPending={isDeactivating}
      />

      <AppConfirmationDialog
        open={isReactivateDialogOpen}
        onOpenChange={setReactivateDialogOpen}
        title="Reactivate Member"
        description={`Are you sure you want to reactivate ${member.name}?`}
        onConfirm={handleReactivate}
        isPending={isReactivating}
      />
    </>
  );
}
