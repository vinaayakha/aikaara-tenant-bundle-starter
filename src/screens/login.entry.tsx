import { createRoot } from 'react-dom/client';
import { initRemoteAuthor } from '@aikaara/chat-sdk/remote-author';
import { LoginScreen } from './login';

initRemoteAuthor(({ target, ctx, props, complete, fail }) => {
  const root = createRoot(target);
  const p = (props ?? {}) as Record<string, unknown>;
  const auth = (ctx?.extras as Record<string, unknown> | undefined)?.auth as
    | Parameters<typeof LoginScreen>[0]['auth']
    | undefined;
  root.render(
    <LoginScreen
      googleClientId={p.googleClientId as string | undefined}
      buttonText={p.buttonText as string | undefined}
      auth={auth}
      onComplete={complete}
      onError={(err) => fail(err.message)}
    />,
  );
  return () => root.unmount();
});
