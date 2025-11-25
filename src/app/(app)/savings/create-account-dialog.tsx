"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSavingsAccount } from "@/lib/data-service";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function CreateAccountDialog({ members, trigger }: { members: any[]; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [accountType, setAccountType] = useState("");
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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
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
            <select
              id="accountType"
              value={accountType}
              onChange={e => setAccountType(e.target.value)}
              required
              className="w-full border rounded p-2"
            >
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
