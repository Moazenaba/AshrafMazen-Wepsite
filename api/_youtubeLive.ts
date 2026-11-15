// Reads a YouTube watch page and says whether the channel we expect is broadcasting live on it right now.
// The channel's own address (youtube.com/channel/<id>/live) sends the browser to the watch page of its live
// broadcast when there is one, and stays on the channel page when there is not; either way this decides from the page itself.
// Pure function: the function that fetches the page is in live.ts.

export interface LiveNow {
  videoId: string;
  title: string;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

// The JSON object that starts right after `marker`, cut out by counting braces (strings and escapes respected),
// since the text after it differs between YouTube layouts
function objectAfter(html: string, marker: string): unknown {
  const at = html.indexOf(marker);
  if (at < 0) return null;
  const start = html.indexOf('{', at + marker.length);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      try {
        return JSON.parse(html.slice(start, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

// The live broadcast of `channelId` that the page shows, or null: not live now (an ended or upcoming one does not
// count), a video of another channel, or a page that is not a watch page
export function parseLiveNow(html: string, channelId: string): LiveNow | null {
  if (!CHANNEL_ID.test(channelId)) return null;
  const player = objectAfter(html, 'ytInitialPlayerResponse') as any;
  const details = player?.videoDetails;
  const broadcast = player?.microformat?.playerMicroformatRenderer?.liveBroadcastDetails;
  if (!details || details.channelId !== channelId) return null;
  if (!VIDEO_ID.test(String(details.videoId))) return null;
  const live = broadcast?.isLiveNow === true || (details.isLive === true && broadcast?.isLiveNow !== false);
  return live ? { videoId: details.videoId, title: String(details.title ?? '').replace(/\s+/g, ' ').trim().slice(0, 150) } : null;
}

// Whether this is a YouTube page we understand at all (it carries the player or page data). A consent page, an error
// page or a changed layout does not, and then "no live" must not be taken as a real answer.
export function looksLikeYoutubePage(html: string): boolean {
  return html.includes('ytInitialData') || html.includes('ytInitialPlayerResponse');
}
