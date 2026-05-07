'use client';

import { useRouter } from 'next/navigation';

export function MemberProfileClient() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/member/logout', { method: 'POST' });
    localStorage.removeItem('af_member_group');
    localStorage.removeItem('af_member_email');
    router.replace('/member/login');
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleLogout}
        className="w-full bg-white border border-red-100 text-red-500 rounded-2xl py-4 text-[14px] font-semibold active:opacity-80 transition-opacity"
      >
        Sign Out
      </button>
    </div>
  );
}
