import { createHash } from 'node:crypto';

export const SOURCE = 'https://www.tevisuals.com';
const TTL = 60_000;
export class LibraryError extends Error {
  constructor(message, status = 503) { super(message); this.status = status; }
}
const text = value => typeof value === 'string' ? value.trim() : '';
const safeId = value => /^[a-zA-Z0-9_-]{1,100}$/.test(text(value));

// Only the source's preview locations are accepted. Never accept arbitrary URLs
// from a visitor, or use original/download object keys as a fallback.
export function previewSource(photo) {
  for (const raw of [photo.publicUrl, photo.proxyUrl]) {
    try {
      const url = new URL(raw);
      if (url.protocol !== 'https:' || url.username || url.password) continue;
      if (url.origin === 'https://cdn.tevisuals.com' && url.pathname.startsWith('/public/portfolio/')) return url.href;
      if (['https://www.tevisuals.com', 'https://tevisuals.com'].includes(url.origin) && url.pathname === '/api/r2-image') return url.href;
    } catch {}
  }
  return null;
}

export function makeCatalog(rows, generatedAt) {
  const groups = new Map(), records = new Map();
  for (const row of rows) {
    if (row.photographer !== 'tom' || !safeId(row.photoId) || !safeId(row.galleryId)) continue;
    const source = previewSource(row);
    if (!source || records.has(row.photoId)) continue;
    const galleryUrl = new URL(`/portfolio/${encodeURIComponent(row.category)}/${encodeURIComponent(row.gallerySlug)}`, SOURCE);
    const photoUrl = new URL(galleryUrl); photoUrl.searchParams.set('photo', row.photoId);
    const buyUrl = new URL(photoUrl); buyUrl.searchParams.set('buy', 'personal');
    const commercialUrl = new URL(photoUrl); commercialUrl.searchParams.set('buy', 'commercial');
    // Revision excludes temporary signed tokens; new content/order still changes the catalog hash.
    const revision = createHash('sha256').update(['wordmark-v2',row.photoId,row.publicUrl || '',row.width,row.height,row.createdAt].join('|')).digest('hex').slice(0,16);
    const image = `/api/photo-preview?id=${encodeURIComponent(row.photoId)}&v=${revision}`;
    const caption = text(row.techCaption), parts = caption.split('•').map(x=>x.trim()).filter(Boolean);
    const timestamp = Date.parse(row.capturedAt);
    const photo = {
      id: row.photoId, name: text(row.filename), url: image+'&size=large', thumbnailUrl: image+'&size=thumb',
      available: true, width: row.width, height: row.height,
      camera: parts[0] || '', lens: parts[1] || '', settings: parts.slice(2).join(' · '), techCaption: caption,
      capturedAt: row.capturedAt || null,
      date: Number.isFinite(timestamp) ? new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(timestamp) : '',
      section: text(row.sectionTitle), displayOrder: Number(row.displayOrder)||0,
      watermarkRequired: true, sourceUrl: photoUrl.href, buyUrl: buyUrl.href, commercialUrl: commercialUrl.href,
      prices: row.prices && typeof row.prices.currency === 'string' ? {personalCents:row.prices.personalCents,commercialCents:row.prices.commercialCents,currency:row.prices.currency} : null
    };
    records.set(row.photoId, { source, revision, photo });
    if (!groups.has(row.galleryId)) groups.set(row.galleryId, {
      id: row.galleryId, name: text(row.galleryTitle), title: text(row.galleryTitle), event: text(row.galleryTitle),
      category: text(row.category), sourceUrl: galleryUrl.href, coverId: row.coverPhotoId, photos: []
    });
    groups.get(row.galleryId).photos.push(photo);
  }
  const collections = [...groups.values()].map(group => {
    group.photos.sort((a,b)=>a.displayOrder-b.displayOrder || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    const cover = group.photos.find(p=>p.id===group.coverId) || group.photos[0];
    group.coverUrl = cover.url; group.category = group.category.replace(/^./, x=>x.toUpperCase());
    return group;
  }).sort((a,b)=>a.title.localeCompare(b.title));
  const version = createHash('sha256').update(JSON.stringify(collections)).digest('hex');
  return {records, public: {collections,version,generatedAt,source:SOURCE+'/photographer/tom',refreshAfterSeconds:60}};
}

export function createLibrary({fetcher=fetch, clock=Date.now, getKey=()=>process.env.FOT_SYNC_API_KEY?.trim()}={}) {
  let cached, expires=0, pending;
  async function refresh() {
    const key=getKey();
    if(!key) throw new LibraryError('Photo sync is not configured.');
    const photos=[], seen=new Set(); let cursor=null, generatedAt;
    for(let page=0;page<100;page++) {
      const url=new URL('/api/sync/focused-on-tom/manifest',SOURCE);url.searchParams.set('limit','500');
      if(cursor)url.searchParams.set('cursor',cursor);
      const response=await fetcher(url,{headers:{Authorization:`Bearer ${key}`},redirect:'error',signal:AbortSignal.timeout(20_000)});
      if(!response.ok)throw new LibraryError('The photo source is temporarily unavailable.');
      const data=await response.json();
      if(!Array.isArray(data.photos)||!data.pageInfo)throw new LibraryError('Invalid photo source response.');
      photos.push(...data.photos);generatedAt=data.generatedAt;
      if(!data.pageInfo.hasMore) {
        const result=makeCatalog(photos,generatedAt);cached=result;expires=clock()+TTL;return result;
      }
      const next=data.pageInfo.nextCursor;
      if(typeof next!=='string'||!next||seen.has(next))throw new LibraryError('Invalid photo source pagination.');
      seen.add(next);cursor=next;
    }
    throw new LibraryError('Photo source exceeded the page limit.');
  }
  return async function getLibrary() {
    if(cached&&clock()<expires)return cached;
    // Short-lived process cache is only an optimization; every instance can rebuild
    // the complete source. Expired data is never served after a failed refresh.
    if(!pending)pending=refresh().finally(()=>{pending=null});
    return pending;
  };
}
export const getLibrary=createLibrary();
