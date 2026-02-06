// Microsoft Azure AD OAuth Provider Configuration
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

export function getMicrosoftProvider() {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const tenantId = process.env.AZURE_AD_TENANT_ID || 'common';

  if (!clientId || !clientSecret) {
    return null;
  }

  return MicrosoftEntraID({
    clientId,
    clientSecret,
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    authorization: {
      params: {
        scope: 'openid profile email User.Read',
      },
    },
  });
}

export const MICROSOFT_SCOPES = [
  'openid',
  'profile',
  'email',
  'User.Read',
];
