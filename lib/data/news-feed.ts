export interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: 'Markets' | 'Economics' | 'Bonds' | 'Crypto' | 'Company';
  published: string;
  url: string;
  summary: string;
}

export const newsItems: NewsItem[] = [
  {
    id: '1',
    title: 'Australian Banks Maintain Strong Credit Ratings Amid Economic Headwinds',
    source: 'Financial Review',
    category: 'Bonds',
    published: '2025-11-11T08:30:00',
    url: '#',
    summary: 'Major Australian banks including NAB, CBA, ANZ, and Westpac continue to hold AA- ratings from major agencies...'
  },
  {
    id: '2',
    title: 'Bitcoin Surges Past $95,000 as Institutional Adoption Accelerates',
    source: 'Bloomberg',
    category: 'Crypto',
    published: '2025-11-11T07:15:00',
    url: '#',
    summary: 'Bitcoin reached new all-time highs as pension funds and insurance companies increase digital asset allocations...'
  },
  {
    id: '3',
    title: 'RBA Holds Cash Rate at 4.35% as Inflation Shows Signs of Cooling',
    source: 'ABC News',
    category: 'Economics',
    published: '2025-11-10T14:30:00',
    url: '#',
    summary: 'The Reserve Bank of Australia maintained interest rates for the third consecutive month...'
  },
  {
    id: '4',
    title: 'European Bank Bonds Offer Attractive Yields as ECB Signals Rate Cuts',
    source: 'Reuters',
    category: 'Bonds',
    published: '2025-11-10T11:45:00',
    url: '#',
    summary: 'Bonds from BNP Paribas, Deutsche Bank, and Société Générale see increased demand...'
  },
  {
    id: '5',
    title: 'ASX 200 Reaches Record High on Resources Sector Strength',
    source: 'The Australian',
    category: 'Markets',
    published: '2025-11-10T09:00:00',
    url: '#',
    summary: 'Australian shares climbed to fresh records as mining giants BHP and Rio Tinto rally on China stimulus hopes...'
  },
  {
    id: '6',
    title: 'Gold Prices Stabilize Near $2,650 as Safe-Haven Demand Persists',
    source: 'Kitco News',
    category: 'Markets',
    published: '2025-11-09T16:20:00',
    url: '#',
    summary: 'Gold maintains elevated levels as geopolitical tensions and inflation concerns support precious metals...'
  },
  {
    id: '7',
    title: 'Ethereum Upgrade Successfully Deployed, Network Efficiency Improves',
    source: 'CoinDesk',
    category: 'Crypto',
    published: '2025-11-09T13:10:00',
    url: '#',
    summary: 'The latest Ethereum network upgrade reduces gas fees by 40% and improves transaction throughput...'
  },
  {
    id: '8',
    title: 'Commonwealth Bank Reports Strong Q1 Results, Maintains Dividend',
    source: 'Sydney Morning Herald',
    category: 'Company',
    published: '2025-11-08T08:00:00',
    url: '#',
    summary: 'CBA posted cash profit of $2.5 billion, exceeding analyst expectations...'
  }
];
