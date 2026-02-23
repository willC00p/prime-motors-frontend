import type { UserRole } from '../types/auth';

// Users with access to everything
const FULL_ACCESS_ROLES = ['gm', 'ceo', 'nsm'] as const;

// Users with access to all branches
const ALL_BRANCHES_ACCESS = ['gm', 'ceo', 'nsm', 'purchasing', 'accounting', 'finance', 'audit'] as const;

// Users who can manage accounts
const ACCOUNT_MANAGEMENT_ROLES = ['gm', 'ceo', 'nsm', 'accounting', 'finance'] as const;

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  gm: {
    inventory: true,
    sales: true,
    purchasing: true,
    finance: true,
    management: true,
    reports: true,
    accounts: true,
    allBranches: true,
  },
  ceo: {
    inventory: true,
    sales: true,
    purchasing: true,
    finance: true,
    management: true,
    reports: true,
    accounts: true,
    allBranches: true,
  },
  nsm: {
    inventory: true,
    sales: true,
    purchasing: true,
    finance: true,
    management: true,
    reports: true,
    accounts: true,
    allBranches: true,
  },
  purchasing: {
    inventory: true,
    sales: false,
    purchasing: true,
    finance: false,
    management: false,
    reports: true,
    accounts: false,
    allBranches: true,
  },
  accounting: {
    inventory: true,
    sales: true,
    purchasing: true,
    finance: true,
    management: false,
    reports: true,
    accounts: true,
    allBranches: true,
  },
  finance: {
    inventory: true,
    sales: true,
    purchasing: true,
    finance: true,
    management: false,
    reports: true,
    accounts: true,
    allBranches: true,
  },
  audit: {
    inventory: true,
    sales: true,
    purchasing: true,
    finance: true,
    management: false,
    reports: true,
    accounts: false,
    allBranches: true,
  },
  branch: {
    inventory: true,
    sales: true,
    purchasing: false,
    finance: true, // Allow access to loan payments
    management: false,
    reports: false, // Disable dashboard access
    accounts: false,
    allBranches: false,
  },
} as const;

export const hasFullAccess = (role: UserRole): boolean => {
  return FULL_ACCESS_ROLES.includes(role as any);
};

export const canAccessAllBranches = (role: UserRole): boolean => {
  return ALL_BRANCHES_ACCESS.includes(role as any);
};

export const canManageAccounts = (role: UserRole): boolean => {
  return ACCOUNT_MANAGEMENT_ROLES.includes(role as any);
};

export const hasAccountsAccess = (role: UserRole): boolean => {
  return ROLE_PERMISSIONS[role].accounts;
};

export const hasInventoryAccess = (role: UserRole, userBranchId?: number, itemBranchId?: number): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions.inventory) return false;
  
  if (permissions.allBranches) return true;
  return userBranchId === itemBranchId;
};

export const hasSalesAccess = (role: UserRole, userBranchId?: number, saleBranchId?: number): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions.sales) return false;
  
  if (permissions.allBranches) return true;
  return userBranchId === saleBranchId;
};

export const hasPurchasingAccess = (role: UserRole): boolean => {
  return ROLE_PERMISSIONS[role].purchasing;
};

export const hasFinanceAccess = (role: UserRole): boolean => {
  return ROLE_PERMISSIONS[role].finance;
};

export const hasManagementAccess = (role: UserRole): boolean => {
  return ROLE_PERMISSIONS[role].management;
};

export const hasReportsAccess = (role: UserRole, userBranchId?: number, reportBranchId?: number): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions.reports) return false;
  
  if (permissions.allBranches) return true;
  return userBranchId === reportBranchId;
};
