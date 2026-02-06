// SSO Providers Index
export { getGoogleProvider, GOOGLE_SCOPES } from './google';
export { getMicrosoftProvider, MICROSOFT_SCOPES } from './microsoft';

import { getGoogleProvider } from './google';
import { getMicrosoftProvider } from './microsoft';
import type { Provider } from 'next-auth/providers';

/**
 * Get all configured SSO providers
 * Returns only providers that have valid credentials configured
 */
export function getConfiguredProviders(): Provider[] {
  const providers: Provider[] = [];

  const googleProvider = getGoogleProvider();
  if (googleProvider) {
    providers.push(googleProvider);
  }

  const microsoftProvider = getMicrosoftProvider();
  if (microsoftProvider) {
    providers.push(microsoftProvider);
  }

  return providers;
}

/**
 * Check if SSO is enabled (at least one provider configured)
 */
export function isSSOEnabled(): boolean {
  return getConfiguredProviders().length > 0;
}

/**
 * Get list of enabled provider names
 */
export function getEnabledProviderNames(): string[] {
  const names: string[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    names.push('google');
  }

  if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
    names.push('azure-ad');
  }

  return names;
}
