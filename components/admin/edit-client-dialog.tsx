'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientData: any;
  onSuccess: () => void;
}

const COUNTRIES = [
  'Australia', 'New Zealand', 'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize',
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

const ADVISOR_OPTIONS = [
  { name: 'Daniel Cavanaugh', email: 'daniel.cavanaugh@kumbra.capital' },
  { name: 'David Perry', email: 'david.perry@kumbra.capital' },
];

export function EditClientDialog({ open, onOpenChange, clientData, onSuccess }: EditClientDialogProps) {
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
    member_since: '',
    account_type: 'INDIVIDUAL',
    tax_residency: 'United Kingdom',
    risk_profile: 'Moderate',
    kyc_documents_approved: false,
    assigned_advisor_name: 'Daniel Cavanaugh',
    payment_account_name: '',
    payment_bsb: '',
    payment_account_number: '',
  });

  useEffect(() => {
    if (clientData && open) {
      setFormData({
        name: clientData.profile?.name || '',
        email: clientData.profile?.email || '',
        phone: clientData.profile?.phone || '',
        address_line1: clientData.address_line1 || '',
        address_line2: clientData.address_line2 || '',
        city: clientData.city || '',
        state: clientData.state || '',
        postcode: clientData.postcode || '',
        date_of_birth: clientData.date_of_birth || '',
        date_of_birth_holder2: clientData.date_of_birth_holder2 || '',
        company_incorporation_date: clientData.company_incorporation_date || '',
        country_of_residence: clientData.country_of_residence || 'United Kingdom',
        base_currency: clientData.base_currency || 'USD',
        member_since: clientData.member_since || '',
        account_type: clientData.account_type || 'INDIVIDUAL',
        tax_residency: clientData.tax_residency || 'United Kingdom',
        risk_profile: clientData.risk_profile || 'Moderate',
        kyc_documents_approved: clientData.kyc_documents_approved || false,
        assigned_advisor_name: clientData.assigned_advisor_name || 'Daniel Cavanaugh',
        payment_account_name: clientData.payment_account_name || '',
        payment_bsb: clientData.payment_bsb || '',
        payment_account_number: clientData.payment_account_number || '',
      });
    }
  }, [clientData, open]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setUpdating(true);

      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          country: formData.country_of_residence,
        })
        .eq('id', clientData.user_id);

      if (profileError) throw profileError;

      const { error: clientError } = await (supabase as any)
        .from('clients')
        .update({
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
          date_of_birth: formData.date_of_birth || null,
          date_of_birth_holder2: formData.date_of_birth_holder2 || null,
          company_incorporation_date: formData.company_incorporation_date || null,
          country_of_residence: formData.country_of_residence,
          base_currency: formData.base_currency,
          member_since: formData.member_since,
          account_type: formData.account_type,
          tax_residency: formData.tax_residency,
          risk_profile: formData.risk_profile,
          kyc_documents_approved: formData.kyc_documents_approved,
          assigned_advisor_name: formData.assigned_advisor_name,
          kyc_status: formData.kyc_documents_approved ? 'APPROVED' : 'PENDING',
          payment_account_name: formData.payment_account_name || null,
          payment_bsb: formData.payment_bsb || null,
          payment_account_number: formData.payment_account_number || null,
        })
        .eq('id', clientData.id);

      if (clientError) throw clientError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any).from('audit_logs').insert({
          actor_id: user.id,
          action: 'UPDATE_CLIENT',
          entity: 'CLIENT',
          entity_id: clientData.id,
          after_json: formData,
        });
      }

      alert('Client updated successfully!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating client:', error);
      alert('Error updating client: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client Information</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
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
                  value={formData.address_line1}
                  onChange={(e) => setFormData({...formData, address_line1: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Address Line 2</Label>
                <Input
                  value={formData.address_line2}
                  onChange={(e) => setFormData({...formData, address_line2: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>City / Suburb</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>State / Province</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Postcode</Label>
                <Input
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
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
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
                    {COUNTRIES.map(country => (
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
                    id="kyc_edit"
                    checked={formData.kyc_documents_approved}
                    onCheckedChange={(checked) => setFormData({...formData, kyc_documents_approved: checked as boolean})}
                  />
                  <Label htmlFor="kyc_edit" className="cursor-pointer">
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
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Payment Instructions</h3>
            <p className="text-sm text-muted-foreground">Configure bank details for client deposits</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Account Name</Label>
                <Input
                  placeholder="e.g., John Smith Trust Account"
                  value={formData.payment_account_name}
                  onChange={(e) => setFormData({...formData, payment_account_name: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">Typically matches the account holder name</p>
              </div>
              <div className="space-y-2">
                <Label>BSB</Label>
                <Input
                  placeholder="000-000"
                  maxLength={7}
                  value={formData.payment_bsb}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9-]/g, '');
                    if (value.length === 3 && !value.includes('-')) {
                      value = value + '-';
                    }
                    if (value.length <= 7) {
                      setFormData({...formData, payment_bsb: value});
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">6-digit number (formatted XXX-XXX)</p>
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  placeholder="123456789"
                  maxLength={9}
                  value={formData.payment_account_number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 9) {
                      setFormData({...formData, payment_account_number: value});
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">6-9 digit account number</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updating}>
            {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
