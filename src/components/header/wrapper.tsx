import { QueryProvider } from '@/components/providers/query-provider';

import Header from './index';

type Props = {
  variant?: 'centered' | 'top' | 'search';
  regions?: string[];
};

export function HeaderWrapper({ variant, regions = [] }: Props) {
  return (
    <QueryProvider>
      <Header variant={variant} regions={regions} />
    </QueryProvider>
  );
}
