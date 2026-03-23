'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, ExternalLink } from 'lucide-react';
import { PreIPONews } from '@/lib/data/preipo-news';
import { formatDistanceToNow } from 'date-fns';

interface NewsFeedProps {
  newsItems: PreIPONews[];
  className?: string;
}

export function NewsFeed({ newsItems, className }: NewsFeedProps) {
  const [selectedNews, setSelectedNews] = useState<PreIPONews | null>(null);

  const getCategoryColor = (category: string) => {
    const colors = {
      funding: 'bg-green-500/10 text-green-700 border-green-500/20',
      growth: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      product: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      partnership: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
      market: 'bg-pink-500/10 text-pink-700 border-pink-500/20',
    };
    return colors[category as keyof typeof colors] || colors.market;
  };

  return (
    <>
      <div className={className}>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Latest Pre-IPO News</h3>
            <Badge variant="outline" className="text-xs">Live</Badge>
          </div>

          <div className="space-y-3">
            {newsItems.map((news) => (
              <Card
                key={news.id}
                className="cursor-pointer hover:shadow-lg transition-all group border hover:border-primary/50"
                onClick={() => setSelectedNews(news)}
              >
                <CardContent className="p-0">
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={news.imageUrl}
                      alt={news.headline}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={getCategoryColor(news.category)} variant="outline">
                        {news.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <img
                        src={news.sourcelogo}
                        alt={news.source}
                        className="h-4 w-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="font-medium">{news.source}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(news.published), { addSuffix: true })}</span>
                    </div>

                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {news.headline}
                    </h4>

                    <div className="flex items-center justify-between pt-1">
                      <Badge variant="secondary" className="text-xs">
                        {news.companyName}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedNews && (
            <>
              <DialogHeader>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(selectedNews.category)}>
                      {selectedNews.category}
                    </Badge>
                    <Badge variant="outline">{selectedNews.companyName}</Badge>
                  </div>
                  <DialogTitle className="text-2xl leading-tight">{selectedNews.headline}</DialogTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={selectedNews.sourcelogo}
                        alt={selectedNews.source}
                        className="h-4 w-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="font-medium">{selectedNews.source}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(selectedNews.published), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="relative h-64 overflow-hidden rounded-lg">
                  <img
                    src={selectedNews.imageUrl}
                    alt={selectedNews.headline}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="prose prose-sm max-w-none">
                  {selectedNews.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-sm leading-relaxed text-foreground mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
