import { parseRssFeed } from './rss-xml-parser';

describe('parseRssFeed', () => {
  const sample = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Google News Türkiye</title>
    <item>
      <title><![CDATA[Aselsan rekor kâr açıkladı]]></title>
      <link>https://news.google.com/rss/articles/abc123</link>
      <guid isPermaLink="false">abc123</guid>
      <pubDate>Sat, 01 Aug 2026 10:00:00 GMT</pubDate>
      <source url="https://example.com">Example News</source>
    </item>
    <item>
      <title>BIST yükselişle kapandı &amp; rekor tazeledi</title>
      <link>https://news.google.com/rss/articles/def456</link>
      <guid isPermaLink="false">def456</guid>
      <pubDate>Fri, 31 Jul 2026 18:30:00 GMT</pubDate>
      <source url="https://other.com">Other News</source>
    </item>
  </channel>
</rss>`;

  it('should parse channel title and items', () => {
    const feed = parseRssFeed(sample);
    expect(feed.title).toBe('Google News Türkiye');
    expect(feed.items).toHaveLength(2);
  });

  it('should decode CDATA and entities', () => {
    const feed = parseRssFeed(sample);
    expect(feed.items[0].title).toBe('Aselsan rekor kâr açıkladı');
    expect(feed.items[1].title).toBe('BIST yükselişle kapandı & rekor tazeledi');
  });

  it('should extract link, pubDate and source', () => {
    const feed = parseRssFeed(sample);
    expect(feed.items[0].link).toBe('https://news.google.com/rss/articles/abc123');
    expect(feed.items[0].pubDate).toBe('Sat, 01 Aug 2026 10:00:00 GMT');
    expect(feed.items[0].source).toBe('Example News');
  });

  it('should return empty items for empty xml', () => {
    const feed = parseRssFeed('<rss></rss>');
    expect(feed.items).toHaveLength(0);
  });
});
