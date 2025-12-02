"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSavingsAccount } from "@/lib/data-service";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function CreateAccountDialog({ members, trigger }: { members: any[]; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [accountType, setAccountType] = useState<"Voluntary" | "Internal" | "">("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setAccountType("");
      setSelectedMemberId("");
      setAccountName("");
      setIsLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!accountType) {
        throw new Error("Please select an account type");
      }
      if (!accountName) {
        throw new Error("Please enter an account name");
      }
      if (accountType === "Voluntary" && !selectedMemberId) {
        throw new Error("Please select a member for Voluntary account");
      }

      // Create account
      // For Internal accounts, pass null for memberId
      const memberId = accountType === "Internal" ? null : selectedMemberId;
      
      await createSavingsAccount(memberId, accountType, accountName);

      toast({
        title: "Success",
        description: `${accountType} account created successfully`,
      });

      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="accountType">Account Type</Label>
            <Select value={accountType} onValueChange={(value: "Voluntary" | "Internal") => setAccountType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Voluntary">Voluntary</SelectItem>
                <SelectItem value="Internal">Internal Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {accountType === "Voluntary" && (
            <div>
              <Label htmlFor="memberId">Member</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.memberId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="e.g. School Fees, Emergency Fund"
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
