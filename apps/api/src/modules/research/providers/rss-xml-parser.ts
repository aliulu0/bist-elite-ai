export interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  source: string | null;
  description: string;
}

export interface RssFeed {
  title: string | null;
  items: RssItem[];
}

function decodeEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>(.*?)</${tag}>`, 'is'));
  return match ? decodeEntities(match[1].trim()) : '';
}

function extractSource(block: string): string | null {
  const match = block.match(/<source[^>]*>(.*?)<\/source>/is);
  return match ? decodeEntities(match[1].trim()) : null;
}

export function parseRssFeed(xml: string): RssFeed {
  const channelMatch = xml.match(/<channel>(.*?)<\/channel>/is);
  const channel = channelMatch ? channelMatch[1] : xml;

  const feedTitle = extractTag(channel, 'title') || null;

  const items: RssItem[] = [];
  const itemRegex = /<item>(.*?)<\/item>/gis;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(channel)) !== null) {
    const block = match[1];
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const pubDate = extractTag(block, 'pubDate');
    const description = extractTag(block, 'description');
    const source = extractSource(block);

    if (title || link) {
      items.push({ title, link, pubDate, source, description });
    }
  }

  return { title: feedTitle, items };
}
