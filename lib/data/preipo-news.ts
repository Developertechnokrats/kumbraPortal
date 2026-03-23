export interface PreIPONews {
  id: string;
  companyName: string;
  headline: string;
  source: string;
  sourcelogo: string;
  imageUrl: string;
  published: string;
  url: string;
  content: string;
  category: 'funding' | 'growth' | 'product' | 'partnership' | 'market';
}

export const preIPONewsItems: PreIPONews[] = [
  {
    id: '1',
    companyName: 'SpaceX',
    headline: 'SpaceX Successfully Launches 50th Starship Mission, Expanding Global Internet Coverage',
    source: 'TechCrunch',
    sourcelogo: 'https://logo.clearbit.com/techcrunch.com',
    imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800',
    published: '2024-12-15T10:30:00',
    url: '#',
    category: 'growth',
    content: `SpaceX has achieved another milestone with the successful launch of its 50th Starship mission, significantly expanding Starlink's global internet coverage. The mission deployed 60 advanced satellites into low Earth orbit, bringing high-speed internet to previously underserved regions across South America and Africa.

CEO Elon Musk announced that Starlink now serves over 3 million active subscribers worldwide, with revenue growth exceeding 200% year-over-year. Industry analysts suggest this positions SpaceX favorably ahead of a potential public offering, with the company's valuation now estimated at $180 billion.

The successful mission also included the first-ever mid-flight refueling demonstration, a critical technology for future Mars missions. SpaceX's reusable rocket technology has reduced launch costs by 90% compared to traditional methods, establishing the company as the dominant player in the commercial space industry.`
  },
  {
    id: '2',
    companyName: 'Stripe',
    headline: 'Stripe Expands to 20 New Markets, Processing $1 Trillion Annually',
    source: 'Financial Times',
    sourcelogo: 'https://logo.clearbit.com/ft.com',
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    published: '2024-12-14T14:20:00',
    url: '#',
    category: 'growth',
    content: `Stripe announced its expansion into 20 new markets across Asia-Pacific and Latin America, reinforcing its position as the world's leading payment infrastructure provider. The company now processes over $1 trillion in payments annually, serving more than 4 million businesses globally.

The expansion includes partnerships with major local banks and payment providers, enabling seamless cross-border transactions with lower fees. Stripe's revenue has grown 35% year-over-year, reaching $16 billion annually, with the company maintaining profitability for the past three consecutive quarters.

CEO Patrick Collison stated that the company is "building the financial infrastructure for the internet" and highlighted new AI-powered fraud detection tools that have reduced chargebacks by 40%. Market sources suggest Stripe is preparing for a public listing in late 2025, with a potential valuation exceeding $70 billion.`
  },
  {
    id: '3',
    companyName: 'Databricks',
    headline: 'Databricks AI Platform Adoption Soars, Secures $500M Enterprise Contracts',
    source: 'Bloomberg',
    sourcelogo: 'https://logo.clearbit.com/bloomberg.com',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    published: '2024-12-13T09:15:00',
    url: '#',
    category: 'growth',
    content: `Databricks reported explosive growth in its AI and data analytics platform, announcing $500 million in new enterprise contracts with Fortune 500 companies including JPMorgan Chase, Shell, and Unilever. The lakehouse platform now processes over 10 exabytes of data monthly for its customers.

The company's annual recurring revenue (ARR) has reached $2.4 billion, growing 60% year-over-year, making it one of the fastest-growing enterprise software companies. Databricks' unified data and AI platform has become critical infrastructure for organizations building large language models and AI applications.

Industry analysts note that Databricks is well-positioned in the rapidly expanding AI infrastructure market, projected to reach $200 billion by 2027. The company recently raised funding at a $43 billion valuation and is expected to pursue an IPO in the first half of 2025.`
  },
  {
    id: '4',
    companyName: 'Discord',
    headline: 'Discord Reaches 200 Million Monthly Active Users, Launches Business Tools',
    source: 'The Verge',
    sourcelogo: 'https://logo.clearbit.com/theverge.com',
    imageUrl: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800',
    published: '2024-12-12T16:45:00',
    url: '#',
    category: 'product',
    content: `Discord announced it has surpassed 200 million monthly active users, doubling its user base in just 18 months. The communication platform, originally focused on gaming communities, has successfully expanded into education, business collaboration, and creator communities.

The company launched Discord for Business, a premium suite of tools for professional collaboration including enhanced security, advanced moderation, and analytics. Early adopters include tech companies, creative agencies, and remote-first startups. This new revenue stream complements Discord's Nitro subscription service, which now has 15 million paying subscribers.

Discord's revenue has reached $600 million annually, with the company achieving positive EBITDA for the first time. CEO Jason Citron emphasized the platform's unique positioning as a community-first alternative to traditional social media, which has resonated with younger demographics and created sustainable engagement patterns.`
  },
  {
    id: '5',
    companyName: 'Klarna',
    headline: 'Klarna Returns to Profitability, Buy Now Pay Later Transactions Surge 45%',
    source: 'Reuters',
    sourcelogo: 'https://logo.clearbit.com/reuters.com',
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    published: '2024-12-11T11:30:00',
    url: '#',
    category: 'growth',
    content: `Swedish fintech giant Klarna reported a return to profitability with net income of $120 million for Q3 2024, marking a significant turnaround after restructuring efforts. Buy now, pay later (BNPL) transactions surged 45% year-over-year, reaching $80 billion in gross merchandise value.

The company has successfully reduced operating costs by 25% through AI automation while improving credit risk models that decreased bad debt by 30%. Klarna now serves 150 million active consumers and 500,000 merchant partners globally, including major retailers like H&M, Nike, and IKEA.

CEO Sebastian Siemiatkowski announced plans for a US IPO in Q2 2025, positioning Klarna as a leader in the rapidly growing $680 billion BNPL market. The company's innovative AI shopping assistant has driven 40% of new customer acquisitions, demonstrating the effectiveness of technology-driven growth strategies.`
  },
  {
    id: '6',
    companyName: 'Databricks',
    headline: 'Databricks Partners with Microsoft, AWS to Enhance Enterprise AI Capabilities',
    source: 'VentureBeat',
    sourcelogo: 'https://logo.clearbit.com/venturebeat.com',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    published: '2024-12-10T13:00:00',
    url: '#',
    category: 'partnership',
    content: `Databricks announced strategic partnerships with Microsoft Azure and Amazon Web Services to deliver integrated AI and data analytics solutions. The collaborations will enable seamless deployment of Databricks' lakehouse platform across both cloud providers' ecosystems.

These partnerships represent a significant validation of Databricks' technology and market position. The integrations will allow joint customers to leverage advanced AI capabilities, including custom model training, data governance, and real-time analytics at scale.

The agreements include co-marketing initiatives and joint go-to-market strategies, expected to drive $1 billion in additional annual revenue. This strategic positioning strengthens Databricks' competitive advantage against traditional data warehousing solutions and positions the company as a critical infrastructure provider in the enterprise AI stack.`
  }
];
