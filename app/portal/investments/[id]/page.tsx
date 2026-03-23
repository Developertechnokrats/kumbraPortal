'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CompanyLogo } from '@/components/ui/company-logo';
import { BondCalculator } from '@/components/portal/bond-calculator';
import { formatCurrency } from '@/lib/utils/format';

export default function InvestmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [instrument, setInstrument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstrument();
  }, [params.id]);

  const loadInstrument = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('instruments')
        .select('*')
        .eq('id', params.id)
        .single();

      setInstrument(data);
    } catch (error) {
      console.error('Error loading instrument:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!instrument) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Investment not found</p>
          <Button className="mt-4" onClick={() => router.push('/portal/investments')}>
            Back to Investments
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-start gap-6 mb-6">
            <CompanyLogo
              issuerName={instrument.issuer_name}
              issuerDomain={instrument.issuer_domain}
              customLogoUrl={instrument.metadata_json?.company_logo}
              size="lg"
              variant="horizontal"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{instrument.issuer_name}</h1>
              <p className="text-muted-foreground mt-1">{instrument.metadata_json?.description}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge variant="outline">{instrument.asset_class}</Badge>
                <Badge variant="outline">{instrument.currency}</Badge>
                {instrument.metadata_json?.rating && (
                  <Badge variant="outline">{instrument.metadata_json.rating}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {instrument.asset_class === 'FIXED_INCOME' && (
              <>
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Coupon Rate</p>
                  <p className="text-3xl font-bold text-primary">{instrument.metadata_json?.coupon_rate}% p.a.</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Minimum Investment</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(instrument.metadata_json?.min_investment, instrument.currency)}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {instrument.asset_class === 'FIXED_INCOME' && (
        <BondCalculator bond={instrument} />
      )}
    </div>
  );
}
