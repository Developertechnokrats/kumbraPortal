'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, Building2, Wallet, CreditCard, Copy, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

export default function AddFundsPage() {
  const { client } = useAuth();
  const [amount, setAmount] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('GBP');

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const bankDetails = {
    GBP: {
      accountName: 'Kumbra Capital Ltd',
      sortCode: '20-00-00',
      accountNumber: '12345678',
      swift: 'BARCGB22',
      reference: client?.id?.substring(0, 8).toUpperCase() || 'XXXXXXXX',
    },
    USD: {
      accountName: 'Kumbra Capital Ltd',
      routingNumber: '026009593',
      accountNumber: '9876543210',
      swift: 'BOFAUS3N',
      reference: client?.id?.substring(0, 8).toUpperCase() || 'XXXXXXXX',
    },
    EUR: {
      accountName: 'Kumbra Capital Ltd',
      iban: 'GB29NWBK60161331926819',
      bic: 'NWBKGB2L',
      reference: client?.id?.substring(0, 8).toUpperCase() || 'XXXXXXXX',
    },
  };

  const cryptoAddresses = {
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
    USDT: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Add Funds</h1>
        <p className="text-muted-foreground mt-1">Deposit money into your investment account</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(25450.00, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to invest</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-2 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(0, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Processing</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deposited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(125450.00, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime</p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          All deposits are processed within 1-2 business days. Ensure you include your unique reference code for automatic crediting.
        </AlertDescription>
      </Alert>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Deposit Methods
          </CardTitle>
          <CardDescription>Choose your preferred funding method</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bank">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bank" className="gap-2">
                <Building2 className="h-4 w-4" />
                Bank Transfer
              </TabsTrigger>
              <TabsTrigger value="crypto" className="gap-2">
                <Wallet className="h-4 w-4" />
                Cryptocurrency
              </TabsTrigger>
              <TabsTrigger value="card" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Card Payment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bank" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label>Select Currency</Label>
                  <div className="flex gap-2 mt-2">
                    {['GBP', 'USD', 'EUR'].map((curr) => (
                      <Button
                        key={curr}
                        variant={selectedCurrency === curr ? 'default' : 'outline'}
                        onClick={() => setSelectedCurrency(curr)}
                      >
                        {curr}
                      </Button>
                    ))}
                  </div>
                </div>

                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Bank Account Details - {selectedCurrency}</CardTitle>
                    <CardDescription>Use these details to make a bank transfer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Account Name</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={bankDetails[selectedCurrency as keyof typeof bankDetails].accountName}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyToClipboard(bankDetails[selectedCurrency as keyof typeof bankDetails].accountName, 'accountName')}
                          >
                            {copiedField === 'accountName' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {selectedCurrency === 'GBP' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Sort Code</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={bankDetails.GBP.sortCode}
                                readOnly
                                className="font-mono"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(bankDetails.GBP.sortCode, 'sortCode')}
                              >
                                {copiedField === 'sortCode' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Account Number</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={bankDetails.GBP.accountNumber}
                                readOnly
                                className="font-mono"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(bankDetails.GBP.accountNumber, 'accountNumber')}
                              >
                                {copiedField === 'accountNumber' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}

                      {selectedCurrency === 'USD' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Routing Number</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={bankDetails.USD.routingNumber}
                                readOnly
                                className="font-mono"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(bankDetails.USD.routingNumber, 'routing')}
                              >
                                {copiedField === 'routing' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Account Number</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={bankDetails.USD.accountNumber}
                                readOnly
                                className="font-mono"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(bankDetails.USD.accountNumber, 'usdAccount')}
                              >
                                {copiedField === 'usdAccount' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}

                      {selectedCurrency === 'EUR' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">IBAN</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={bankDetails.EUR.iban}
                                readOnly
                                className="font-mono text-xs"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(bankDetails.EUR.iban, 'iban')}
                              >
                                {copiedField === 'iban' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">BIC/SWIFT</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={bankDetails.EUR.bic}
                                readOnly
                                className="font-mono"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(bankDetails.EUR.bic, 'bic')}
                              >
                                {copiedField === 'bic' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Reference Code (REQUIRED)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={bankDetails[selectedCurrency as keyof typeof bankDetails].reference}
                            readOnly
                            className="font-mono text-lg font-bold"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyToClipboard(bankDetails[selectedCurrency as keyof typeof bankDetails].reference, 'reference')}
                          >
                            {copiedField === 'reference' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Always include this reference code for automatic crediting
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Processing Time:</strong> Bank transfers typically take 1-2 business days. International transfers may take 3-5 business days.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="crypto" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-3">
                {Object.entries(cryptoAddresses).map(([crypto, address]) => (
                  <Card key={crypto} className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{crypto}</span>
                        <Badge variant="outline">{crypto === 'USDT' ? 'ERC-20' : 'Native'}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border-2 border-border">
                        <div className="w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded flex items-center justify-center">
                          <p className="text-xs text-muted-foreground">QR Code</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={address}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyToClipboard(address, crypto)}
                          >
                            {copiedField === crypto ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>Important:</strong> Only send {Object.keys(cryptoAddresses).join(', ')} to these addresses. Sending other cryptocurrencies will result in permanent loss of funds. Minimum deposit: 0.001 BTC / 0.01 ETH / 50 USDT.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="card" className="space-y-6 mt-6">
              <Card className="bg-muted/50">
                <CardContent className="py-12 text-center">
                  <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-bold mb-2">Card Payments</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Credit and debit card payments are coming soon. We're integrating with Stripe to provide instant deposits with competitive fees.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <Badge variant="outline" className="text-sm">Visa</Badge>
                    <Badge variant="outline" className="text-sm">Mastercard</Badge>
                    <Badge variant="outline" className="text-sm">American Express</Badge>
                  </div>
                  <Button className="mt-6" variant="outline">
                    Notify Me When Available
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
