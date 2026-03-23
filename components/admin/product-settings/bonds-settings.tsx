'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Settings, Search, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { CompanyLogo } from '@/components/ui/company-logo';
import { BondConfigDialog } from './bond-config-dialog';
import { AddBondDialog } from './add-bond-dialog';
import { toast } from 'sonner';

export default function BondsSettings() {
  const [loading, setLoading] = useState(true);
  const [bonds, setBonds] = useState<any[]>([]);
  const [filteredBonds, setFilteredBonds] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBond, setSelectedBond] = useState<any>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    loadBonds();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = bonds.filter(bond =>
        bond.issuer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bond.isin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bond.metadata_json?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBonds(filtered);
    } else {
      setFilteredBonds(bonds);
    }
  }, [searchTerm, bonds]);

  const loadBonds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instruments')
        .select('*')
        .eq('asset_class', 'FIXED_INCOME')
        .eq('is_active', true)
        .order('issuer_name');

      if (error) throw error;

      setBonds(data || []);
      setFilteredBonds(data || []);
    } catch (error: any) {
      console.error('Error loading bonds:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBondConfig = (bond: any) => {
    setSelectedBond(bond);
    setIsConfigOpen(true);
  };

  const handleConfigSuccess = () => {
    loadBonds();
  };

  const handleDeleteBond = async (bond: any) => {
    if (!confirm(`Are you sure you want to delete "${bond.issuer_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('instruments')
        .delete()
        .eq('id', bond.id);

      if (error) throw error;

      toast.success('Bond deleted successfully');
      loadBonds();
    } catch (error: any) {
      console.error('Error deleting bond:', error);
      toast.error(error.message || 'Failed to delete bond');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bond Product Settings</CardTitle>
              <CardDescription>
                Configure individual settings for each bond including minimum investment, currencies, payment frequencies, terms, and payment dates.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadBonds}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bond
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by issuer, ISIN, or bond name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredBonds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'No bonds match your search' : 'No bonds available'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issuer</TableHead>
                  <TableHead>Bond Details</TableHead>
                  <TableHead>Min Investment</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Frequencies</TableHead>
                  <TableHead>Payment Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBonds.map((bond) => {
                  const metadata = bond.metadata_json || {};
                  const schedule = bond.coupon_schedule_json || {};
                  const minInvestment = metadata.min_investment || 50000;
                  const termOptions = metadata.term_options || [1, 2, 3];
                  const frequencies = schedule.frequency_options || [];
                  const paymentDates = schedule.payment_dates || [];

                  return (
                    <TableRow key={bond.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CompanyLogo
                            issuerName={bond.issuer_name}
                            customLogoUrl={bond.metadata_json?.company_logo}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium">{bond.issuer_name}</div>
                            <div className="text-sm text-muted-foreground">{bond.isin}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{metadata.name || 'N/A'}</div>
                          <div className="text-muted-foreground">
                            {metadata.coupon_rate}% - {metadata.rating}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${minInvestment.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {metadata.currency_options?.join(', ') || 'GBP'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {termOptions.map((term: number) => (
                            <Badge key={term} variant="outline" className="text-xs">
                              {term}Y
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {frequencies.length > 0 ? frequencies.length + ' options' : 'Not set'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {paymentDates.length > 0 ? (
                            <span className="text-emerald-600">{paymentDates.length} dates</span>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openBondConfig(bond)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Configure
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteBond(bond)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 text-blue-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Per-Bond Configuration</h3>
              <p className="text-sm text-blue-800 mt-1">
                Each bond can have its own unique settings. Click "Configure" on any bond to set specific minimum investments, available currencies, payment frequencies, term options, and dividend payment dates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedBond && (
        <BondConfigDialog
          open={isConfigOpen}
          onOpenChange={setIsConfigOpen}
          bond={selectedBond}
          onSuccess={handleConfigSuccess}
        />
      )}

      <AddBondDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={handleConfigSuccess}
      />
    </div>
  );
}
