// frontend/src/app/hooks/useLangRouter.ts
'use client';

import { useRouter, useParams } from 'next/navigation';
import { withLng } from '@/utils/withLng';

export function useLangRouter() {
  const router = useRouter();
  const params = useParams() as { lng?: string };
  const lng = params?.lng;

  return {
    push: (path: string, opts?: Parameters<typeof router.push>[1]) =>
      router.push(withLng(lng, path), opts),
    replace: (path: string, opts?: Parameters<typeof router.replace>[1]) =>
      router.replace(withLng(lng, path), opts),
    withLng: (path: string) => withLng(lng, path),
  };
}
