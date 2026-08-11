import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: any;
  }
}

export interface EmbeddedSignupResult {
  code: string;
  wabaId?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
}

interface UseMetaSDKOptions {
  appId?: string;
  configId?: string;
  onSuccess?: (result: EmbeddedSignupResult) => void;
  onError?: (error: string) => void;
}

export function useMetaSDK(options: UseMetaSDKOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const appId = options.appId || import.meta.env.VITE_META_APP_ID || '1080984824614223';
  const configId = options.configId || import.meta.env.VITE_META_CONFIG_ID || '1585159246296565';

  useEffect(() => {
    if (window.FB) {
      setIsLoaded(true);
      return;
    }

    // Append FB SDK script tag
    const scriptId = 'facebook-jssdk';
    if (document.getElementById(scriptId)) return;

    window.fbAsyncInit = function () {
      if (window.FB) {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v21.0',
        });
        setIsLoaded(true);
      }
    };

    const js = document.createElement('script');
    js.id = scriptId;
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    js.async = true;
    js.defer = true;
    document.body.appendChild(js);
  }, [appId]);

  const launchEmbeddedSignup = useCallback(() => {
    setIsLoading(true);

    let sessionInfoData: { wabaId?: string; phoneNumberId?: string } = {};

    // 1. Session info listener for WA_EMBEDDED_SIGNUP message event
    const sessionInfoListener = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH' && data.data) {
            sessionInfoData = {
              wabaId: data.data.waba_id,
              phoneNumberId: data.data.phone_number_id,
            };
          } else if (data.event === 'CANCEL') {
            options.onError?.('Embedded Signup was cancelled by the user.');
            setIsLoading(false);
          }
        }
      } catch {
        // Non-JSON messages ignored
      }
    };

    window.addEventListener('message', sessionInfoListener);

    // 2. Fallback check if SDK is not initialized or blocked
    if (!window.FB) {
      window.removeEventListener('message', sessionInfoListener);
      setIsLoading(false);
      return false; // Return false to indicate FB SDK popup couldn't be launched directly
    }

    // 3. Launch FB.login dialog with Embedded Signup config
    try {
      window.FB.login(
        (response: any) => {
          window.removeEventListener('message', sessionInfoListener);
          setIsLoading(false);

          if (response && response.authResponse && response.authResponse.code) {
            const code = response.authResponse.code;
            options.onSuccess?.({
              code,
              wabaId: sessionInfoData.wabaId,
              phoneNumberId: sessionInfoData.phoneNumberId,
            });
          } else {
            options.onError?.('Meta authorization was not completed or code missing.');
          }
        },
        {
          config_id: configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            sessionInfoVersion: 3,
            feature: 'whatsapp_embedded_signup',
          },
        }
      );
      return true;
    } catch (err: any) {
      window.removeEventListener('message', sessionInfoListener);
      setIsLoading(false);
      options.onError?.(err.message || 'Failed to launch Facebook Login dialog.');
      return false;
    }
  }, [configId, options]);

  return {
    isLoaded,
    isLoading,
    appId,
    configId,
    launchEmbeddedSignup,
  };
}
