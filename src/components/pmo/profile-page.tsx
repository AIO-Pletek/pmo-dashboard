'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ShieldCheck,
  ShieldX,
  Copy,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from './auth-context';
import { USER_ROLE_LABELS } from './types';

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export function ProfilePage() {
  const { user } = useAuth();

  // 2FA state
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorVerifyCode, setTwoFactorVerifyCode] = useState('');
  const [twoFactorVerifying, setTwoFactorVerifying] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disabling, setDisabling] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSetup2FA = async () => {
    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/pmo-auth/setup-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || data.error || 'Gagal menyiapkan 2FA');
        return;
      }

      setQrCode(data.data.qrCode);
      setTwoFactorSecret(data.data.secret);
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (twoFactorVerifyCode.length !== 6) {
      toast.error('Masukkan kode 6 digit');
      return;
    }
    setTwoFactorVerifying(true);
    try {
      const res = await fetch('/api/pmo-auth/enable-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFactorVerifyCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || data.error || 'Verifikasi gagal');
        return;
      }

      toast.success('2FA berhasil diaktifkan');
      setQrCode(null);
      setTwoFactorSecret('');
      setTwoFactorVerifyCode('');
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setTwoFactorVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast.error('Masukkan password untuk konfirmasi');
      return;
    }
    setDisabling(true);
    try {
      const res = await fetch('/api/pmo-auth/disable-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || data.error || 'Gagal menonaktifkan 2FA');
        return;
      }

      toast.success('2FA berhasil dinonaktifkan');
      setShowDisableDialog(false);
      setDisablePassword('');
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setDisabling(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Password tidak cocok');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const res = await fetch('/api/pmo-auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || data.error || 'Gagal mengubah password');
        return;
      }

      toast.success('Password berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(twoFactorSecret);
    toast.success('Secret disalin ke clipboard');
  };

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Profil Saya
        </h2>
        <p className="text-sm text-muted-foreground">
          Kelola profil dan pengaturan keamanan akun Anda
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">
              {initials}
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {user.name}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge
                  variant="default"
                  className={
                    user.role === 'ADMIN'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : ''
                  }
                >
                  {USER_ROLE_LABELS[user.role] || user.role}
                </Badge>
                {user.division && (
                  <Badge variant="outline">{user.division.name}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {user.twoFactorEnabled ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <ShieldX className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">
                Autentikasi Dua Faktor (2FA)
              </CardTitle>
              <CardDescription>
                Tambahkan lapisan keamanan ekstra untuk akun Anda
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {user.twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 hover:bg-emerald-700">
                  2FA Aktif
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Akun Anda dilindungi oleh autentikasi dua faktor
                </span>
              </div>
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowDisableDialog(true)}
              >
                <ShieldX className="mr-2 h-4 w-4" />
                Nonaktifkan 2FA
              </Button>
            </div>
          ) : qrCode ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="rounded-lg border bg-white p-3">
                  <img
                    src={qrCode}
                    alt="QR Code 2FA"
                    className="h-48 w-48"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      1. Scan QR code dengan aplikasi authenticator
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Gunakan Google Authenticator, Authy, atau aplikasi TOTP lainnya
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      2. Atau masukkan secret key ini:
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                        {twoFactorSecret}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={copySecret}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      3. Masukkan kode verifikasi:
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={twoFactorVerifyCode}
                        onChange={(e) =>
                          setTwoFactorVerifyCode(
                            e.target.value.replace(/\D/g, '').slice(0, 6)
                          )
                        }
                        className="h-10 w-36 font-mono text-center text-lg tracking-[0.3em]"
                      />
                      <Button
                        onClick={handleEnable2FA}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={
                          twoFactorVerifying || twoFactorVerifyCode.length !== 6
                        }
                      >
                        {twoFactorVerifying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Verifikasi & Aktifkan'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                2FA belum diaktifkan. Aktifkan untuk keamanan ekstra.
              </p>
              <Button
                onClick={handleSetup2FA}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={twoFactorLoading}
              >
                {twoFactorLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyiapkan...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Aktifkan 2FA
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disable 2FA Dialog (inline) */}
      {showDisableDialog && (
        <Card className="border-destructive/50">
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="font-medium text-destructive">
                Nonaktifkan 2FA
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Masukkan password Anda untuk mengkonfirmasi penonaktifan 2FA.
                Tindakan ini mengurangi keamanan akun Anda.
              </p>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="disable-2fa-password">Password</Label>
                <Input
                  id="disable-2fa-password"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Password Anda"
                />
              </div>
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={disabling || !disablePassword}
              >
                {disabling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Konfirmasi'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisableDialog(false);
                  setDisablePassword('');
                }}
              >
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Ubah Password</CardTitle>
              <CardDescription>
                Perbarui password akun Anda secara berkala
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password">Password Saat Ini</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password minimal 8 karakter
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={changePasswordLoading}
            >
              {changePasswordLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengubah...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Ubah Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}