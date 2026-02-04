'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

const navigation = [
  { name: '대시보드', href: '/dashboard' },
  { name: '수강 계획', href: '/planner' },
  { name: '졸업 요건', href: '/requirements' },
  { name: '프로필', href: '/profile' },
];

const adminNavigation = [{ name: '관리자', href: '/admin' }];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                Course Planner
              </Link>
              <nav className="hidden md:flex gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                {isAdmin &&
                  adminNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        pathname.startsWith(item.href)
                          ? 'bg-purple-50 text-purple-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
