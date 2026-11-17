import { cacheLife } from 'next/cache';

export default async function CopyrightYear() {
  'use cache';
  cacheLife('max');

  return <>{new Date().getFullYear()}</>;
}