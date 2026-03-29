// Despia Native Integration Helpers
// These functions wrap despia-native calls and provide web fallbacks

export const isNativeApp = (): boolean => {
  try {
    return navigator.userAgent.includes('despia');
  } catch {
    return false;
  }
};

export const haptic = {
  light: () => {
    if (isNativeApp()) {
      import('despia-native').then(m => m.default('lighthaptic://'));
    }
  },
  success: () => {
    if (isNativeApp()) {
      import('despia-native').then(m => m.default('successhaptic://'));
    }
  },
  warning: () => {
    if (isNativeApp()) {
      import('despia-native').then(m => m.default('warninghaptic://'));
    }
  },
  error: () => {
    if (isNativeApp()) {
      import('despia-native').then(m => m.default('errorhaptic://'));
    }
  },
};

// Product IDs matching RevenueCat / App Store Connect
export const PRODUCTS = {
  weekly: 'spysecret_pro_weekly',
  monthly: 'spysecret_pro_monthly',
  yearly: 'spysecret_pro_yearly',
} as const;

export const purchase = async (userId: string, productId: string) => {
  if (!isNativeApp()) {
    console.log('[DEV] Purchase:', productId, 'for user:', userId);
    return null;
  }
  const despia = (await import('despia-native')).default;
  return despia(`revenuecat://purchase?external_id=${userId}&product=${productId}`);
};

export const restorePurchases = async (userId: string) => {
  if (!isNativeApp()) {
    console.log('[DEV] Restore purchases for user:', userId);
    return null;
  }
  const despia = (await import('despia-native')).default;
  return despia(`revenuecat://restore?external_id=${userId}`);
};

export const manageSubscription = () => {
  if (isNativeApp()) {
    import('despia-native').then(m => m.default('managesubscriptions://'));
  }
};

export const launchNativePaywall = async (userId: string) => {
  if (!isNativeApp()) return;
  const despia = (await import('despia-native')).default;
  return despia(`revenuecat://launchPaywall?external_id=${userId}&offering=default`);
};

export const NATIVE_DEEPLINK_SCHEME = 'spysecret';

export const openInstagram = (username: string) => {
  if (isNativeApp()) {
    // Try Instagram deep link first, fallback to web
    const nativeUrl = `instagram://user?username=${username}`;
    const webUrl = `https://instagram.com/${username}`;
    window.location.href = nativeUrl;
    setTimeout(() => {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }, 500);
  } else {
    window.open(`https://instagram.com/${username}`, '_blank', 'noopener,noreferrer');
  }
};

export const openOAuth = async (oauthUrl: string) => {
  if (!isNativeApp()) return;
  const despia = (await import('despia-native')).default;
  return despia(`oauth://?url=${encodeURIComponent(oauthUrl)}`);
};

export const getAppVersion = async (): Promise<{ versionNumber: string; bundleNumber: string }> => {
  if (!isNativeApp()) return { versionNumber: 'web', bundleNumber: '0' };
  const despia = (await import('despia-native')).default;
  return despia('getappversion://', ['versionNumber', 'bundleNumber']) as Promise<{ versionNumber: string; bundleNumber: string }>;
};

export const requestNotifications = async () => {
  if (!isNativeApp()) return null;
  const despia = (await import('despia-native')).default;
  await despia('requestnotificationpermission://');
  return despia('getonesignalplayerid://', ['onesignalplayerid']);
};
