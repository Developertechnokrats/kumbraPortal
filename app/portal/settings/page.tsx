'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from '@/lib/theme/theme-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Shield, Building2, CheckCircle, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { profile, client } = useAuth();
  const { colorScheme, setColorScheme } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your profile and account preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Name</label>
              <p className="text-lg font-semibold">{profile?.name || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Phone</label>
              <p className="text-lg font-semibold">{profile?.phone || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Locale</label>
              <p className="text-lg font-semibold">{profile?.locale || 'en-GB'}</p>
            </div>
            <Button variant="outline" className="w-full">Edit Profile</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Account Type</label>
              <p className="text-lg font-semibold">{client?.account_type || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Base Currency</label>
              <p className="text-lg font-semibold">{client?.base_currency || 'GBP'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">KYC Status</label>
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                {client?.kyc_status || 'PENDING'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of your portal</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium text-slate-600 mb-3 block">Color Scheme</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={colorScheme === 'green' ? 'default' : 'outline'}
                onClick={() => setColorScheme('green')}
                className="justify-start h-auto py-4 px-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[hsl(152,69%,31%)] border-2 border-white shadow-sm" />
                  <div className="text-left">
                    <div className="font-semibold">Classic Green</div>
                    <div className="text-xs text-muted-foreground">Traditional wealth theme</div>
                  </div>
                </div>
              </Button>
              <Button
                variant={colorScheme === 'blue' ? 'default' : 'outline'}
                onClick={() => setColorScheme('blue')}
                className="justify-start h-auto py-4 px-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[hsl(194,100%,44%)] border-2 border-white shadow-sm" />
                  <div className="text-left">
                    <div className="font-semibold">Navy Blue</div>
                    <div className="text-xs text-muted-foreground">Modern professional theme</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your password and authentication settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">Change Password</Button>
          <Button variant="outline" className="w-full justify-start">Enable Two-Factor Authentication</Button>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">Sign Out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
