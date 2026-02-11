'use client';

import { Toaster } from 'sonner';
import { ReactNode } from 'react';
import { SWRConfig } from 'swr';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateIfStale: true,
        dedupingInterval: 5000, // 5秒間は同じリクエストを重複させない
      }}
    >
      {children}
      <Toaster
        position="top-center"
        expand={true}
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#f8fafc',
          },
        }}
      />
    </SWRConfig>
  );
}
