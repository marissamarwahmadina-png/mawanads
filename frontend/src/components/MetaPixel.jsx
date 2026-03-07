import { useEffect } from 'react';

export const MetaPixel = ({ pixelId }) => {
  useEffect(() => {
    if (!pixelId) return;

    // Initialize Meta Pixel
    (function(f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ?
          n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s)
    })(window, document, 'script',
      'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');

    // Cleanup
    return () => {
      // Optional: cleanup if needed
    };
  }, [pixelId]);

  // NoScript fallback
  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
};

// Helper function to track custom events
export const trackMetaEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  }
};

// Common events helper
export const trackLead = (value = 1.00, currency = 'IDR') => {
  trackMetaEvent('Lead', { value: parseFloat(value) || 1.00, currency });
};

export const trackCompleteRegistration = () => {
  trackMetaEvent('CompleteRegistration');
};

export const trackSubmitApplication = () => {
  trackMetaEvent('SubmitApplication');
};

export const trackPurchase = (value = 1.00, currency = 'IDR') => {
  trackMetaEvent('Purchase', { value: parseFloat(value) || 1.00, currency });
};

export default MetaPixel;
