'use client';

import { useState, useRef, type KeyboardEvent, type ClipboardEvent } from 'react';
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function PINInput({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  const refs   = useRef<(HTMLInputElement | null)[]>(Array(5).fill(null));
  const digits = Array.from({ length: 5 }, (_, i) => value[i] ?? '');

  const update = (i: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const next = [...digits]; next[i] = char.slice(-1);
    onChange(next.join(''));
    if (char && i < 4) refs.current[i + 1]?.focus();
  };
  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits]; next[i - 1] = '';
      onChange(next.join('')); refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft'  && i > 0) refs.current[i - 1]?.focus();
    else if   (e.key === 'ArrowRight' && i < 4) refs.current[i + 1]?.focus();
  };
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    const next = [...digits]; pasted.split('').forEach((c, i) => { next[i] = c; });
    onChange(next.join('')); refs.current[Math.min(pasted.length, 4)]?.focus();
  };

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }}
          type="password" inputMode="numeric" maxLength={1} value={d} disabled={disabled}
          onChange={(e) => update(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-11 w-9 rounded-lg border-2 text-center text-base font-semibold outline-none transition-colors',
            'bg-background disabled:opacity-40',
            d ? 'border-foreground' : 'border-input hover:border-muted-foreground focus:border-foreground',
          )}
        />
      ))}
    </div>
  );
}

function ShowableInput({ value, onChange, placeholder, disabled, autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  disabled?: boolean; autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="new-password"
        className="pr-9"
      />
      <button type="button" tabIndex={-1} onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export function ChangeCredentialsDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();

  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [newPin,     setNewPin]     = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const reset = () => {
    setCurrentPw(''); setNewPw(''); setConfirmPw(''); setNewPin(''); setError('');
  };

  const handleClose = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPw)                        { setError('Enter your current password.'); return; }
    if (!newPw && !newPin)                 { setError('Enter a new password or a new PIN (or both).'); return; }
    if (newPw && newPw.length < 8)         { setError('New password must be at least 8 characters.'); return; }
    if (newPw && newPw !== confirmPw)      { setError('Passwords do not match.'); return; }
    if (newPin && newPin.length < 5)       { setError('Enter all 5 digits for the new PIN.'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/change-credentials', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          currentPassword: currentPw,
          newPassword:     newPw  || undefined,
          newPin:          newPin || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Credentials updated', description: 'Your changes have been saved.' });
        handleClose(false);
      } else {
        setError(data.message ?? 'Update failed.');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwMismatch = !!confirmPw && newPw !== confirmPw;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Change Password / PIN
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Current password — always required */}
            <div className="grid gap-1.5">
              <Label>Current password</Label>
              <ShowableInput
                value={currentPw} onChange={setCurrentPw}
                placeholder="Your current password" disabled={loading} autoFocus
              />
            </div>

            <hr className="border-border" />

            {/* New password — optional */}
            <div className="grid gap-1.5">
              <Label>New password <span className="text-muted-foreground text-xs">(leave blank to keep)</span></Label>
              <ShowableInput value={newPw} onChange={setNewPw} placeholder="Min. 8 characters" disabled={loading} />
              {newPw && (
                <ShowableInput value={confirmPw} onChange={setConfirmPw} placeholder="Confirm new password" disabled={loading} />
              )}
              {pwMismatch && <p className="text-xs text-destructive">Passwords do not match.</p>}
            </div>

            {/* New PIN — optional */}
            <div className="grid gap-1.5">
              <Label>New PIN <span className="text-muted-foreground text-xs">(leave blank to keep)</span></Label>
              <PINInput value={newPin} onChange={setNewPin} disabled={loading} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading || pwMismatch}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
