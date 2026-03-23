'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MinusCircle, Building2, Plus, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

export default function WithdrawFundsPage() {
  const { client } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountName: '',
    bsb: '',
    accountNumber: '',
    country: 'AU',
  });

  const savedAccounts = [
    { id: '1', accountName: 'James Smith', bsb: '062-000', accountNumber: '****5678', country: 'AU', verified: true },
    { id: '2', accountName: 'James Smith', bsb: '063-000', accountNumber: '****9012', country: 'AU', verified: true },
  ];

  const availableBalance = 25450.00;
  const pendingWithdrawals = 0;

  const validateBSB = (bsb: string) => {
    const cleaned = bsb.replace(/[^0-9]/g, '');
    return cleaned.length === 6;
  };

  const validateAccountNumber = (account: string) => {
    const cleaned = account.replace(/[^0-9]/g, '');
    return cleaned.length >= 6 && cleaned.length <= 10;
  };

  const formatBSB = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
    }
    return cleaned;
  };

  const handleWithdraw = () => {
    console.log('Withdraw:', { amount, selectedAccount });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Withdraw Funds</h1>
        <p className="text-muted-foreground mt-1">Request a withdrawal to your verified bank account</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(availableBalance, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-2 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingWithdrawals, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Processing</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Withdrawn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(45200.00, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime</p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Withdrawals are processed within 1-2 business days. Funds will be transferred to your verified bank account.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MinusCircle className="h-5 w-5 text-primary" />
              Request Withdrawal
            </CardTitle>
            <CardDescription>Enter the amount you wish to withdraw</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Withdrawal Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {client?.base_currency}
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-16 text-lg font-semibold"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount((availableBalance * 0.25).toFixed(2))}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount((availableBalance * 0.5).toFixed(2))}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount((availableBalance * 0.75).toFixed(2))}
                >
                  75%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(availableBalance.toFixed(2))}
                >
                  Max
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Destination Bank Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {savedAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} - {account.bsb} {account.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {amount && parseFloat(amount) > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>You will receive:</strong> {formatCurrency(parseFloat(amount), client?.base_currency)}
                  <br />
                  <span className="text-xs text-muted-foreground">Processing time: 1-2 business days</span>
                </AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!amount || !selectedAccount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance}
              onClick={handleWithdraw}
            >
              Request Withdrawal
            </Button>

            {parseFloat(amount) > availableBalance && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  Insufficient funds. Maximum withdrawal: {formatCurrency(availableBalance, client?.base_currency)}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Saved Bank Accounts
                  </CardTitle>
                  <CardDescription>Manage your verified bank accounts</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddAccount(!showAddAccount)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {savedAccounts.map((account) => (
                <Card key={account.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{account.accountName}</h4>
                          {account.verified && (
                            <Badge className="text-emerald-600 bg-emerald-50 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>BSB: {account.bsb}</p>
                          <p>Account: {account.accountNumber}</p>
                          <p>Country: {account.country === 'UK' ? 'United Kingdom' : account.country === 'US' ? 'United States' : account.country}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {showAddAccount && (
                <Card className="border-2 border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Bank Account</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select value={newAccount.country} onValueChange={(v) => setNewAccount({...newAccount, country: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="EU">European Union</SelectItem>
                          <SelectItem value="CH">Switzerland</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Account Holder Name</Label>
                      <Input
                        value={newAccount.accountName}
                        onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                        placeholder="Enter account holder name"
                      />
                    </div>

                    {newAccount.country === 'AU' && (
                      <>
                        <div className="space-y-2">
                          <Label>BSB</Label>
                          <Input
                            value={newAccount.bsb}
                            onChange={(e) => setNewAccount({...newAccount, bsb: formatBSB(e.target.value)})}
                            placeholder="XXX-XXX"
                            maxLength={7}
                          />
                          {newAccount.bsb && !validateBSB(newAccount.bsb) && (
                            <p className="text-xs text-red-600">Invalid BSB format</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Account Number</Label>
                          <Input
                            value={newAccount.accountNumber}
                            onChange={(e) => setNewAccount({...newAccount, accountNumber: e.target.value.replace(/[^0-9]/g, '')})}
                            placeholder="6-10 digits"
                            maxLength={10}
                          />
                          {newAccount.accountNumber && !validateAccountNumber(newAccount.accountNumber) && (
                            <p className="text-xs text-red-600">Invalid account number (6-10 digits)</p>
                          )}
                        </div>
                      </>
                    )}

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={
                          !newAccount.accountName ||
                          (newAccount.country === 'AU' && (!validateBSB(newAccount.bsb) || !validateAccountNumber(newAccount.accountNumber)))
                        }
                      >
                        Add Account
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddAccount(false)}>
                        Cancel
                      </Button>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        New bank accounts must be verified before use. Verification typically takes 1-2 business days.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Recent Withdrawals</CardTitle>
          <CardDescription>Your withdrawal history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <MinusCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent withdrawals</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
