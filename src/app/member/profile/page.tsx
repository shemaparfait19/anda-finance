import { redirect } from 'next/navigation';
import { getMemberSession } from '@/lib/member-auth';
import { getMemberById, getGroupName } from '@/lib/member-data';
import { MobileShell } from '@/components/member/mobile-shell';
import { MemberProfileClient } from './profile-client';

export default async function MemberProfilePage() {
  const session = await getMemberSession();
  if (!session) redirect('/member/login');

  const [member, groupName] = await Promise.all([
    getMemberById(session.memberId),
    getGroupName(session.groupId),
  ]);

  if (!member) redirect('/member/login');

  return (
    <MobileShell>
      <div className="bg-[#0d1526] px-5 pt-12 pb-8">
        <h1 className="text-[22px] font-bold text-white mb-1">Profile</h1>
        <p className="text-[13px] text-white/40">{groupName}</p>
      </div>

      <div className="bg-[#f7f8f9] rounded-t-3xl min-h-screen px-4 pt-6 pb-8">
        {/* Avatar + Name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-[#0d1526] flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">
              {member.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#0d1526]">{member.name}</h2>
            <p className="text-[13px] text-gray-400">{member.memberCode}</p>
            <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
              member.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>{member.status}</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <InfoCard title="Personal Information" items={[
            ['Full Name', member.name],
            ['Gender', member.gender ?? '—'],
            ['Date of Birth', member.dateOfBirth ? String(member.dateOfBirth).slice(0, 10) : '—'],
            ['National ID', member.nationalId ?? '—'],
          ]} />
          <InfoCard title="Contact" items={[
            ['Phone', member.phoneNumber],
            ['Email', member.email ?? '—'],
          ]} />
          {(member.province || member.district) && (
            <InfoCard title="Location" items={[
              ['Province', member.province ?? '—'],
              ['District', member.district ?? '—'],
            ]} />
          )}
          <InfoCard title="Membership" items={[
            ['Member ID', member.memberCode],
            ['Joined', member.joinDate ? String(member.joinDate).slice(0, 10) : '—'],
            ['Monthly Contribution', member.monthlyContribution ? `${Number(member.monthlyContribution).toLocaleString()} RWF` : '—'],
            ['Shares', member.numberOfShares ? `${member.numberOfShares} × ${Number(member.shareAmount ?? 0).toLocaleString()} RWF` : '—'],
          ]} />
          {(member.nextOfKinName) && (
            <InfoCard title="Next of Kin" items={[
              ['Name', member.nextOfKinName ?? '—'],
              ['Phone', member.nextOfKinPhone ?? '—'],
              ['Relationship', member.nextOfKinRelationship ?? '—'],
            ]} />
          )}
        </div>

        <MemberProfileClient />
      </div>
    </MobileShell>
  );
}

function InfoCard({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between items-start px-4 py-3">
            <p className="text-[13px] text-gray-400">{k}</p>
            <p className="text-[13px] font-medium text-[#0d1526] text-right max-w-[180px]">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
