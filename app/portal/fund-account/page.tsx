'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle, Info, Building2, Wallet, CreditCard, AlertCircle, PlusCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';
import { ConfirmPaymentDialog } from '@/components/portal/confirm-payment-dialog';
import { PrintPaymentInstructions } from '@/components/portal/print-payment-instructions';

export default function FundAccountPage() {
  const { client, profile } = useAuth();
  const [paymentDetails, setPaymentDetails] = useState<any>({
    payment_reference_code: '',
    payment_account_name: '',
    payment_sort_code: '',
    payment_account_number: '',
    payment_iban: '',
    payment_swift_bic: '',
    payment_bank_address: '',
    base_currency: 'GBP',
  });
  const [pendingInvestments, setPendingInvestments] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  useEffect(() => {
    loadPaymentDetails();
    loadPendingInvestments();
    loadCashBalance();
  }, [client]);

  const loadPaymentDetails = async () => {
    if (!client) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('payment_reference_code, payment_account_name, payment_sort_code, payment_account_number, payment_iban, payment_swift_bic, payment_bank_address, base_currency')
        .eq('id', client.id)
        .single();

      if (error) throw error;

      setPaymentDetails({
        payment_reference_code: (data as any)?.payment_reference_code || 'N/A',
        payment_account_name: (data as any)?.payment_account_name || '',
        payment_sort_code: (data as any)?.payment_sort_code || '',
        payment_account_number: (data as any)?.payment_account_number || '',
        payment_iban: (data as any)?.payment_iban || '',
        payment_swift_bic: (data as any)?.payment_swift_bic || '',
        payment_bank_address: (data as any)?.payment_bank_address || '',
        base_currency: (data as any)?.base_currency || 'GBP',
      });
    } catch (error) {
      console.error('Error loading payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvestments = async () => {
    if (!client) return;

    try {
      const { data, error } = await supabase
        .from('holdings')
        .select(`
          id,
          cost_basis,
          currency,
          status,
          created_at,
          instrument:instruments(issuer_name, asset_class)
        `)
        .eq('client_id', client.id)
        .in('status', ['PENDING', 'PENDING_PAYMENT'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingInvestments(data || []);
    } catch (error) {
      console.error('Error loading pending investments:', error);
    }
  };

  const loadCashBalance = async () => {
    if (!client) return;

    try {
      const { data, error } = await supabase
        .from('cash_balances')
        .select('balance')
        .eq('client_id', client.id)
        .eq('currency', client.base_currency)
        .maybeSingle();

      if (error) throw error;

      setCashBalance(data ? Number((data as any).balance) : 0);
    } catch (error) {
      console.error('Error loading cash balance:', error);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cryptoAddresses = {
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
    USDT: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
  };

  const totalAmountDue = pendingInvestments.reduce((sum, inv) => sum + Number(inv.cost_basis), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Fund Your Account
        </h1>
        <p className="text-slate-600 mt-1">Deposit money into your investment account</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(cashBalance, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to invest</p>
          </CardContent>
        </Card>

        {totalAmountDue > 0 && (
          <Card className="border-l-4 border-l-amber-500 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Amount Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(totalAmountDue, paymentDetails.base_currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingInvestments.length} pending investment{pendingInvestments.length > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {pendingInvestments.length > 0 && (
        <Card className="shadow-lg border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Amount Due for Pending Investments</CardTitle>
            <CardDescription>
              You have {pendingInvestments.length} pending investment{pendingInvestments.length > 1 ? 's' : ''} awaiting payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg border-2 border-primary/20 mb-6">
              <p className="text-sm font-medium text-slate-600 mb-2">Total Amount Due</p>
              <p className="text-5xl font-bold text-primary">
                {paymentDetails.base_currency} {totalAmountDue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 mb-2">Pending Investments:</p>
              {pendingInvestments.map((inv) => (
                <div key={inv.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">{inv.instrument?.issuer_name || 'Investment'}</p>
                    <p className="text-sm text-slate-600">{inv.instrument?.asset_class}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {inv.currency} {Number(inv.cost_basis).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              {!paymentDetails.payment_account_name && !loading ? (
                <Alert className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-900">
                    Payment instructions are being configured for your account. Please contact your advisor for assistance with funding your account.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Bank Account Details</CardTitle>
                      <CardDescription>Use these details to make a bank transfer</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Account Name</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={paymentDetails.payment_account_name || 'Not configured'}
                              readOnly
                              className="font-mono"
                            />
                            {paymentDetails.payment_account_name && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(paymentDetails.payment_account_name, 'accountName')}
                              >
                                {copiedField === 'accountName' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </div>

                        {paymentDetails.payment_sort_code && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Sort Code</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={paymentDetails.payment_sort_code}
                                readOnly
                                className="font-mono"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(paymentDetails.payment_sort_code, 'sortCode')}
                              >
                                {copiedField === 'sortCode' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Account Number</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={paymentDetails.payment_account_number || 'Not configured'}
                              readOnly
                              className="font-mono"
                            />
                            {paymentDetails.payment_account_number && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(paymentDetails.payment_account_number, 'accountNumber')}
                              >
                                {copiedField === 'accountNumber' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </div>

                        {paymentDetails.payment_iban && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">IBAN</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={paymentDetails.payment_iban}
                                readOnly
                                className="font-mono"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(paymentDetails.payment_iban, 'iban')}
                              >
                                {copiedField === 'iban' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        )}

                        {paymentDetails.payment_swift_bic && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">SWIFT/BIC</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={paymentDetails.payment_swift_bic}
                                readOnly
                                className="font-mono"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(paymentDetails.payment_swift_bic, 'swift')}
                              >
                                {copiedField === 'swift' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        )}

                        {paymentDetails.payment_bank_address && (
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-xs text-muted-foreground">Bank Address</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={paymentDetails.payment_bank_address}
                                readOnly
                                className="font-mono"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(paymentDetails.payment_bank_address, 'bankAddress')}
                              >
                                {copiedField === 'bankAddress' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs text-muted-foreground">Reference Code (REQUIRED)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={paymentDetails.payment_reference_code}
                              readOnly
                              className="font-mono text-lg font-bold"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyToClipboard(paymentDetails.payment_reference_code, 'reference')}
                            >
                              {copiedField === 'reference' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
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

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowPrintDialog(true)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Instructions
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setShowConfirmDialog(true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      I've Made This Payment
                    </Button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Important Instructions
                    </h3>
                    <ul className="space-y-2 text-sm text-amber-800">
                      <li className="flex items-start gap-2">
                        <span className="font-bold mt-0.5">•</span>
                        <span>Ensure you include your unique Reference Code when making the transfer</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold mt-0.5">•</span>
                        <span>You can transfer the exact amount due or add additional funds to your cash balance for future investments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold mt-0.5">•</span>
                        <span>Transfers typically take 1-2 business days to process</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold mt-0.5">•</span>
                        <span>Your cash balance will be updated once we receive and process your payment</span>
                      </li>
                    </ul>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Processing Time:</strong> Bank transfers typically take 1-2 business days.
                    </AlertDescription>
                  </Alert>
                </>
              )}
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
                            {copiedField === crypto ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => setShowConfirmDialog(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                I've Made This Payment
              </Button>

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

      <ConfirmPaymentDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        amountDue={totalAmountDue}
        currency={paymentDetails.base_currency}
        onSuccess={() => {
          loadPendingInvestments();
          loadCashBalance();
        }}
      />

      <PrintPaymentInstructions
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        paymentDetails={paymentDetails}
        clientName={profile?.name}
        amountDue={totalAmountDue > 0 ? totalAmountDue : undefined}
      />
    </div>
  );
}
