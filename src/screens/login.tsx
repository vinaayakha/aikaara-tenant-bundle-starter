import { useState } from 'react';

// Placeholder login screen. Replace with the real flow.
//
// Props are whatever the descriptor passes for `screen:login`. The shell
// also supplies `ctx` (sso bag, current session state) and a `complete`
// callback to advance the route.
type Props = {
  onComplete: (data: Record<string, unknown>) => void;
};

export function LoginScreen({ onComplete }: Props) {
  const [name, setName] = useState('');
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Welcome</h1>
      <p>Replace this screen with your tenant's onboarding step.</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        style={{ padding: 8, marginRight: 8 }}
      />
      <button onClick={() => onComplete({ name })} disabled={!name}>
        Continue
      </button>
    </div>
  );
}
