'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface CreateClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ADVISOR_OPTIONS = [
  { name: 'Daniel Cavanaugh', email: 'daniel.cavanaugh@kumbra.capital', phone: '+44 20 7946 0958', title: 'Senior Wealth Advisor' },
  { name: 'David Perry', email: 'david.perry@kumbra.capital', phone: '+44 20 7946 0959', title: 'Principal Advisor' },
];

const INVESTMENT_OPTIONS = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    label: 'Barclays PLC – GB00BM8Z3Z48 – GBP – 6.100% p.a. – 1 Year – Min £50,000 – Semi-annual',
    minInvestment: 50000,
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    label: 'HSBC Holdings – GB00BM9KBJ15 – GBP – 5.875% p.a. – 2 Year – Min £100,000 – Quarterly',
    minInvestment: 100000,
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    label: 'UK Treasury Gilt – GB00BM8Z2V21 – GBP – 4.250% p.a. – 1 Year – Min £50,000 – Semi-annual',
    minInvestment: 50000,
  },
];

const COUNTRIES = [
  'United Kingdom', 'Ireland', 'France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
  'Portugal', 'Greece', 'Denmark', 'Sweden', 'Norway', 'Finland', 'Poland', 'Czech Republic', 'Hungary', 'Romania',
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'New Zealand', 'Belize',
  'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic',
  'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland',
  'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati',
  'North Korea', 'South Korea', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macedonia', 'Madagascar', 'Malawi', 'Malaysia',
  'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
  'Nepal', 'Netherlands', 'Nicaragua', 'Niger', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Palau',
  'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Swaziland',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

export function CreateClientForm({ open, onOpenChange, onSuccess }: CreateClientFormProps) {
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postcode: '',
    date_of_birth: '',
    date_of_birth_holder2: '',
    company_incorporation_date: '',
    country_of_residence: 'United Kingdom',
    base_currency: 'GBP',
    member_since: new Date().toISOString().split('T')[0],
    account_type: 'INDIVIDUAL',
    tax_residency: 'United Kingdom',
    risk_profile: 'Moderate',
    kyc_documents_approved: false,
    assigned_advisor_name: 'Daniel Cavanaugh',
    selected_investment_id: '',
    investment_amount: '',
  });

  const selectedInvestment = INVESTMENT_OPTIONS.find(inv => inv.id === formData.selected_investment_id);
  const investmentAmountError = selectedInvestment && formData.investment_amount &&
    Number(formData.investment_amount) < selectedInvestment.minInvestment
    ? `Minimum investment is $${selectedInvestment.minInvestment.toLocaleString()}`
    : '';

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.selected_investment_id && investmentAmountError) {
      alert(investmentAmountError);
      return;
    }

    try {
      setCreating(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-client`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            investment_amount: formData.investment_amount ? Number(formData.investment_amount) : undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create client');
      }

      alert(`Client account created successfully! Payment Reference Code: ${result.payment_reference_code}`);
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postcode: '',
        date_of_birth: '',
        date_of_birth_holder2: '',
        company_incorporation_date: '',
        country_of_residence: 'United Kingdom',
        base_currency: 'USD',
        member_since: new Date().toISOString().split('T')[0],
        account_type: 'INDIVIDUAL',
        tax_residency: 'United Kingdom',
        risk_profile: 'Moderate',
        kyc_documents_approved: false,
        assigned_advisor_name: 'Daniel Cavanaugh',
        selected_investment_id: '',
        investment_amount: '',
      });
    } catch (error: any) {
      console.error('Error creating client:', error);
      alert('Error creating client: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Client Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+61 2 1234 5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Address Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Address Line 1</Label>
                <Input
                  placeholder="123 Main Street"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({...formData, address_line1: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Address Line 2</Label>
                <Input
                  placeholder="Apartment, suite, unit, etc. (optional)"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({...formData, address_line2: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>City / Suburb</Label>
                <Input
                  placeholder="Sydney"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>State / Province</Label>
                <Input
                  placeholder="NSW"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Postcode</Label>
                <Input
                  placeholder="2000"
                  value={formData.postcode}
                  onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Country of Residence</Label>
                <Select value={formData.country_of_residence} onValueChange={(v) => setFormData({...formData, country_of_residence: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Base Currency</Label>
                <Select value={formData.base_currency} onValueChange={(v) => setFormData({...formData, base_currency: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Member Since</Label>
                <Input
                  type="date"
                  value={formData.member_since}
                  onChange={(e) => setFormData({...formData, member_since: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Account Classification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={formData.account_type} onValueChange={(v) => setFormData({...formData, account_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="JOINT">Joint</SelectItem>
                    <SelectItem value="CORPORATE">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax Residency</Label>
                <Select value={formData.tax_residency} onValueChange={(v) => setFormData({...formData, tax_residency: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Ireland">Ireland</SelectItem>
                    {COUNTRIES.filter(c => c !== 'United Kingdom' && c !== 'Ireland').map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Risk Profile</Label>
                <Select value={formData.risk_profile} onValueChange={(v) => setFormData({...formData, risk_profile: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="kyc"
                    checked={formData.kyc_documents_approved}
                    onCheckedChange={(checked) => setFormData({...formData, kyc_documents_approved: checked as boolean})}
                  />
                  <Label htmlFor="kyc" className="cursor-pointer">
                    KYC Documents Approved
                  </Label>
                </div>
              </div>

              {formData.account_type === 'INDIVIDUAL' && (
                <div className="space-y-2 col-span-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  />
                </div>
              )}

              {formData.account_type === 'JOINT' && (
                <>
                  <div className="space-y-2">
                    <Label>Date of Birth - Holder 1</Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth - Holder 2</Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth_holder2}
                      onChange={(e) => setFormData({...formData, date_of_birth_holder2: e.target.value})}
                    />
                  </div>
                </>
              )}

              {formData.account_type === 'CORPORATE' && (
                <div className="space-y-2 col-span-2">
                  <Label>Company Incorporation Date</Label>
                  <Input
                    type="date"
                    value={formData.company_incorporation_date}
                    onChange={(e) => setFormData({...formData, company_incorporation_date: e.target.value})}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Advisor Assignment</h3>
            <div className="space-y-2">
              <Label>Assigned Advisor Name</Label>
              <Select value={formData.assigned_advisor_name} onValueChange={(v) => setFormData({...formData, assigned_advisor_name: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADVISOR_OPTIONS.map(advisor => (
                    <SelectItem key={advisor.name} value={advisor.name}>
                      {advisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.assigned_advisor_name && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {ADVISOR_OPTIONS.find(a => a.name === formData.assigned_advisor_name) && (
                    <>
                      <p><strong>Email:</strong> {ADVISOR_OPTIONS.find(a => a.name === formData.assigned_advisor_name)?.email}</p>
                      <p><strong>Phone:</strong> {ADVISOR_OPTIONS.find(a => a.name === formData.assigned_advisor_name)?.phone}</p>
                      <p><strong>Title:</strong> {ADVISOR_OPTIONS.find(a => a.name === formData.assigned_advisor_name)?.title}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Investment Selection</h3>
            <div className="space-y-2">
              <Label>Select Investment (Optional)</Label>
              <Select value={formData.selected_investment_id || 'none'} onValueChange={(v) => setFormData({...formData, selected_investment_id: v === 'none' ? '' : v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an investment product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {INVESTMENT_OPTIONS.map(investment => (
                    <SelectItem key={investment.id} value={investment.id}>
                      {investment.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.selected_investment_id && (
              <div className="space-y-2">
                <Label>Investment Amount *</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={formData.investment_amount}
                  onChange={(e) => setFormData({...formData, investment_amount: e.target.value})}
                />
                {investmentAmountError && (
                  <p className="text-sm text-red-600">{investmentAmountError}</p>
                )}
                {selectedInvestment && (
                  <p className="text-sm text-muted-foreground">
                    Minimum investment: ${selectedInvestment.minInvestment.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={creating}>
            {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
