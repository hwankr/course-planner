import type { QueryClient } from '@tanstack/react-query';

/** Keep response-shape-specific keys separate, while expiring all affected views. */
export function invalidateAdminData(queryClient: QueryClient, resource: 'courses' | 'departments' | 'requirements' | 'patch-notes' | 'users') {
  const keys = {
    courses: ['admin-courses', 'courses', 'admin-stats', 'statistics', 'graduation-requirement'],
    departments: ['admin-departments', 'departments', 'admin-stats', 'statistics'],
    requirements: ['admin-requirements', 'department-requirements', 'graduation-requirement', 'statistics'],
    'patch-notes': ['admin-patch-notes', 'patch-notes', 'patch-note', 'notifications-unread-count', 'notifications'],
    users: ['admin-users', 'admin-stats', 'statistics'],
  }[resource];
  return Promise.all(keys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
}
