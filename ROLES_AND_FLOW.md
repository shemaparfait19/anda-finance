# ANDA Finance — Roles, Groups & Flow

## The Story: How the System Works

### Part 1 — The Big Picture (Multi-Tenancy)

ANDA Finance is a **SaaS platform** — one running system that serves many independent cooperatives at the same time. Each cooperative is called a **Group** (also known as a client or tenant).

Think of it like an apartment building:
- The building owner (SUPER_ADMIN) owns and manages the whole building.
- Each apartment (Group) belongs to a different cooperative.
- Residents of one apartment can't enter another apartment — their data is walled off.

Every record in the database (members, transactions, loans, savings, etc.) carries a `group_id` column that stamps it: *"this belongs to cooperative X."* When any staff member queries data, the system automatically appends `WHERE group_id = '<their group>'` behind the scenes, so they only ever see their own cooperative's data.

---

### Part 2 — The Roles (Who Is Who)

There are **6 roles** in the system. Think of them in two tiers:

#### Tier 1 — Platform Level (owns the system, no cooperative data)

| Role | Who They Are | What They See |
|------|-------------|---------------|
| `SUPER_ADMIN` | The system owner (you, the developer/company) | Groups tab, All Users tab, System Settings. ZERO cooperative data (no members, loans, savings). |
| `IT_ADMIN` | Technical support staff | Settings page only. No member data. |

> **Key rule:** SUPER_ADMIN has `group_id = NULL` in the database. Because SQL's `= NULL` never matches anything, they see **zero rows** from every data table automatically — no special code needed.

#### Tier 2 — Cooperative Level (works inside one cooperative)

| Role | Who They Are | What They Can Do |
|------|-------------|-----------------|
| `ADMIN_FULL` | The cooperative manager / full admin | Everything: members, savings, loans, reports, user management, approvals, settings (including clear data) |
| `ADMIN_MAKER` | A teller or data-entry clerk | Can submit transactions and member changes — but they go into a queue, waiting for a Checker to approve |
| `ADMIN_CHECKER` | An approver / senior clerk | Reviews and approves or rejects what the Maker submitted. Also has SMS reminders and settings access |
| `IT_ADMIN` | IT support assigned to this cooperative | Settings only |

---

### Part 3 — The Maker / Checker Workflow (4-Eyes Principle)

For sensitive operations like cash withdrawals, a cooperative can require **two-person approval**:

1. **Maker** (e.g., a teller) submits a withdrawal request. It doesn't execute immediately — it lands in the `pending_actions` table with status `pending`.
2. **Checker** (e.g., a supervisor) logs in, sees the queue, and either:
   - **Approves** → if the required number of approvals is reached (configurable: 1 or 2 checkers), the action executes automatically.
   - **Rejects** → the action is marked rejected and nothing happens.

The Maker can see the status of their own submissions. The Checker sees everything pending in their cooperative.

This workflow currently covers:
- Cash withdrawals
- Creating internal savings accounts
- Opening a second savings account for a member

---

### Part 4 — The Group Lifecycle (How a New Cooperative Gets Set Up)

```
SUPER_ADMIN logs in
       ↓
Admin → Groups tab → "Create Group"
  → Fills in: Group ID (e.g. coop-kigali-01), Name, Code
  → Group is saved in the `groups` table
       ↓
Admin → All Users tab → "Add User"
  → Fills in: Name, Email, Role (ADMIN_FULL / MAKER / CHECKER / IT_ADMIN)
  → Assigns to the new group via the Group dropdown
  → User created in `users` table with group_id = 'coop-kigali-01'
       ↓
That user receives an OTP via email and logs in
  → They now see the full cooperative UI
  → All their data queries are automatically scoped to their group
```

---

### Part 5 — Login Flow (OTP-Based, No Passwords)

```
User visits /login
  → Enters their email
  → System looks up the email in users table
  → Generates a 6-digit OTP, stores it in otp_codes table (expires in 5 min)
  → Emails the OTP to the user
       ↓
User enters the OTP
  → System validates: correct email, correct code, not expired, not already used
  → Creates a session JWT containing: id, name, email, role, approvalsRequired, groupId
       ↓
User is redirected based on role:
  → SUPER_ADMIN / IT_ADMIN → /admin (platform control panel)
  → Everyone else → / (cooperative dashboard)
```

---

### Part 6 — What Each Role Sees in the Sidebar

| Role | Sidebar Links |
|------|--------------|
| `SUPER_ADMIN` | Control Panel (→ /admin) |
| `IT_ADMIN` | Settings (→ /admin) |
| `ADMIN_FULL`, `ADMIN_MAKER`, `ADMIN_CHECKER` | Dashboard, Members, Savings, Loans, Investments, Accounting, Reports, Payments, Admin, Audit |

---

### Part 7 — Data Isolation (Technical Summary)

Every data-fetching function in `src/lib/data-service.ts` calls `auth()` internally to get the current user's `group_id`. This means:

- No call site needs to pass a group ID — isolation is transparent.
- A developer adding a new data function just needs to follow the pattern: `WHERE group_id = ${groupId}`.
- SUPER_ADMIN (groupId = null) → `WHERE group_id = NULL` → 0 rows → no cooperative data visible.
- A cooperative user (groupId = 'coop-kigali-01') → sees only their cooperative's data.

The `groups` table is the **tenant registry**: every cooperative that uses the system has a row there, and every user + data row references it via `group_id`.

---

### Summary Table

| Who | group_id | Sees data? | Creates data? | Approves? | Manages users? | Manages groups? |
|-----|----------|-----------|--------------|-----------|----------------|----------------|
| SUPER_ADMIN | NULL | ❌ Never | ❌ | ❌ | ✅ (all users) | ✅ |
| IT_ADMIN | NULL | ❌ | ❌ | ❌ | ❌ | ❌ |
| ADMIN_FULL | their group | ✅ | ✅ | ✅ | ✅ (their group) | ❌ |
| ADMIN_MAKER | their group | ✅ | ✅ (pending) | ❌ | ❌ | ❌ |
| ADMIN_CHECKER | their group | ✅ | ❌ | ✅ | ❌ | ❌ |
