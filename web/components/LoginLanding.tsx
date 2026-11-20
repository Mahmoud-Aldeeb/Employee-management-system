import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import AuthRedirect from './AuthRedirect';
import CopyrightYear from './CopyrightYear';
import DemoLogin from './DemoLogin';
import LoginLeftSide from './LoginLeftSide';

const portals = [
  { href: '/login/admin', title: 'Admin Portal' },
  { href: '/login/employee', title: 'Employee Portal' },
];

export default function LoginLanding() {
  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      <LoginLeftSide />
      <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-y-auto p-6 sm:p-12 md:w-1/2 lg:p-16">
        <div className="relative z-10 w-full max-w-md animate-fade-in">
          <div className="mb-10 text-center md:text-left">
            <h1 className="mb-3 text-3xl font-medium leading-9 tracking-tight text-slate-900">
              Welcome Back
            </h1>
            <p className="text-slate-500">Select your portal to securely access the system.</p>
          </div>

          <div className="space-y-4">
            {portals.map((portal) => (
              <Link
                key={portal.href}
                href={portal.href}
                className="group block rounded-lg border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50 sm:p-6"
              >
                <div className="relative z-10 flex items-center justify-between gap-4 sm:gap-5">
                  <h3 className="mb-1 text-lg text-slate-800 transition-colors group-hover:text-indigo-600">
                    {portal.title}
                  </h3>
                  <ArrowRightIcon className="size-4 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-indigo-600" />
                </div>
              </Link>
            ))}
          </div>

          <Suspense fallback={null}>
            <DemoLogin />
          </Suspense>

          <div className="mt-12 text-center text-sm text-slate-400 md:text-left">
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