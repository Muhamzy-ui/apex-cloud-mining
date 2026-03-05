import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

/**
 * SuperAdminGuard - Strictly blocks non-superadmins
 */
export const SuperAdminGuard = ({ children }) => {
    const { user, isAuthenticated } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!user?.is_superuser) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

/**
 * JuniorAdminGuard - Allows both SuperAdmins and Junior Admins
 */
export const JuniorAdminGuard = ({ children }) => {
    const { user, isAuthenticated } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // user.is_admin is the Junior Admin flag
    if (!user?.is_admin && !user?.is_superuser) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

/**
 * AdminRedirect - Automatically sends admins to their correct dashboard 
 * if they hit the base /dashboard route (optional quality of life)
 */
export const AdminRedirect = ({ children }) => {
    const { user, isAuthenticated } = useAuthStore();

    if (isAuthenticated) {
        if (user?.is_superuser || user?.is_admin) {
            return <Navigate to="/admin/overview" replace />;
        }
    }

    return children;
};
