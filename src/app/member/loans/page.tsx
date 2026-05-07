import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMemberSession } from '@/lib/member-auth';
import { getMemberLoans } from '@/lib/member-data';
import { MobileShell } from '@/components/member/mobile-shell';

const STATUS_STYLE: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Paid: 'bg-gray-100 text-gray-500',
  Overdue: 'bg-red-50 text-red-600',
  Defaulted: 'bg-red-100 text-red-700',
  Pending: 'bg-yellow-50 text-yellow-700',
};

export default async function MemberLoansPage() {
  const session = await getMemberSession();
  if (!session) redirect('/member/login');

  const loans = await getMemberLoans(session.memberId);

  return (
    <MobileShell>
      <div className="bg-[#0d1526] px-5 pt-12 pb-8">
        <h1 className="text-[22px] font-bold text-white mb-1">Loans</h1>
        <p className="text-[13px] text-white/40">Your loan history</p>
      </div>

      <div className="bg-[#f7f8f9] rounded-t-3xl min-h-screen px-4 pt-5 pb-8">
        {/* Apply button */}
        <Link
          href="/member/loans/apply"
          className="flex items-center justify-center gap-2 w-full bg-[#0d1526] text-white rounded-2xl py-4 text-[14px] font-semibold mb-5 active:opacity-80 transition-opacity"
        >
          <span className="text-[18px]">+</span> Apply for a Loan
        </Link>

        {loans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-[14px] text-gray-400">No loans on record</p>
            <p className="text-[12px] text-gray-300 mt-1">Apply for your first loan above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => (
              <div key={loan.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0d1526]">{loan.loanId}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{String(loan.issueDate).slice(0, 10)} → {String(loan.dueDate).slice(0, 10)}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[loan.status] || 'bg-gray-100 text-gray-500'}`}>
                    {loan.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Principal</p>
                    <p className="text-[13px] font-semibold text-[#0d1526]">{Number(loan.principal).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Balance</p>
                    <p className={`text-[13px] font-semibold ${loan.balance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                      {Number(loan.balance).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Rate</p>
                    <p className="text-[13px] font-semibold text-[#0d1526]">{loan.interestRate}%</p>
                  </div>
                </div>
                {loan.loanPurpose && (
                  <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-50">{loan.loanPurpose}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
