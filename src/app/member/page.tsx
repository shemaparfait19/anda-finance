import { redirect } from 'next/navigation';
import { getMemberSession } from '@/lib/member-auth';

export default async function MemberRoot() {
  const session = await getMemberSession();
  if (session) redirect('/member/dashboard');
  redirect('/member/login');
}
