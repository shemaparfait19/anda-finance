import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-amber-500',
  'bg-cyan-500',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface MemberAvatarProps {
  name: string;
  className?: string;
}

export function MemberAvatar({ name, className }: MemberAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarFallback className={cn('text-white font-semibold', avatarColor(name))}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
