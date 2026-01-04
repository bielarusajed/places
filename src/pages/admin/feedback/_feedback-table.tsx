import { QueryClientProvider, useMutation } from '@tanstack/react-query';
import { Check, ExternalLink, RotateCcw, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getQueryClient } from '@/lib/query-client';

type FeedbackStatus = 'pending' | 'resolved' | 'dismissed';

type FeedbackItem = {
  id: number;
  message: string;
  status: FeedbackStatus;
  createdAt: Date;
  resolvedAt: Date | null;
  place: {
    id: number;
    name: string;
    region: string;
    district: string | null;
  };
};

const statusLabels: Record<FeedbackStatus, string> = {
  pending: 'Чакае',
  resolved: 'Вырашана',
  dismissed: 'Адхілена',
};

const statusColors: Record<FeedbackStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'default',
  resolved: 'secondary',
  dismissed: 'outline',
};

type StatusFilter = FeedbackStatus | 'all';

const filterTabs: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Усе' },
  { value: 'pending', label: 'Чакаюць' },
  { value: 'resolved', label: 'Вырашаныя' },
  { value: 'dismissed', label: 'Адхіленыя' },
];

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('be-BY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

type FeedbackTableProps = {
  initialData: FeedbackItem[];
  highlightId?: number;
};

function FeedbackTable({ initialData, highlightId }: FeedbackTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(highlightId ? 'all' : 'pending');
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(initialData);

  const filteredList = statusFilter === 'all' ? feedbackList : feedbackList.filter((f) => f.status === statusFilter);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: FeedbackStatus }) => {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update feedback');
      return res.json();
    },
    onSuccess: (_, { id, status }) => {
      setFeedbackList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status, resolvedAt: status !== 'pending' ? new Date() : null } : item,
        ),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete feedback');
      return res.json();
    },
    onSuccess: (_, id) => {
      setFeedbackList((prev) => prev.filter((item) => item.id !== id));
    },
  });

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filterTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      {filteredList.length === 0 ? (
        <div className="text-muted-foreground flex items-center justify-center rounded-lg border border-dashed py-12 text-sm">
          Няма водгукаў
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Населены пункт</TableHead>
                <TableHead>Паведамленне</TableHead>
                <TableHead className="w-[100px]">Статус</TableHead>
                <TableHead className="w-[150px]">Дата</TableHead>
                <TableHead className="w-[150px]">Дзеянні</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((item) => (
                <TableRow key={item.id} className={highlightId === item.id ? 'bg-accent/50' : ''}>
                  <TableCell>
                    <a
                      href={`/${item.place.id}`}
                      className="font-medium hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.place.name}
                      <ExternalLink className="ml-1 inline size-3" />
                    </a>
                    <div className="text-muted-foreground text-xs">
                      {item.place.region}
                      {item.place.district && `, ${item.place.district}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-md text-sm">{item.message}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(item.createdAt)}</div>
                    {item.resolvedAt && (
                      <div className="text-muted-foreground text-xs">Апрацавана: {formatDate(item.resolvedAt)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Пазначыць як вырашанае"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'resolved' })}
                          >
                            <Check className="size-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Адхіліць"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'dismissed' })}
                          >
                            <X className="size-4 text-orange-600" />
                          </Button>
                        </>
                      )}
                      {item.status !== 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Вярнуць у чаканне"
                          disabled={updateStatusMutation.isPending}
                          onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'pending' })}
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Выдаліць"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (confirm('Вы ўпэўненыя, што хочаце выдаліць гэты водгук?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                      >
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function FeedbackTableWrapper(props: FeedbackTableProps) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <FeedbackTable {...props} />
    </QueryClientProvider>
  );
}
