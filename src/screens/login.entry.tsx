import { createRoot } from 'react-dom/client';
import { initRemoteAuthor } from '@aikaara/chat-sdk/remote-author';
import { LoginScreen } from './login';

initRemoteAuthor(({ target, props, complete }) => {
  const root = createRoot(target);
  root.render(
    <LoginScreen
      onComplete={(data) => complete(data)}
      {...(props as object)}
    />,
  );
  return () => root.unmount();
});
