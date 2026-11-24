// The schema.org data of the prerendered pages, as one @graph per page. Every page names the same two entities by
// @id (the WebSite and the Person it belongs to), so search engines see one identity instead of a new, slightly
// different "الشيخ أشرف مازن" on each page. Only facts the site already holds are written: no ratings, no invented
// dates, no profiles that are not in the admin's social links.

export function makeSchema({ siteUrl, siteName, description, socials = [] }) {
  const url = (path) => `${siteUrl}${encodeURI(path)}`;
  const ids = { website: `${siteUrl}/#website`, person: `${siteUrl}/#person` };
  const sameAs = [...new Set(socials.map((s) => s.url).filter((u) => /^https:\/\//.test(u || '')))];

  const website = {
    '@type': 'WebSite',
    '@id': ids.website,
    url: `${siteUrl}/`,
    name: siteName,
    alternateName: ['موقع الشيخ أشرف مازن', 'Sheikh Ashraf Mazen'],
    description,
    inLanguage: 'ar',
    publisher: { '@id': ids.person },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  const person = {
    '@type': 'Person',
    '@id': ids.person,
    name: siteName,
    alternateName: ['أشرف مازن', 'أشرف بن طه مازن', 'أبو عبد الرحمن أشرف بن طه بن مازن', 'Ashraf Mazen'],
    url: `${siteUrl}/`,
    jobTitle: 'داعية وطالب علم',
    knowsLanguage: 'ar',
    mainEntityOfPage: { '@id': `${siteUrl}/` },
    ...(sameAs.length ? { sameAs } : {}),
  };

  const breadcrumbs = (path, items) => ({
    '@type': 'BreadcrumbList',
    '@id': `${url(path)}#breadcrumb`,
    itemListElement: [{ name: 'الرئيسية', path: '/' }, ...items].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: url(item.path),
    })),
  });

  // The page itself. `type` is WebPage, CollectionPage (a list of lessons or videos) or ItemPage (one lesson, video, book).
  const webPage = ({ path, type = 'WebPage', name, description: text, image, crumbs, date }) => ({
    '@type': type,
    '@id': url(path),
    url: url(path),
    name,
    ...(text ? { description: text } : {}),
    inLanguage: 'ar',
    isPartOf: { '@id': ids.website },
    about: { '@id': ids.person },
    ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: image } } : {}),
    ...(crumbs ? { breadcrumb: { '@id': `${url(path)}#breadcrumb` } } : {}),
    ...(date ? { datePublished: date } : {}),
  });

  // Google needs a name, a thumbnail and an upload date; without a known date no VideoObject is written
  const videoObject = ({ id, name, description: text, date, path }) =>
    date && !Number.isNaN(Date.parse(date))
      ? {
          '@type': 'VideoObject',
          '@id': `${url(path)}#video`,
          name,
          description: text || name,
          thumbnailUrl: [`https://i.ytimg.com/vi/${id}/hqdefault.jpg`],
          uploadDate: date,
          embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
          url: url(path),
          inLanguage: 'ar',
          author: { '@id': ids.person },
          isPartOf: { '@id': url(path) },
        }
      : null;

  // A lesson with a written text is an article by the sheikh (headline is limited to 110 characters by Google)
  const article = ({ path, title, text, date, image }) => ({
    '@type': 'Article',
    '@id': `${url(path)}#article`,
    headline: title.length > 110 ? `${title.slice(0, 109)}…` : title,
    ...(text ? { description: text } : {}),
    inLanguage: 'ar',
    author: { '@id': ids.person },
    publisher: { '@id': ids.person },
    mainEntityOfPage: { '@id': url(path) },
    ...(date ? { datePublished: date } : {}),
    ...(image ? { image: [image] } : {}),
  });

  const book = ({ path, title, author, image }) => ({
    '@type': 'Book',
    '@id': `${url(path)}#book`,
    name: title,
    url: url(path),
    inLanguage: 'ar',
    bookFormat: 'https://schema.org/EBook',
    ...(author ? { author: /مازن/.test(author) ? { '@id': ids.person } : { '@type': 'Person', name: author } } : {}),
    ...(image ? { image } : {}),
  });

  // The whole graph of one page: the site, the sheikh, then the page's own nodes
  const graph = (nodes) => ({ '@context': 'https://schema.org', '@graph': [website, person, ...nodes.filter(Boolean)] });

  return { ids, website, person, breadcrumbs, webPage, videoObject, article, book, graph };
}
