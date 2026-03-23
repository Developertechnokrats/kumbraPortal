'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Coins } from 'lucide-react';

export default function GoldContractsSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gold Contracts Settings</CardTitle>
          <CardDescription>
            Configure site-wide settings for gold contract products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <Coins className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              Gold contract configuration settings will be available here. This will allow you to manage pricing,
              minimum investments, and other settings for gold products.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
