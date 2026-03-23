'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/format';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { addMonths, format } from 'date-fns';

interface BondCalculatorProps {
  bond: any;
}

interface PaymentSchedule {
  date: Date;
  amount: number;
  type: 'Interest' | 'Principal' | 'Interest + Principal';
}

export function BondCalculator({ bond }: BondCalculatorProps) {
  const [investmentAmount, setInvestmentAmount] = useState(
    bond.metadata_json?.min_investment || 50000
  );
  const [selectedTerm, setSelectedTerm] = useState('12');
  const [selectedFrequency, setSelectedFrequency] = useState('QUARTERLY');
  const [schedule, setSchedule] = useState<PaymentSchedule[]>([]);

  const couponRate = bond.metadata_json?.coupon_rate || 0;
  const termOptions = bond.metadata_json?.term_options || [12, 24, 36];
  const frequencyOptions = ['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL'];

  useEffect(() => {
    calculateSchedule();
  }, [investmentAmount, selectedTerm, selectedFrequency]);

  const calculateSchedule = () => {
    const termMonths = parseInt(selectedTerm);
    const annualRate = couponRate / 100;

    let paymentsPerYear = 1;
    switch (selectedFrequency) {
      case 'MONTHLY':
        paymentsPerYear = 12;
        break;
      case 'QUARTERLY':
        paymentsPerYear = 4;
        break;
      case 'BIANNUAL':
        paymentsPerYear = 2;
        break;
      case 'ANNUAL':
        paymentsPerYear = 1;
        break;
    }

    const interestPerPayment = (investmentAmount * annualRate) / paymentsPerYear;
    const monthsBetweenPayments = 12 / paymentsPerYear;
    const totalPayments = Math.floor(termMonths / monthsBetweenPayments);

    const newSchedule: PaymentSchedule[] = [];
    const startDate = new Date();

    for (let i = 1; i <= totalPayments; i++) {
      const paymentDate = addMonths(startDate, i * monthsBetweenPayments);
      const isLastPayment = i === totalPayments;

      newSchedule.push({
        date: paymentDate,
        amount: isLastPayment ? interestPerPayment + investmentAmount : interestPerPayment,
        type: isLastPayment ? 'Interest + Principal' : 'Interest',
      });
    }

    setSchedule(newSchedule);
  };

  const totalInterest = schedule.reduce((sum, payment) => sum + payment.amount, 0) - investmentAmount;
  const totalReturn = investmentAmount + totalInterest;
  const annualizedReturn = (totalInterest / investmentAmount) * (12 / parseInt(selectedTerm)) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Investment Calculator
          </CardTitle>
          <CardDescription>
            Calculate your potential returns based on investment amount, term, and payment frequency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Investment Amount ({bond.currency})</Label>
              <Input
                id="amount"
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
                min={bond.metadata_json?.min_investment || 10000}
                step={1000}
              />
              <p className="text-xs text-muted-foreground">
                Min: {formatCurrency(bond.metadata_json?.min_investment || 10000, bond.currency)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Investment Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger id="term">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {termOptions.map((months: number) => (
                    <SelectItem key={months} value={months.toString()}>
                      {months >= 12 ? `${months / 12} Year${months > 12 ? 's' : ''}` : `${months} Months`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Payment Frequency</Label>
              <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq.charAt(0) + freq.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Total Interest Earned</div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalInterest, bond.currency)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Annualized: {annualizedReturn.toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Total Return</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalReturn, bond.currency)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Principal + Interest
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Interest Per Payment</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(schedule[0]?.amount || 0, bond.currency)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {schedule.length} payments
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Payment Schedule</h4>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {schedule.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{format(payment.date, 'dd MMM yyyy')}</div>
                      <div className="text-xs text-muted-foreground">{payment.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(payment.amount, bond.currency)}</div>
                    {payment.type.includes('Principal') && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Final Payment
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Investment Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Coupon Rate:</span>
                  <span className="ml-2 font-semibold">{couponRate}% p.a.</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Day Count:</span>
                  <span className="ml-2 font-semibold">{bond.metadata_json?.day_count || '30/360'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Issuer:</span>
                  <span className="ml-2 font-semibold">{bond.issuer_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk Rating:</span>
                  <Badge variant="outline" className="ml-2">
                    {bond.metadata_json?.rating || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
