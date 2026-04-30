"use client";

import { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Columns,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditRow {
  id: string;
  timestamp: string | Date;
  user: { name: string; avatarId: string };
  action: string;
  details: string;
  groupName: string;
}

interface TxnRow {
  id: string;
  member: { name: string; avatarId: string };
  type: string;
  amount: number;
  date: string;
  status: string;
  reason?: string;
  groupName: string;
}

interface LogsTableProps {
  auditLogs: AuditRow[];
  transactions: TxnRow[];
  groups: { id: string; name: string }[];
}

type SortDir = "asc" | "desc";
type SortState = { col: string; dir: SortDir };

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50, 100];

const AUDIT_COLS = [
  { key: "timestamp", label: "TIMESTAMP" },
  { key: "user",      label: "USER" },
  { key: "group",     label: "GROUP" },
  { key: "action",    label: "ACTION" },
  { key: "details",   label: "DETAILS" },
] as const;

const TXN_COLS = [
  { key: "date",   label: "DATE" },
  { key: "member", label: "MEMBER" },
  { key: "group",  label: "GROUP" },
  { key: "type",   label: "TYPE" },
  { key: "amount", label: "AMOUNT" },
  { key: "reason", label: "REASON" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTs(ts: string | Date) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nextSort(col: string, current: SortState): SortState {
  if (current.col !== col) return { col, dir: "asc" };
  if (current.dir === "asc") return { col, dir: "desc" };
  return { col: "timestamp", dir: "desc" };
}

function SortIcon({ col, sort }: { col: string; sort: SortState }) {
  if (sort.col !== col)
    return <ChevronsUpDown className="h-3 w-3 opacity-35 shrink-0" />;
  if (sort.dir === "asc")
    return <ChevronUp className="h-3 w-3 shrink-0" />;
  return <ChevronDown className="h-3 w-3 shrink-0" />;
}

function Th({
  colKey,
  label,
  sort,
  onSort,
  visible,
  className = "",
}: {
  colKey: string;
  label: string;
  sort: SortState;
  onSort: (col: string) => void;
  visible: boolean;
  className?: string;
}) {
  if (!visible) return null;
  return (
    <th
      className={`px-4 py-3 text-left text-[10px] font-bold tracking-widest text-muted-foreground uppercase cursor-pointer select-none whitespace-nowrap ${className}`}
      onClick={() => onSort(colKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon col={colKey} sort={sort} />
      </span>
    </th>
  );
}

const TXN_TYPE_STYLE: Record<string, string> = {
  Deposit:           "text-emerald-700 bg-emerald-50 border-emerald-200",
  Withdrawal:        "text-red-600 bg-red-50 border-red-200",
  "Loan Disbursement": "text-blue-600 bg-blue-50 border-blue-200",
  "Loan Repayment":  "text-violet-600 bg-violet-50 border-violet-200",
};

// ─── Sub-tables ──────────────────────────────────────────────────────────────

function AuditTable({
  rows,
  visible,
  sort,
  onSort,
}: {
  rows: AuditRow[];
  visible: Set<string>;
  sort: SortState;
  onSort: (col: string) => void;
}) {
  return (
    <div className="border rounded-md overflow-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-muted/40 border-b">
          <tr>
            {AUDIT_COLS.map((c) => (
              <Th
                key={c.key}
                colKey={c.key}
                label={c.label}
                sort={sort}
                onSort={onSort}
                visible={visible.has(c.key)}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={AUDIT_COLS.length}
                className="py-14 text-center text-sm text-muted-foreground"
              >
                No audit logs found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b last:border-0 hover:bg-muted/25 transition-colors"
              >
                {visible.has("timestamp") && (
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                    {formatTs(row.timestamp)}
                  </td>
                )}
                {visible.has("user") && (
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {row.user.name}
                  </td>
                )}
                {visible.has("group") && (
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs font-normal">
                      {row.groupName}
                    </Badge>
                  </td>
                )}
                {visible.has("action") && (
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      {row.action}
                    </span>
                  </td>
                )}
                {visible.has("details") && (
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-sm truncate">
                    {row.details || "—"}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TxnTable({
  rows,
  visible,
  sort,
  onSort,
}: {
  rows: TxnRow[];
  visible: Set<string>;
  sort: SortState;
  onSort: (col: string) => void;
}) {
  return (
    <div className="border rounded-md overflow-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-muted/40 border-b">
          <tr>
            {TXN_COLS.map((c) => (
              <Th
                key={c.key}
                colKey={c.key}
                label={c.label}
                sort={sort}
                onSort={onSort}
                visible={visible.has(c.key)}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={TXN_COLS.length}
                className="py-14 text-center text-sm text-muted-foreground"
              >
                No transactions found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b last:border-0 hover:bg-muted/25 transition-colors"
              >
                {visible.has("date") && (
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                    {row.date}
                  </td>
                )}
                {visible.has("member") && (
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {row.member.name}
                  </td>
                )}
                {visible.has("group") && (
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs font-normal">
                      {row.groupName}
                    </Badge>
                  </td>
                )}
                {visible.has("type") && (
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${
                        TXN_TYPE_STYLE[row.type] ??
                        "bg-muted text-foreground border-border"
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                )}
                {visible.has("amount") && (
                  <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">
                    RWF {row.amount.toLocaleString()}
                  </td>
                )}
                {visible.has("reason") && (
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {row.reason || "—"}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  pageSize,
  totalItems,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  totalItems: number;
  onPage: (p: number) => void;
}) {
  const [jump, setJump] = useState("");

  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(total - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < total - 2) pages.push("…");
    pages.push(total);
  }

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-xs text-muted-foreground">
        {totalItems === 0 ? "No results" : `${from}–${to} of ${totalItems}`}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ell-${i}`}
              className="px-1 text-xs text-muted-foreground"
            >
              ···
            </span>
          ) : (
            <Button
              key={p}
              variant={page === p ? "default" : "outline"}
              size="sm"
              className="h-7 w-7 text-xs p-0"
              onClick={() => onPage(p as number)}
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={page >= total}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        <span className="ml-3 text-xs text-muted-foreground">Go to page</span>
        <Input
          value={jump}
          onChange={(e) => setJump(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const n = parseInt(jump);
            if (!isNaN(n) && n >= 1 && n <= total) {
              onPage(n);
              setJump("");
            }
          }}
          className="h-7 w-12 text-xs text-center px-1"
          placeholder={String(page)}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LogsTable({
  auditLogs,
  transactions,
  groups,
}: LogsTableProps) {
  const [tab, setTab] = useState<"audit" | "transactions">("audit");
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const [auditSort, setAuditSort] = useState<SortState>({
    col: "timestamp",
    dir: "desc",
  });
  const [txnSort, setTxnSort] = useState<SortState>({
    col: "date",
    dir: "desc",
  });

  const allAuditKeys = new Set(AUDIT_COLS.map((c) => c.key));
  const allTxnKeys = new Set(TXN_COLS.map((c) => c.key));
  const [visAudit, setVisAudit] = useState<Set<string>>(allAuditKeys);
  const [visTxn, setVisTxn] = useState<Set<string>>(allTxnKeys);

  const resetPage = () => setPage(1);

  const txnTypes = useMemo(
    () => [...new Set(transactions.map((t) => t.type))],
    [transactions]
  );

  // Filtered + sorted audit logs
  const filteredAudit = useMemo(() => {
    let rows = auditLogs;
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.user.name.toLowerCase().includes(q) ||
          r.action.toLowerCase().includes(q) ||
          (r.details ?? "").toLowerCase().includes(q) ||
          r.groupName.toLowerCase().includes(q)
      );
    }
    if (groupFilter !== "all")
      rows = rows.filter((r) => r.groupName === groupFilter);
    if (dateFrom)
      rows = rows.filter((r) => new Date(r.timestamp) >= new Date(dateFrom));
    if (dateTo)
      rows = rows.filter(
        (r) => new Date(r.timestamp) <= new Date(dateTo + "T23:59:59")
      );

    if (auditSort.col) {
      rows = [...rows].sort((a, b) => {
        let av: any, bv: any;
        if (auditSort.col === "timestamp") {
          av = new Date(a.timestamp).getTime();
          bv = new Date(b.timestamp).getTime();
        } else if (auditSort.col === "user") {
          av = a.user.name;
          bv = b.user.name;
        } else if (auditSort.col === "group") {
          av = a.groupName;
          bv = b.groupName;
        } else if (auditSort.col === "action") {
          av = a.action;
          bv = b.action;
        } else return 0;
        if (av < bv) return auditSort.dir === "asc" ? -1 : 1;
        if (av > bv) return auditSort.dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [auditLogs, query, groupFilter, dateFrom, dateTo, auditSort]);

  // Filtered + sorted transactions
  const filteredTxns = useMemo(() => {
    let rows = transactions;
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.member.name.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          (r.reason ?? "").toLowerCase().includes(q) ||
          r.groupName.toLowerCase().includes(q)
      );
    }
    if (groupFilter !== "all")
      rows = rows.filter((r) => r.groupName === groupFilter);
    if (typeFilter !== "all") rows = rows.filter((r) => r.type === typeFilter);
    if (dateFrom) rows = rows.filter((r) => r.date >= dateFrom);
    if (dateTo) rows = rows.filter((r) => r.date <= dateTo);

    if (txnSort.col) {
      rows = [...rows].sort((a, b) => {
        let av: any, bv: any;
        if (txnSort.col === "date") { av = a.date; bv = b.date; }
        else if (txnSort.col === "member") { av = a.member.name; bv = b.member.name; }
        else if (txnSort.col === "group") { av = a.groupName; bv = b.groupName; }
        else if (txnSort.col === "type") { av = a.type; bv = b.type; }
        else if (txnSort.col === "amount") { av = a.amount; bv = b.amount; }
        else return 0;
        if (av < bv) return txnSort.dir === "asc" ? -1 : 1;
        if (av > bv) return txnSort.dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [transactions, query, groupFilter, typeFilter, dateFrom, dateTo, txnSort]);

  // Both TabsContent panels stay mounted (Radix hides via CSS), so each table
  // must always receive its own typed rows — never share pagedRows between them.
  const pagedAuditRows = filteredAudit.slice((page - 1) * pageSize, page * pageSize);
  const pagedTxnRows   = filteredTxns.slice((page - 1) * pageSize, page * pageSize);

  const activeRows = tab === "audit" ? filteredAudit : filteredTxns;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));

  const handleSort = (col: string) => {
    if (tab === "audit") setAuditSort((s) => nextSort(col, s));
    else setTxnSort((s) => nextSort(col, s));
    resetPage();
  };

  const visibleCols = tab === "audit" ? visAudit : visTxn;
  const columns = tab === "audit" ? AUDIT_COLS : TXN_COLS;

  const toggleCol = (key: string, checked: boolean) => {
    const setter = tab === "audit" ? setVisAudit : setVisTxn;
    setter((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const hasFilters = query || groupFilter !== "all" || typeFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setQuery("");
    setGroupFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    resetPage();
  };

  return (
    <div>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "audit" | "transactions");
          resetPage();
        }}
      >
        {/* ── Tab bar + right controls in one row ── */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <TabsList className="h-9">
            <TabsTrigger value="audit" className="gap-1.5 px-3">
              Audit Logs
              <span className="inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-semibold w-5 h-5 shrink-0">
                {auditLogs.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-1.5 px-3">
              Transactions
              <span className="inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-semibold w-5 h-5 shrink-0">
                {transactions.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1" />

          {/* Rows per page */}
          <Select
            value={String(pageSize)}
            onValueChange={(v) => { setPageSize(Number(v)); resetPage(); }}
          >
            <SelectTrigger className="h-8 text-xs w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">
                  Show {n} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Manage columns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Columns className="h-3.5 w-3.5" />
                Manage Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={visibleCols.has(c.key)}
                  onCheckedChange={(v) => toggleCol(c.key, v)}
                  className="text-xs"
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Filter row ── */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {/* Search */}
          <div className="relative w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); resetPage(); }}
              placeholder="Search…"
              className="pl-8 h-8 text-sm w-full"
            />
          </div>

          {/* Date range — single bordered pill */}
          <div className="flex items-center gap-1 border rounded-md px-2 h-8 bg-background text-sm">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
              className="border-none outline-none bg-transparent text-xs w-[112px] text-foreground"
            />
            <span className="text-muted-foreground text-xs px-0.5">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
              className="border-none outline-none bg-transparent text-xs w-[112px] text-foreground"
            />
          </div>

          {/* Group filter */}
          <Select
            value={groupFilter}
            onValueChange={(v) => { setGroupFilter(v); resetPage(); }}
          >
            <SelectTrigger className="h-8 text-xs w-[140px]">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Groups</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.name} className="text-xs">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type filter — transactions only */}
          {tab === "transactions" && (
            <Select
              value={typeFilter}
              onValueChange={(v) => { setTypeFilter(v); resetPage(); }}
            >
              <SelectTrigger className="h-8 text-xs w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                {txnTypes.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-muted-foreground text-xs px-2"
              onClick={clearFilters}
            >
              <X className="h-3 w-3" /> Clear filters
            </Button>
          )}
        </div>

        {/* Tables — each tab gets its own typed rows */}
        <TabsContent value="audit" className="mt-0">
          <AuditTable
            rows={pagedAuditRows}
            visible={visAudit}
            sort={auditSort}
            onSort={handleSort}
          />
        </TabsContent>
        <TabsContent value="transactions" className="mt-0">
          <TxnTable
            rows={pagedTxnRows}
            visible={visTxn}
            sort={txnSort}
            onSort={handleSort}
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      <Pagination
        page={page}
        total={totalPages}
        pageSize={pageSize}
        totalItems={activeRows.length}
        onPage={(p) => setPage(p)}
      />
    </div>
  );
}
