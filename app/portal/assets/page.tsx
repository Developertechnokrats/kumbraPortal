'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

const assetClasses = [
  {
    name: 'Fixed Income',
    description: 'Corporate and government bonds with regular coupon payments',
    examples: ['Barclays PLC 10% 2029', 'Commonwealth Bank Notes'],
  },
  {
    name: 'Managed Funds',
    description: 'Professionally managed investment portfolios',
    examples: [
      'Secure Income Fund',
      'Adventurous Fixed Income Fund',
      'Crypto Managed Fund',
      'IPO/Pre-IPO Fund',
    ],
  },
  {
    name: 'Gold Contracts',
    description: 'Derivative contracts for gold exposure',
    examples: ['Gold Forward Contract', 'Gold Leveraged Contract'],
  },
];

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Asset Classes</h2>
        <p className="text-muted-foreground">
          Explore available investment opportunities
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assetClasses.map((assetClass, idx) => (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {assetClass.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {assetClass.description}
              </p>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Examples:
                </p>
                <div className="flex flex-wrap gap-2">
                  {assetClass.examples.map((example, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
