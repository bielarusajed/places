import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClientProvider, useMutation } from '@tanstack/react-query';
import { Loader2, MessageSquarePlus, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Toaster } from '@/components/ui/sonner';
import { Textarea } from '@/components/ui/textarea';
import { getQueryClient } from '@/lib/query-client';

const feedbackSchema = z.object({
  message: z.string().min(1, 'Паведамленне не можа быць пустым').max(2000, 'Паведамленне занадта доўгае'),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

type FeedbackFormProps = {
  placeId: number;
  placeName: string;
};

function FeedbackForm({ placeId, placeName }: FeedbackFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { message: '' },
  });

  const messageValue = form.watch('message');

  const submitMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, message }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || 'Памылка адпраўкі');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Дзякуй за водгук!', {
        description: 'Мы разгледзім вашае паведамленне.',
      });
      form.reset();
      setIsExpanded(false);
    },
    onError: (error) => {
      toast.error('Памылка адпраўкі водгуку', {
        description: error instanceof Error ? error.message : 'Паспрабуйце пазней',
      });
    },
  });

  const onSubmit = (values: FeedbackFormValues) => {
    submitMutation.mutate(values.message.trim());
  };

  const handleCancel = () => {
    form.reset();
    setIsExpanded(false);
  };

  return (
    <>
      <Toaster position="bottom-center" />

      <section>
        <h2 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
          <MessageSquarePlus className="size-4" />
          Зваротная сувязь
        </h2>

        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-muted-foreground hover:text-foreground hover:border-foreground/30 w-full rounded-lg border border-dashed py-6 text-sm transition-colors"
          >
            Знайшлі памылку ці маеце прапановы?
            <span className="ml-1 underline">Напішыце нам</span>
          </button>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={`Напішыце пра памылку ў даных або прапанову для «${placeName}»…`}
                        className="min-h-[100px] resize-none"
                        maxLength={2000}
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">{messageValue.length}/2000</span>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={submitMutation.isPending}
                  >
                    Скасаваць
                  </Button>
                  <Button type="submit" size="sm" disabled={submitMutation.isPending || !messageValue.trim()}>
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Адпраўляецца…
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Адправіць
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </section>
    </>
  );
}

export default function FeedbackFormWrapper(props: FeedbackFormProps) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <FeedbackForm {...props} />
    </QueryClientProvider>
  );
}
