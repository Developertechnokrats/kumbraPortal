'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BondsSettings from '@/components/admin/product-settings/bonds-settings';
import ManagedFundsSettings from '@/components/admin/product-settings/managed-funds-settings';
import GoldContractsSettings from '@/components/admin/product-settings/gold-contracts-settings';
import PreIPOSettings from '@/components/admin/product-settings/pre-ipo-settings';

export default function ProductSettingsPage() {
  const [activeTab, setActiveTab] = useState('pre-ipo');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Settings</h1>
        <p className="text-muted-foreground mt-1">Configure product offerings and update prices</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="pre-ipo">Pre-IPO</TabsTrigger>
          <TabsTrigger value="bonds">Bonds</TabsTrigger>
          <TabsTrigger value="managed-funds">Managed Funds</TabsTrigger>
          <TabsTrigger value="gold">Gold Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="pre-ipo" className="mt-6">
          <PreIPOSettings />
        </TabsContent>

        <TabsContent value="bonds" className="mt-6">
          <BondsSettings />
        </TabsContent>

        <TabsContent value="managed-funds" className="mt-6">
          <ManagedFundsSettings />
        </TabsContent>

        <TabsContent value="gold" className="mt-6">
          <GoldContractsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
