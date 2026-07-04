'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import type { AuthUser } from './types';

interface TwoFactorPageProps {
  tempToken: string;
  onVerified: (user: AuthUser) => void;
  onBack: () => void;
}

export function TwoFactorPage({ tempToken, onVerified, onBack }: TwoFactorPageProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Masukkan kode 6 digit');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/pmo-auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || 'Verifikasi gagal');
        return;
      }

      onVerified(data.data.user);
    } catch {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="items-center space-y-3 pb-4 pt-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-lg">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">
                Verifikasi 2FA
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Masukkan kode 6 digit dari aplikasi authenticator Anda
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp-code">Kode Verifikasi</Label>
                <Input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(val);
                  }}
                  className="h-14 text-center text-2xl font-mono tracking-[0.5em]"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  'Verifikasi'
                )}
              </Button>
            </form>

            <button
              onClick={onBack}
              className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Login
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}