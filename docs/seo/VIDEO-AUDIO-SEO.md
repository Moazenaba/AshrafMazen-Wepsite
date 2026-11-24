# Video and audio SEO

## Video pages (375 channel videos + lesson videos)

| Requirement (Google video indexing) | State | Where |
|---|---|---|
| A watch page per video, with the video as the main content | `/video/{id}` (prerendered) and `/lesson/{id}` | `scripts/prerender.mjs` |
| Title | the YouTube title without the hashtag tail (`cleanVideoTitle`) + «- الشيخ أشرف مازن» when the name is not already in it | `src/lib/seoText.ts` |
| Description | «{title} - من «{playlist}» للشيخ أشرف مازن.»; lessons use their written text | `videoDescription` |
| Thumbnail | `https://i.ytimg.com/vi/{id}/hqdefault.jpg` (CSP `img-src https:` allows it) | `seoSchema.videoObject`, sitemap |
| uploadDate | from `published` in the library (146 videos) or the lesson's `published_at` | **229 videos have none → no VideoObject on those pages** |
| embedUrl / player_loc | `https://www.youtube-nocookie.com/embed/{id}` | |
| Video sitemap | `<video:video>` in `sitemap.xml` and in the live `sitemap-videos.xml` | `generate-sitemap.mjs`, `api/_sitemapVideos.ts` |
| Not added | `duration`, `interactionStatistic`, `contentUrl` | not held by the site; never guessed |

Internal links on a video page: its playlist, the previous and next video in that playlist, and up to 20 more from the playlist.

### The biggest open lever: upload dates

`npm run refresh:youtube` (see CLAUDE.md) reads the channel; when it can return each video's publish date, store it as `published` in `src/data/youtube-library.ts` and every remaining video gets a `VideoObject` automatically on the next build. Do not fill dates by hand from titles.

## Audio

Audio lives on lessons (`lessons.audio_url`) and is listed on `/audio` (CollectionPage). An audio lesson's page carries the lesson's title, series, breadcrumb, and its written text when one exists. There is no separate `/audio/{id}` URL: one lesson = one canonical page for its video, audio and text, which avoids three thin duplicates of the same lesson.

Not done on purpose: `AudioObject`/`PodcastEpisode` markup (no Google rich result uses it for this kind of page) and invented transcripts.

## What would raise video and audio visibility most (content, by the owner)

1. Written text (تفريغ) for lessons: it becomes the page's body, description and an `Article` node.
2. A one-paragraph description per playlist on YouTube (the site can then show it; today playlists have only a title).
3. Rename the duplicate playlist «دعائم منهاج النبوة».
