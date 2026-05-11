import { useEffect, useRef, useState } from 'react';

// Google Identity Services (GIS) sign-in screen, descriptor-driven.
//
// What the bundle reads:
//   props.googleClientId — required, mints idToken via GIS
//   props.buttonText     — optional, defaults to "Sign in with Google"
//   ctx.extras.auth      — descriptor.auth: { method, endpoint, headers, body, tokenPath, userPath, ... }
//
// Flow:
//   1. Load https://accounts.google.com/gsi/client
//   2. Render the "Sign in with Google" button
//   3. On callback: get idToken from credential
//   4. POST per ctx.extras.auth, substituting {idToken} (and any other
//      collected fields) into auth.body
//   5. Call onComplete({ authed:true, identity:{ jwt, user }})

type Auth = {
  method?: string;
  endpoint?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  tokenPath?: string;
  userPath?: string;
  emailPath?: string;
  fullNamePath?: string;
};

type Props = {
  googleClientId?: string;
  buttonText?: string;
  auth?: Auth;
  onComplete: (data: Record<string, unknown>) => void;
  onError?: (err: Error) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: Record<string, unknown>) => void;
          renderButton: (target: HTMLElement, opts: Record<string, unknown>) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

export function LoginScreen({
  googleClientId,
  buttonText = 'Sign in with Google',
  auth,
  onComplete,
  onError,
}: Props) {
  const btnRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'init' | 'ready' | 'exchanging' | 'error'>('init');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!googleClientId) {
      setPhase('error');
      setErrorMsg('Missing googleClientId in descriptor.components["screen:login"].props');
      return;
    }
    let cancelled = false;
    void loadGsi().then(() => {
      if (cancelled || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (resp: { credential?: string }) => {
          if (!resp.credential) {
            setErrorMsg('Google did not return a credential');
            setPhase('error');
            return;
          }
          void exchange(resp.credential);
        },
        auto_select: false,
        ux_mode: 'popup',
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 280,
        });
      }
      setPhase('ready');
    }).catch((err: Error) => {
      setErrorMsg(`Failed to load Google Identity Services: ${err.message}`);
      setPhase('error');
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  async function exchange(idToken: string): Promise<void> {
    setPhase('exchanging');
    if (!auth?.endpoint) {
      // No backend exchange configured — just hand the idToken to the host.
      onComplete({ authed: true, identity: { idToken } });
      return;
    }
    try {
      const body = substitute(auth.body ?? {}, { idToken });
      const res = await fetch(auth.endpoint, {
        method: auth.method ?? 'POST',
        headers: { 'Content-Type': 'application/json', ...(auth.headers ?? {}) },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const msg = (data.message as string) || res.statusText;
        throw new Error(`Auth exchange ${res.status}: ${msg}`);
      }
      const jwt = pick(data, auth.tokenPath);
      const user = pick(data, auth.userPath);
      const email = pick(data, auth.emailPath);
      const fullName = pick(data, auth.fullNamePath);
      onComplete({
        authed: true,
        identity: { jwt, user, email, fullName, idToken },
      });
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setErrorMsg(e.message);
      setPhase('error');
      onError?.(e);
    }
  }

  return (
    <div style={shell}>
      <div style={card}>
        <div style={title}>Sign in</div>
        <div style={subtitle}>Continue with your Google account</div>
        <div style={btnSlot}>
          {phase === 'init' && <div style={hint}>Loading Google sign-in…</div>}
          {phase === 'exchanging' && <div style={hint}>Signing you in…</div>}
          {phase === 'error' && <div style={errorBox}>{errorMsg}</div>}
          <div ref={btnRef} style={{ display: phase === 'ready' ? 'block' : 'none' }} />
        </div>
        <div style={footer}>{buttonText}</div>
      </div>
    </div>
  );
}

// --- helpers --------------------------------------------------------------

function loadGsi(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-aikaara="gsi"]');
    if (existing) {
      if ((existing as HTMLScriptElement & { _ready?: boolean })._ready) return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GSI script failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.dataset.aikaara = 'gsi';
    s.onload = () => { (s as HTMLScriptElement & { _ready?: boolean })._ready = true; resolve(); };
    s.onerror = () => reject(new Error('GSI script failed to load'));
    document.head.appendChild(s);
  });
}

function substitute(template: Record<string, unknown>, vars: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(template)) {
    if (typeof v === 'string') {
      out[k] = v.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? '');
    } else {
      out[k] = v;
    }
  }
  return out;
}

function pick(obj: Record<string, unknown>, path: string | undefined): unknown {
  if (!path) return undefined;
  return path.split('.').reduce<unknown>((acc, seg) => {
    if (acc && typeof acc === 'object' && seg in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[seg];
    }
    return undefined;
  }, obj);
}

// --- styles ---------------------------------------------------------------

const shell: React.CSSProperties = {
  minHeight: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};
const card: React.CSSProperties = {
  width: 340,
  maxWidth: '100%',
  background: 'var(--surface, #0F172A)',
  color: 'var(--text, #F1F5F9)',
  borderRadius: 14,
  padding: 28,
  border: '1px solid var(--border, #1F2937)',
  boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
  textAlign: 'center',
};
const title: React.CSSProperties = { fontSize: 22, fontWeight: 700, marginBottom: 6 };
const subtitle: React.CSSProperties = { fontSize: 14, color: 'var(--text-muted, #CBD5E1)', marginBottom: 24 };
const btnSlot: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 52, marginBottom: 16 };
const hint: React.CSSProperties = { fontSize: 13, color: 'var(--text-muted, #CBD5E1)' };
const errorBox: React.CSSProperties = { fontSize: 13, color: '#F87171', textAlign: 'left', whiteSpace: 'pre-wrap' };
const footer: React.CSSProperties = { fontSize: 12, color: 'var(--text-muted, #CBD5E1)', marginTop: 8 };
