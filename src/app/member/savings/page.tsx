import { redirect } from 'next/navigation';
import { getMemberSession } from '@/lib/member-auth';
import { getMemberAccounts, getMemberTransactions } from '@/lib/member-data';
import { MobileShell } from '@/components/member/mobile-shell';

export default async function MemberSavingsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const session = await getMemberSession();
  if (!session) redirect('/member/login');

  const { account: selectedAccount } = await searchParams;

  const [accounts, transactions] = await Promise.all([
    getMemberAccounts(session.memberId),
    getMemberTransactions(session.memberId, selectedAccount, 50),
  ]);

  const active = accounts.find((a) => a.accountNumber === selectedAccount) ?? accounts[0];

  return (
    <MobileShell>
      <div className="bg-[#0d1526] px-5 pt-12 pb-8">
        <h1 className="text-[22px] font-bold text-white mb-1">Savings</h1>
        <p className="text-[13px] text-white/40">Your accounts &amp; statements</p>
      </div>

      <div className="bg-[#f7f8f9] rounded-t-3xl min-h-screen px-4 pt-5 pb-8">
        {/* Account selector */}
        {accounts.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-none">
            {accounts.map((a) => (
              <a
                key={a.accountNumber}
                href={`/member/savings?account=${a.accountNumber}`}
                className={`flex-shrink-0 rounded-xl px-4 py-2 text-[12px] font-medium border transition-colors ${
                  active?.accountNumber === a.accountNumber
                    ? 'bg-[#0d1526] text-white border-[#0d1526]'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {a.accountName || a.accountNumber} · {Number(a.balance).toLocaleString()} RWF
              </a>
            ))}
          </div>
        )}

        {/* Balance card for selected account */}
        {active && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-5">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
              {active.accountName || active.type} — {active.accountNumber}
            </p>
            <p className="text-[28px] font-bold text-[#0d1526]">
              {Number(active.balance).toLocaleString()}
              <span className="text-[14px] font-normal text-gray-400 ml-1">RWF</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Opened {String(active.openDate).slice(0, 10)}</p>
          </div>
        )}

        {/* Transaction list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-50">
            <h2 className="text-[14px] font-semibold text-[#0d1526]">
              Statement {active ? `— ${active.accountNumber}` : ''}
            </h2>
          </div>
          {transactions.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[13px] text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-start justify-between px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0 ${
                      t.type === 'Deposit' ? 'bg-emerald-50 text-emerald-600'
                      : t.type === 'Withdrawal' ? 'bg-red-50 text-red-500'
                      : 'bg-blue-50 text-blue-600'
                    }`}>
                      {t.type === 'Deposit' ? '↓' : t.type === 'Withdrawal' ? '↑' : '↔'}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#0d1526]">{t.type}</p>
                      {t.reason && (
                        <p className="text-[11px] text-gray-400 mt-0.5 max-w-[180px] truncate">{t.reason}</p>
                      )}
                      <p className="text-[11px] text-gray-400">{String(t.date).slice(0, 10)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[14px] font-semibold ${
                      t.type === 'Deposit' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {t.type === 'Deposit' ? '+' : '-'}{Number(t.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">RWF</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
