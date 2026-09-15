'use client';

import * as React from 'react';

interface RBACProps {
  children: React.ReactNode;
  userRole: string; // 'admin' | 'member' | 'owner'
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export const RBAC = ({ children, userRole, allowedRoles, fallback = null }: RBACProps) => {
  if (allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};
