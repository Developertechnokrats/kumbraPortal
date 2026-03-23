'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin, Calendar, Shield, FileText, Building2, Home, CreditCard } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

export default function ProfilePage() {
  const { profile, client, user } = useAuth();

  const initials = profile?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Your account information and details</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{profile?.name || 'Unknown'}</h2>
                <p className="text-sm text-muted-foreground mt-1">{profile?.role || 'Client'}</p>
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                <Shield className="h-3 w-3 mr-1" />
                Verified Account
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your contact details and account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Full Name
                </div>
                <p className="text-lg font-semibold">{profile?.name || 'Not provided'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
                <p className="text-lg font-semibold">{user?.email || 'Not provided'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </div>
                <p className="text-lg font-semibold">{profile?.phone || 'Not provided'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Country
                </div>
                <p className="text-lg font-semibold">{client?.country_of_residence || profile?.country || 'Not provided'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </div>
                <p className="text-lg font-semibold">
                  {client?.member_since ? new Date(client.member_since).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : client?.created_at ? formatDate(client.created_at, 'long') : 'Not available'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Base Currency
                </div>
                <p className="text-lg font-semibold">{client?.base_currency || 'GBP'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(client?.address_line1 || client?.city || client?.state || client?.postcode) && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Address Information
            </CardTitle>
            <CardDescription>Your residential address</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {client.address_line1 && <p className="text-lg">{client.address_line1}</p>}
              {client.address_line2 && <p className="text-lg">{client.address_line2}</p>}
              <p className="text-lg">
                {[client.city, client.state, client.postcode].filter(Boolean).join(', ')}
              </p>
              {client.country_of_residence && <p className="text-lg font-semibold">{client.country_of_residence}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Account Type
            </CardTitle>
            <CardDescription>Your account classification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account Type</span>
                <Badge variant="secondary">{client?.account_type || 'Individual'}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tax Residency</span>
                <span className="font-semibold">{client?.tax_residency || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Risk Profile</span>
                <Badge className="text-amber-600 bg-amber-50 border-amber-200">
                  {client?.risk_profile || 'Moderate'}
                </Badge>
              </div>
              {client?.account_type === 'INDIVIDUAL' && client?.date_of_birth && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-semibold">
                    {new Date(client.date_of_birth).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
              {client?.account_type === 'JOINT' && (
                <>
                  {client?.date_of_birth && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">DOB - Holder 1</span>
                      <span className="font-semibold">
                        {new Date(client.date_of_birth).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {client?.date_of_birth_holder2 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">DOB - Holder 2</span>
                      <span className="font-semibold">
                        {new Date(client.date_of_birth_holder2).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                </>
              )}
              {client?.account_type === 'CORPORATE' && client?.company_incorporation_date && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Incorporation Date</span>
                  <span className="font-semibold">
                    {new Date(client.company_incorporation_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              KYC & Verification
            </CardTitle>
            <CardDescription>Account verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">KYC Status</span>
                <Badge
                  className={
                    client?.kyc_status === 'APPROVED'
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                      : client?.kyc_status === 'PENDING'
                      ? 'text-amber-600 bg-amber-50 border-amber-200'
                      : 'text-red-600 bg-red-50 border-red-200'
                  }
                >
                  {client?.kyc_status || 'Pending'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bank Verified</span>
                <Badge className={client?.bank_verified ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200'}>
                  {client?.bank_verified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              {client?.payment_reference_code && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Reference</span>
                  <span className="font-semibold font-mono">{client.payment_reference_code}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {client?.assigned_advisor_name && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Advisor Information</CardTitle>
            <CardDescription>Your dedicated investment advisor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {client.assigned_advisor_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{client.assigned_advisor_name}</h3>
                <p className="text-sm text-muted-foreground">Investment Advisor</p>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Mail className="h-3 w-3" />
                    <span>{client.assigned_advisor_name.toLowerCase().replace(' ', '.')}@kumbra.capital</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3" />
                    <span>+61 2 9876 5432</span>
                  </div>
                </div>
              </div>
              <Button>Contact Advisor</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
