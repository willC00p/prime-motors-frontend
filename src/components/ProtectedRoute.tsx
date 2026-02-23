import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';
import { hasFullAccess, ROLE_PERMISSIONS } from '../utils/roleAccess';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiresAllBranches?: boolean;
  permission?: keyof typeof ROLE_PERMISSIONS[UserRole];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  requiresAllBranches,
  permission
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for specific permission if provided
  if (permission && !ROLE_PERMISSIONS[user.role][permission]) {
    console.log(`Access denied: ${user.role} does not have ${permission} permission`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if role requires all-branches access but user doesn't have it
  if (requiresAllBranches && !ROLE_PERMISSIONS[user.role].allBranches) {
    console.log(`Access denied: ${user.role} does not have all-branches access`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user's role is in allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`Access denied: ${user.role} not in allowed roles:`, allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
