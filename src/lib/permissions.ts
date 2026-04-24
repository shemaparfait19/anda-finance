import type { UserRole } from '@/lib/types';

// Actions that always require an approval when initiated by a Maker or Checker
export const CONTROLLED_ACTIONS = {
  ADMIN_USER_CREATE:       'ADMIN_USER_CREATE',
  ADMIN_USER_UPDATE:       'ADMIN_USER_UPDATE',
  ADMIN_USER_DELETE:       'ADMIN_USER_DELETE',
  MEMBER_CREATE:           'MEMBER_CREATE',
  MEMBER_DELETE:           'MEMBER_DELETE',
  MEMBER_UPDATE:           'MEMBER_UPDATE',
  MEMBER_SECOND_ACCOUNT:   'MEMBER_SECOND_ACCOUNT',
  MEMBER_ACCOUNT_UPDATE:   'MEMBER_ACCOUNT_UPDATE',
  CASH_WITHDRAWAL:         'CASH_WITHDRAWAL',
  LOAN_APPROVAL:           'LOAN_APPROVAL',
  INTERNAL_ACCOUNT_CREATE: 'INTERNAL_ACCOUNT_CREATE',
} as const;

export type ControlledAction = keyof typeof CONTROLLED_ACTIONS;

/** Human-readable label for each action type */
export const ACTION_LABELS: Record<string, string> = {
  ADMIN_USER_CREATE:       'Admin User Creation',
  ADMIN_USER_UPDATE:       'Admin User Update',
  ADMIN_USER_DELETE:       'Admin User Deletion',
  MEMBER_CREATE:           'Member Registration',
  MEMBER_DELETE:           'Member Deletion',
  MEMBER_UPDATE:           'Member Update',
  MEMBER_SECOND_ACCOUNT:   'Member 2nd Account Creation',
  MEMBER_ACCOUNT_UPDATE:   'Member Account Status Change',
  CASH_WITHDRAWAL:         'Cash Withdrawal',
  LOAN_APPROVAL:           'Loan Approval / Disbursement',
  INTERNAL_ACCOUNT_CREATE: 'Internal Account Creation',
};

/** Returns true when the given role must send this action through the approval queue */
export function requiresApproval(role: UserRole, actionType: string): boolean {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN_FULL') return false;
  const controlled = Object.values(CONTROLLED_ACTIONS) as string[];
  return controlled.includes(actionType);
}

/** Returns true when the user can approve / reject pending actions */
export function canApprove(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN_FULL' || role === 'ADMIN_CHECKER';
}

/** Returns true when the user can access the given top-level section */
export function canAccess(role: UserRole, section: string): boolean {
  if (role === 'IT_ADMIN') {
    return ['admin', 'audit'].includes(section.toLowerCase());
  }
  return true;
}

/** Badge variant colour for each role */
export function roleBadgeVariant(role: UserRole): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (role) {
    case 'SUPER_ADMIN':    return 'default';
    case 'ADMIN_FULL':     return 'default';
    case 'ADMIN_MAKER':    return 'secondary';
    case 'ADMIN_CHECKER':  return 'secondary';
    case 'IT_ADMIN':       return 'outline';
    default:               return 'outline';
  }
}

/** Human-readable label for each role */
export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':    return 'Super Admin';
    case 'ADMIN_FULL':     return 'Full Admin';
    case 'ADMIN_MAKER':    return 'Maker';
    case 'ADMIN_CHECKER':  return 'Checker';
    case 'IT_ADMIN':       return 'IT Admin';
    default:               return role;
  }
}
