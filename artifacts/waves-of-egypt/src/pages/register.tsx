import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useRegister, RegisterInputRole } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<RegisterInputRole>('customer');
  const [, setLocation] = useLocation();
  const registerMutation = useRegister();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ data: { email, password, name, role } }, {
      onSuccess: (data) => {
        toast.success('Account created successfully!');
        // Persist the session token so generated API hooks can send it as a
        // Bearer token on every request (including after page refresh).
        localStorage.setItem('auth_token', data.token);
        queryClient.setQueryData(['/api/auth/me'], data.user);
        
        if (data.user.role === 'admin') setLocation('/admin');
        else if (data.user.role === 'vendor') setLocation('/vendor');
        else setLocation('/dashboard');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create account');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-2xl shadow-xl border border-border">
        <div className="text-center">
          <Link href="/" className="text-3xl font-serif font-bold tracking-tight text-primary hover:text-primary/80 transition-colors">
            WavesOf<span className="text-accent">Egypt</span>
          </Link>
          <h2 className="mt-6 text-3xl font-serif font-bold text-foreground">Create your account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password (min 6 chars)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4 border-t border-border mt-4">
              <Label className="mb-3 block">I want to...</Label>
              <RadioGroup value={role} onValueChange={(v: RegisterInputRole) => setRole(v)} className="flex gap-4">
                <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg border border-border flex-1">
                  <RadioGroupItem value="customer" id="r1" />
                  <Label htmlFor="r1" className="cursor-pointer">Book tours</Label>
                </div>
                <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg border border-border flex-1">
                  <RadioGroupItem value="vendor" id="r2" />
                  <Label htmlFor="r2" className="cursor-pointer">Sell tours</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
