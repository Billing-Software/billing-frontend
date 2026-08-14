import { useState, useEffect, useCallback, useRef } from 'react';

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
  onSuccess?: (result: EmbeddedSignupResult) => Promise<void> | void;
  onError?: (error: string) => void;
}

export function useMetaSDK(options: UseMetaSDKOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<any>(null);

  const appId = options.appId || import.meta.env.VITE_META_APP_ID || '1080984824614223';
  const configId = options.configId || import.meta.env.VITE_META_CONFIG_ID || '1704626870810074';

  useEffect(() => {
    if (window.FB) {
      setIsLoaded(true);
      return;
    }

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
        console.log('[Meta SDK] FB.init initialized successfully.');
      }
    };

    const js = document.createElement('script');
    js.id = scriptId;
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    js.async = true;
    js.defer = true;
    document.body.appendChild(js);
  }, [appId]);

  const cleanupPopup = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      try {
        console.log('[Meta SDK] Explicitly closing popup window...');
        popupRef.current.close();
      } catch (err) {
        console.warn('[Meta SDK] Exception closing popup window:', err);
      }
    }
    popupRef.current = null;
  }, []);

  const launchEmbeddedSignup = useCallback(() => {
    setIsLoading(true);

    let sessionData: { wabaId?: string; phoneNumberId?: string; code?: string } = {};
    let isCompleted = false;

    const finalizeSignup = async (authCode: string) => {
      if (isCompleted) return;
      isCompleted = true;

      console.log('%c[Meta SDK] Finalizing Signup & Token Exchange...', 'color: #25d366; font-weight: bold;', {
        code: authCode,
        wabaId: sessionData.wabaId,
        phoneNumberId: sessionData.phoneNumberId,
      });

      cleanupPopup();
      window.removeEventListener('message', sessionInfoListener);

      try {
        if (options.onSuccess) {
          await options.onSuccess({
            code: authCode,
            wabaId: sessionData.wabaId,
            phoneNumberId: sessionData.phoneNumberId,
          });
        }
      } catch (err: any) {
        console.error('[Meta SDK] Error in onSuccess callback:', err);
        options.onError?.(err?.message || 'Failed to connect WhatsApp account.');
      } finally {
        setIsLoading(false);
      }
    };

    const sessionInfoListener = (event: MessageEvent) => {
      if (!event.origin || !event.origin.includes('facebook.com')) {
        return;
      }

      try {
        const rawData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const data = rawData?.data || rawData;

        if (rawData && (rawData.type === 'WA_EMBEDDED_SIGNUP' || rawData.event === 'FINISH')) {
          console.group('%c[Meta PostMessage Received]', 'color: #25d366; font-weight: bold;');
          console.log('Event:', rawData.event || rawData.type);
          console.log('Origin:', event.origin);
          console.log('Payload:', data);
          console.groupEnd();

          if (data?.waba_id || data?.wabaId) {
            sessionData.wabaId = data.waba_id || data.wabaId;
          }
          if (data?.phone_number_id || data?.phoneNumberId) {
            sessionData.phoneNumberId = data.phone_number_id || data.phoneNumberId;
          }
          if (data?.code || data?.session_token) {
            sessionData.code = data.code || data.session_token;
          }

          const eventName = rawData.event || rawData.status;
          if (eventName === 'FINISH' || rawData.type === 'WA_EMBEDDED_SIGNUP') {
            const codeToUse = sessionData.code || `META_EMBEDDED_SUCCESS_${sessionData.wabaId || Date.now()}`;
            finalizeSignup(codeToUse);
          }
        }
      } catch {
        // Ignore non-JSON postMessages
      }
    };

    window.addEventListener('message', sessionInfoListener);

    const launchHostedSignupWindow = () => {
      console.log('[Meta SDK] Opening Hosted Signup popup window...');
      const width = 600;
      const height = 750;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      const hostedUrl = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=${appId}&config_id=${configId}&extras=%7B%22sessionInfoVersion%22%3A%223%22%2C%22version%22%3A%22v4%22%7D`;

      const popup = window.open(
        hostedUrl,
        'MetaWhatsAppSignup',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );

      if (!popup) {
        window.removeEventListener('message', sessionInfoListener);
        setIsLoading(false);
        options.onError?.('Popup blocker prevented opening the Meta Signup window. Please allow popups.');
        return false;
      }

      popupRef.current = popup;

      pollTimerRef.current = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          if (!isCompleted) {
            console.log('[Meta SDK] Popup window closed by user.');
            window.removeEventListener('message', sessionInfoListener);
            setIsLoading(false);
          }
        }
      }, 500);

      return true;
    };

    // Primary Flow: For http:// localhost, directly use Hosted Signup window to prevent Meta OAuth HTTP security error
    // FB.login dialog is only used on secure https:// origins
    if (window.FB && window.location.protocol === 'https:') {
      try {
        console.log('[Meta SDK] Calling window.FB.login on HTTPS origin with config_id:', configId);
        window.FB.login(
          (response: any) => {
            console.log('[Meta SDK] FB.login response callback:', response);
            if (response && response.authResponse && response.authResponse.code) {
              sessionData.code = response.authResponse.code;
              finalizeSignup(response.authResponse.code);
            } else if (response && response.status === 'not_authorized') {
              cleanupPopup();
              window.removeEventListener('message', sessionInfoListener);
              setIsLoading(false);
              options.onError?.('Authorization was denied by user.');
            } else {
              // Fallback to hosted window if FB.login callback returned no code
              launchHostedSignupWindow();
            }
          },
          {
            config_id: configId,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
              sessionInfoVersion: 3,
              version: 'v4',
            },
          }
        );
        return true;
      } catch (err) {
        console.warn('[Meta SDK] FB.login exception, falling back to hosted window:', err);
        return launchHostedSignupWindow();
      }
    }

    return launchHostedSignupWindow();
  }, [appId, configId, options, cleanupPopup]);

  return {
    isLoaded,
    isLoading,
    appId,
    configId,
    launchEmbeddedSignup,
  };
}

