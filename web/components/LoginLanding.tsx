import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import AuthRedirect from './AuthRedirect';
import CopyrightYear from './CopyrightYear';
import LoginLeftSide from './LoginLeftSide';

const portals = [
  { href: '/login/admin', title: 'Admin Portal' },
  { href: '/login/employee', title: 'Employee Portal' },
];

export default function LoginLanding() {
  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      <LoginLeftSide />
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 relative overflow-y-auto min-h-dvh">
        <div className="w-full max-w-md animate-fade-in relative z-10">
          <div className="mb-10 text-center md:text-left">
            <h1 className="font-medium text-3xl text-slate-900 tracking-tight mb-3 leading-9">
              Welcome Back
            </h1>
            <p className="text-slate-500">
              Select your portal to securely access the system.
            </p>
          </div>

          <div className="space-y-4">
            {portals.map((portal) => (
              <Link
                key={portal.href}
                href={portal.href}
                className="group block bg-slate-50 border border-slate-200 rounded-lg p-5 sm:p-6 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50"
              >
                <div className="relative z-10 flex items-center justify-between gap-4 sm:gap-5">
                  <h3 className="text-lg text-slate-800 group-hover:text-indigo-600 mb-1 transition-colors">
                    {portal.title}
                  </h3>
                  <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center md:text-left text-sm text-slate-400">
            <p>
              © <CopyrightYear /> Aldeeb. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      <Suspense fallback={null}>
        <AuthRedirect />
      </Suspense>
    </div>
  );
}