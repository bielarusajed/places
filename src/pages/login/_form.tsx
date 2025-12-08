import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClientProvider, useMutation } from '@tanstack/react-query';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { getQueryClient } from '@/lib/query-client';

const formSchema = z.object({
  email: z.email('Некарэктны email'),
  password: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

function LoginForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationKey: ['login'],
    mutationFn: async (data: FormValues) => {
      const response = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      if (response.error) throw new Error(response.error.message, { cause: response.error });
      return response.data;
    },
    onSuccess: () => {
      window.location.href = '/admin';
    },
    onError: (error) => {
      form.setError('root', { message: error.message });
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    mutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Уваход</CardTitle>
        <CardDescription>Увядзіце вашыя ўліковыя дадзеныя</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@bielarus.live" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-destructive text-sm">{form.formState.errors.root?.message ?? '\u00A0'}</p>
            <Button className="w-full" type="submit">
              Увайсці
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function LoginFormWrapper() {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>
  );
}

export default LoginFormWrapper;
