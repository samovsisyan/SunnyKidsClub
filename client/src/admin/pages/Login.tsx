import { useState, type FormEvent } from 'react';
import { Loader2, LockKeyhole } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '../store/auth';
import { inputCls } from '../components/ui';

export default function Login() {
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4">
      <title>Մուտք — Sunny Kids Club Admin</title>
      <meta name="robots" content="noindex, nofollow" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-sun-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-[30rem] w-[30rem] rounded-full bg-sky-200/50 blur-3xl" />
      <form onSubmit={submit} className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-lift ring-1 ring-ink/5">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-6 font-display text-2xl font-semibold">Ադմինիստրատորի մուտք</h1>
          <p className="mt-1 text-sm text-ink-muted">Կայքի բովանդակության կառավարում</p>
        </div>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Էլ. հասցե</span>
          <input type="email" required autoComplete="username" autoFocus className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mb-5 block">
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Գաղտնաբառ</span>
          <input type="password" required autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-peach-50 px-3 py-2 text-sm font-semibold text-peach-600">
            {error}
          </p>
        )}
        <button disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-sun-400 font-bold text-ink shadow-soft transition hover:bg-sun-300 disabled:opacity-60">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Մուտք գործել
        </button>
      </form>
    </div>
  );
}
