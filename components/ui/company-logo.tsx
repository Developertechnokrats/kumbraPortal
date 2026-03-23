'use client';

import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyLogoProps {
  issuerName: string;
  issuerDomain?: string;
  symbol?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'emblem' | 'horizontal';
}

interface ExtendedCompanyLogoProps extends CompanyLogoProps {
  customLogoUrl?: string;
}

export function CompanyLogo({ issuerName, issuerDomain, symbol, className, size = 'md', variant = 'emblem', customLogoUrl }: ExtendedCompanyLogoProps) {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  const domain = issuerDomain || extractDomain(issuerName);
  const localLogo = getLocalLogo(issuerName, symbol, variant);

  useEffect(() => {
    setCurrentLogoIndex(0);
    setImgLoaded(false);
  }, [issuerName, issuerDomain, customLogoUrl]);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-lg',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const getColorFromName = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
      'from-red-500 to-red-600',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const buildLogoSources = () => {
    const sources = [];

    if (customLogoUrl) {
      sources.push(customLogoUrl);
    }

    if (localLogo) {
      sources.push(localLogo);
    }

    if (domain) {
      sources.push(
        `https://logo.clearbit.com/${domain}?size=80`,
        `https://img.logo.dev/${domain}?token=pk_X-1ZO13IRRuZSVlbjEfBMQ&size=80`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=256`
      );
    }

    return sources;
  };

  const logoSources = buildLogoSources();

  const handleImageError = () => {
    if (currentLogoIndex < logoSources.length - 1) {
      setCurrentLogoIndex(currentLogoIndex + 1);
      setImgLoaded(false);
    } else {
      setImgLoaded(false);
    }
  };

  if (!domain || !logoSources.length || currentLogoIndex >= logoSources.length) {
    return (
      <div className={cn(
        'flex items-center justify-center rounded-lg bg-gradient-to-br shrink-0 font-bold text-white shadow-sm',
        sizeClasses[size],
        getColorFromName(issuerName),
        className
      )}>
        {getInitials(issuerName)}
      </div>
    );
  }

  return (
    <div className={cn('relative shrink-0', sizeClasses[size], className)}>
      {!imgLoaded && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-br font-bold text-white shadow-sm",
          getColorFromName(issuerName)
        )}>
          {getInitials(issuerName)}
        </div>
      )}
      <img
        key={currentLogoIndex}
        src={logoSources[currentLogoIndex]}
        alt={`${issuerName} logo`}
        className={cn(
          "h-full w-full object-contain rounded-lg border border-border bg-white p-1 transition-opacity shadow-sm",
          imgLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setImgLoaded(true)}
        onError={handleImageError}
        crossOrigin="anonymous"
      />
    </div>
  );
}

function getLocalLogo(issuerName: string, symbol?: string, variant: 'emblem' | 'horizontal' = 'emblem'): string | null {
  if (!issuerName) return null;

  const horizontalLogoMappings: Record<string, string> = {
    'spacex': '/spacex_logo_black.png',
    'space exploration technologies': '/spacex_logo_black.png',
    'space exploration technologies corp': '/spacex_logo_black.png',
    'space exploration technologies corp.': '/spacex_logo_black.png',
    'databricks': '/databricks_logo.png',
    'databricks inc': '/databricks_logo.png',
    'databricks inc.': '/databricks_logo.png',
    'stripe': '/stripe_logo.png',
    'stripe inc': '/stripe_logo.png',
    'stripe inc.': '/stripe_logo.png',
    'impossible foods': '/impossible_foods_logo.svg.png',
    'impossible foods inc': '/impossible_foods_logo.svg.png',
    'impossible foods inc.': '/impossible_foods_logo.svg.png',
    'klarna': '/klarna-logo.png',
    'klarna bank': '/klarna-logo.png',
    'klarna bank ab': '/klarna-logo.png',
    'discord': '/discord1.png',
    'discord inc': '/discord1.png',
    'discord inc.': '/discord1.png',
    'plaid': '/plaid-logo.png',
    'plaid inc': '/plaid-logo.png',
    'plaid inc.': '/plaid-logo.png',
  };

  const logoMappings: Record<string, string> = {
    'databricks': '/databricks_logo.png',
    'databricks inc': '/databricks_logo.png',
    'databricks inc.': '/databricks_logo.png',
    'stripe': '/stripe_logo.png',
    'stripe inc': '/stripe_logo.png',
    'stripe inc.': '/stripe_logo.png',
    'impossible foods': '/impossible_foods_logo.svg.png',
    'impossible foods inc': '/impossible_foods_logo.svg.png',
    'impossible foods inc.': '/impossible_foods_logo.svg.png',
    'klarna': '/klarna-logo.png',
    'klarna bank': '/klarna-logo.png',
    'klarna bank ab': '/klarna-logo.png',
    'spacex': '/spacex-emplem.png',
    'space exploration technologies': '/spacex-emplem.png',
    'space exploration technologies corp': '/spacex-emplem.png',
    'space exploration technologies corp.': '/spacex-emplem.png',
    'discord': '/discord1.png',
    'discord inc': '/discord1.png',
    'discord inc.': '/discord1.png',
    'plaid': '/plaid-logo.png',
    'plaid inc': '/plaid-logo.png',
    'plaid inc.': '/plaid-logo.png',
    'chime': '/chime_thumb.png',
    'chime financial': '/chime_thumb.png',
    'chime financial inc': '/chime_thumb.png',
    'chime financial inc.': '/chime_thumb.png',
    'commonwealth bank': '/commonwealth-bank-symbol.png',
    'commonwealth bank of australia': '/commonwealth-bank-symbol.png',
    'commbank': '/commonwealth-bank-symbol.png',
    'westpac': '/westpac.png',
    'westpac banking': '/westpac.png',
    'westpac banking corporation': '/westpac.png',
    'ubs': '/ubs.png',
    'ubs group': '/ubs.png',
    'ubs group ag': '/ubs.png',
    'ubs ag': '/ubs.png',
    'vanguard': '/vanguard-emblem.png',
    'vanguard group': '/vanguard-emblem.png',
    'vanguard australian shares': '/vanguard-emblem.png',
    'kumbra': '/logolight.png',
    'kumbra secure income': '/logolight.png',
    'kumbra adventurous': '/logolight.png',
    'kumbra crypto': '/logolight.png',
    'kumbra ipo': '/logolight.png',
    'anz': '/anz.png',
    'anz bank': '/anz.png',
    'australia and new zealand banking group': '/anz.png',
    'banco santander': '/banco_santander.png',
    'banco santander sa': '/banco_santander.png',
    'santander': '/banco_santander.png',
    'barclays': '/barclays.png',
    'barclays plc': '/barclays.png',
    'barclays bank': '/barclays.png',
    'bendigo bank': '/bendigo_bank.png',
    'bendigo and adelaide bank': '/bendigo_bank.png',
    'deutsche bank': '/deutsche_bank_logo_without.png',
    'deutsche bank ag': '/deutsche_bank_logo_without.png',
    'bnp paribas': '/bnp_paribas.png',
    'bnp paribas sa': '/bnp_paribas.png',
    'hsbc': '/hsbc-emblem.png',
    'hsbc holdings': '/hsbc-emblem.png',
    'hsbc holdings plc': '/hsbc-emblem.png',
    'hsbc bank': '/hsbc-emblem.png',
    'ing': '/ing.png',
    'ing groep': '/ing.png',
    'ing groep nv': '/ing.png',
    'ing bank': '/ing.png',
    'unicredit': '/unicredit.png',
    'unicredit spa': '/unicredit.png',
    'unicredit bank': '/unicredit.png',
    'standard chartered': '/standard_chartered.png',
    'standard chartered plc': '/standard_chartered.png',
    'standard chartered bank': '/standard_chartered.png',
  };

  const symbolMappings: Record<string, string> = {
    'DATABRICKS': '/databricks_logo.png',
    'STRIPE': '/stripe_logo.png',
    'IMPF': '/impossible_foods_logo.svg.png',
    'KLARNA': '/klarna-logo.png',
    'SPACEX': '/spacex-emplem.png',
    'DISCORD': '/discord1.png',
    'PLAID': '/plaid-logo.png',
    'CHIME': '/chime_thumb.png',
  };

  if (symbol && symbolMappings[symbol.toUpperCase()]) {
    return symbolMappings[symbol.toUpperCase()];
  }

  const lowerName = issuerName.toLowerCase().trim();

  if (variant === 'horizontal') {
    for (const [key, logo] of Object.entries(horizontalLogoMappings)) {
      if (lowerName === key || lowerName.includes(key)) {
        return logo;
      }
    }
  }

  for (const [key, logo] of Object.entries(logoMappings)) {
    if (lowerName === key || lowerName.includes(key)) {
      return logo;
    }
  }

  return null;
}

function extractDomain(issuerName: string): string | null {
  if (!issuerName) return null;

  const commonMappings: Record<string, string> = {
    'spacex': 'spacex.com',
    'space exploration': 'spacex.com',
    'stripe': 'stripe.com',
    'databricks': 'databricks.com',
    'klarna': 'klarna.com',
    'plaid': 'plaid.com',
    'chime': 'chime.com',
    'discord': 'discord.com',
    'impossible foods': 'impossiblefoods.com',
    'vanguard': 'vanguard.com',
    'charter hall': 'charterhall.com.au',
    'dimensional': 'dimensional.com',
    'commonwealth bank': 'commbank.com.au',
    'westpac': 'westpac.com.au',
    'anz': 'anz.com.au',
    'nab': 'nab.com.au',
    'national australia bank': 'nab.com.au',
    'macquarie': 'macquarie.com',
    'qbe': 'qbe.com',
    'telstra': 'telstra.com.au',
    'bhp': 'bhp.com',
    'rio tinto': 'riotinto.com',
    'wesfarmers': 'wesfarmers.com.au',
    'woolworths': 'woolworthsgroup.com.au',
    'coles': 'colesgroup.com.au',
    'transurban': 'transurban.com',
    'scentre': 'scentregroup.com',
    'stockland': 'stockland.com.au',
    'qic': 'qic.com',
    'amp': 'amp.com.au',
    'perpetual': 'perpetual.com.au',
    'magellan': 'magellangroup.com.au',
    'platinum': 'platinum.com.au',
    'hyperion': 'hyperion.com.au',
    'apple': 'apple.com',
    'barclays': 'barclays.com',
    'barclays plc': 'barclays.com',
    'australian government': 'treasury.gov.au',
    'bendigo': 'bendigobank.com.au',
    'bendigo bank': 'bendigobank.com.au',
    'deutsche bank': 'db.com',
    'bnp paribas': 'bnp-paribas.com',
    'hsbc': 'hsbc.com',
    'hsbc holdings': 'hsbc.com',
    'santander': 'santander.com',
    'banco santander': 'santander.com',
    'ubs': 'ubs.com',
    'ubs group': 'ubs.com',
    'ing': 'ing.com',
    'ing groep': 'ing.com',
    'unicredit': 'unicreditgroup.eu',
    'société générale': 'societegenerale.com',
    'societe generale': 'societegenerale.com',
    'credit suisse': 'credit-suisse.com',
    'standard chartered': 'sc.com',
  };

  const lowerName = issuerName.toLowerCase();

  for (const [key, domain] of Object.entries(commonMappings)) {
    if (lowerName.includes(key)) {
      return domain;
    }
  }

  const words = issuerName.toLowerCase().replace(/[^a-z\s]/g, '').split(' ');
  if (words.length > 0) {
    return `${words[0]}.com`;
  }

  return null;
}
