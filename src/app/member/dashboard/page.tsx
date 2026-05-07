import { redirect } from 'next/navigation';
import { getMemberSession } from '@/lib/member-auth';
import { getMemberById, getMemberAccounts, getMemberLoans, getMemberTransactions, getGroupName } from '@/lib/member-data';
import { MobileShell } from '@/components/member/mobile-shell';

export default async function MemberDashboard() {
  const session = await getMemberSession();
  if (!session) redirect('/member/login');

  const [member, accounts, loans, recentTxns, groupName] = await Promise.all([
    getMemberById(session.memberId),
    getMemberAccounts(session.memberId),
    getMemberLoans(session.memberId),
    getMemberTransactions(session.memberId, undefined, 5),
    getGroupName(session.groupId),
  ]);

  if (!member) redirect('/member/login');

  const totalSavings = accounts.reduce((s, a) => s + a.balance, 0);
  const activeLoan = loans.find((l) => l.status === 'Active');
  const firstName = member.firstName || member.name.split(' ')[0];

  return (
    <MobileShell>
      <div className="min-h-screen bg-[#0d1526]">
        {/* Header card */}
        <div className="px-5 pt-12 pb-8">
          <p className="text-[12px] text-white/40 tracking-wide uppercase mb-1">{groupName}</p>
          <h1 className="text-[22px] font-bold text-white mb-1">Hello, {firstName}</h1>
          <p className="text-[13px] text-white/40">{member.memberCode}</p>

          {/* Balance card */}
          <div className="mt-6 bg-white/8 rounded-2xl p-5 border border-white/8">
            <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">Total Savings</p>
            <p className="text-[32px] font-bold text-white tracking-tight">
              {totalSavings.toLocaleString()}
              <span className="text-[16px] font-normal text-white/40 ml-1">RWF</span>
            </p>
            {activeLoan && (
              <div className="mt-4 pt-4 border-t border-white/8">
                <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">Active Loan Balance</p>
                <p className="text-[18px] font-semibold text-orange-300">
                  {Number(activeLoan.balance).toLocaleString()} RWF
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Rest on light bg */}
        <div className="bg-[#f7f8f9] rounded-t-3xl min-h-screen px-5 pt-6 pb-8">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Accounts</p>
              <p className="text-[22px] font-bold text-[#0d1526]">{accounts.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Loans</p>
              <p className="text-[22px] font-bold text-[#0d1526]">{loans.filter(l => l.status === 'Active').length}</p>
              <p className="text-[10px] text-gray-400">active</p>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-50">
              <h2 className="text-[14px] font-semibold text-[#0d1526]">Recent Activity</h2>
            </div>
            {recentTxns.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] text-gray-400">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentTxns.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                        t.type === 'Deposit' ? 'bg-emerald-50 text-emerald-600'
                        : t.type === 'Withdrawal' ? 'bg-red-50 text-red-500'
                        : 'bg-blue-50 text-blue-600'
                      }`}>
                        {t.type === 'Deposit' ? '↓' : t.type === 'Withdrawal' ? '↑' : '↔'}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#0d1526]">{t.type}</p>
                        <p className="text-[11px] text-gray-400">{String(t.date).slice(0, 10)}</p>
                      </div>
                    </div>
                    <p className={`text-[14px] font-semibold ${
                      t.type === 'Deposit' ? 'text-emerald-600' : 'text-[#0d1526]'
                    }`}>
                      {t.type === 'Deposit' ? '+' : '-'}{Number(t.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
