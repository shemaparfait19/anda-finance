"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewVoluntaryAccountDialog({ members, trigger }: { members: any[]; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Call API to create voluntary account
    setTimeout(() => {
      setIsLoading(false);
      setOpen(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Sub Account (Voluntary Saving Account)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="member">Member</Label>
            <select
              id="member"
              value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}
              required
              className="w-full border rounded p-2"
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option value={m.id} key={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="e.g. School Fees, Project Savings"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Sub Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
