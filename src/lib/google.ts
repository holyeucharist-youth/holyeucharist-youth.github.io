declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GsiConfig) => void;
          renderButton: (el: HTMLElement, opts: GsiButtonOpts) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

type GsiConfig = {
  client_id: string;
  callback: (res: { credential: string }) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
};

type GsiButtonOpts = {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill';
  width?: number;
};

export function waitForGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.google?.accounts?.id) return resolve();
      if (Date.now() - start > 10_000) return reject(new Error('gsi_load_timeout'));
      setTimeout(tick, 50);
    };
    tick();
  });
}
