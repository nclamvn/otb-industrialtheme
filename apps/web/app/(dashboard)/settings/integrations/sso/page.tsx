'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function SSOSettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  // These would normally come from API/environment
  const [googleEnabled] = useState(!!process.env.NEXT_PUBLIC_GOOGLE_SSO_ENABLED);
  const [microsoftEnabled] = useState(!!process.env.NEXT_PUBLIC_MICROSOFT_SSO_ENABLED);

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="SSO Configuration"
          description="Single Sign-On settings"
        />
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Only administrators can configure SSO settings. Contact your system administrator for assistance.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SSO Configuration"
        description="Configure Single Sign-On providers for your organization"
      />

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Environment Variables Required</AlertTitle>
        <AlertDescription>
          SSO providers are configured via environment variables. Update your .env file to enable providers.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Google OAuth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">Google Workspace</CardTitle>
                <CardDescription>Sign in with Google accounts</CardDescription>
              </div>
            </div>
            <Badge variant={googleEnabled ? 'default' : 'secondary'}>
              {googleEnabled ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Enabled
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-3 w-3" />
                  Not Configured
                </>
              )}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="google-client-id">Client ID</Label>
                <Input
                  id="google-client-id"
                  type="password"
                  placeholder="Configure in .env: GOOGLE_CLIENT_ID"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="google-client-secret">Client Secret</Label>
                <Input
                  id="google-client-secret"
                  type="password"
                  placeholder="Configure in .env: GOOGLE_CLIENT_SECRET"
                  disabled
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Cloud Console
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Microsoft Azure AD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">Microsoft Azure AD</CardTitle>
                <CardDescription>Sign in with Microsoft 365 accounts</CardDescription>
              </div>
            </div>
            <Badge variant={microsoftEnabled ? 'default' : 'secondary'}>
              {microsoftEnabled ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Enabled
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-3 w-3" />
                  Not Configured
                </>
              )}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="azure-client-id">Client ID</Label>
                <Input
                  id="azure-client-id"
                  type="password"
                  placeholder="Configure in .env: AZURE_AD_CLIENT_ID"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="azure-client-secret">Client Secret</Label>
                <Input
                  id="azure-client-secret"
                  type="password"
                  placeholder="Configure in .env: AZURE_AD_CLIENT_SECRET"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="azure-tenant-id">Tenant ID</Label>
                <Input
                  id="azure-tenant-id"
                  type="password"
                  placeholder="Configure in .env: AZURE_AD_TENANT_ID"
                  disabled
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Azure Portal
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
