import { QueryProvider } from '@/components/providers/query-provider';

import Header from './index';

type Props = {
  variant?: 'centered' | 'top';
};

export function HeaderWrapper({ variant }: Props) {
  return (
    <QueryProvider>
      <Header variant={variant} />
    </QueryProvider>
  );
}
