export interface Post {
  id?: string;
  caption: string | null;
  description: string | null;
  creatorId: string;
  creatorName: string;
  creatorProfileImg?: string | null;
  creationDate: string;
  files: Array<string>;
  comments: Array<string>;
  likes: number;
  identifier: string | null;
  isPrivate: boolean;
  isAnnouncement: boolean;
  hasTimer: boolean;
  timerValue: number | null;
}

export interface CollectionTimelinePostModal {
  id?: string;
  accountId: string | null;
  creationDate: string;
  collectionKnifeCoverPhoto: string;
  collectionKnifeDisplayName: string;
  galleryFiles: Array<string>;
  postType: string;
  postTags: Array<string>;
}

export interface PostCover {
  id: string;
  caption: string | null;
  coverFile: string | null;   // S3 URL or null
  comments: number;
  likes: number;
  identifier: string | null;  // post type / tag label
  mediaCount: number;         // total number of media files on the post
  creationDate: string | null;
  isPrivate: boolean;
  isAnnouncement: boolean;
}

/**
 * Extracts the first usable URL string from a field that may be:
 *  - a plain string                     → "https://..."
 *  - an array of plain strings          → ["https://...", ...]
 *  - an array of media objects          → [{ url: "https://...", video: false }, ...]
 */
const pickUrl = (v: any): string | null => {
  if (typeof v === "string" && v.length > 0) return v;
  if (Array.isArray(v) && v.length > 0) {
    const first = v[0];
    if (typeof first === "string" && first.length > 0) return first;
    // backend returns { url, video } media objects
    if (first && typeof first === "object" && typeof first.url === "string" && first.url.length > 0)
      return first.url;
  }
  return null;
};

// ── Per-file media item (new backend shape) ───────────────────────────────────
export interface MediaFile {
  url: string;
  isVideo: boolean;
  description: string | null;
  referenceKnifeId: number | null;
  referenceKnife: PostKnifeRef | null;
}

const VIDEO_EXT = /\.(mp4|mov|avi|webm|mkv|m4v)(\?.*)?$/i;

/**
 * Converts a raw mediaFiles array (string[] legacy OR {url,isVideo,description}[] new)
 * to MediaFile[]. Falls back to URL extension sniffing when isVideo is absent.
 */
const extractMediaFiles = (arr: any[]): MediaFile[] =>
  arr
    .map((item): MediaFile | null => {
      if (typeof item === "string" && item.length > 0)
        return { url: item, isVideo: VIDEO_EXT.test(item), description: null, referenceKnifeId: null, referenceKnife: null };
      if (item && typeof item === "object" && typeof item.url === "string" && item.url.length > 0)
        return {
          url: item.url,
          isVideo: typeof item.isVideo === "boolean" ? item.isVideo : typeof item.video === "boolean" ? item.video : VIDEO_EXT.test(item.url),
          description: item.description ?? null,
          referenceKnifeId: item.referenceKnifeId ?? null,
          referenceKnife: normalizeKnifeRef(item.referenceKnife ?? null),
        };
      return null;
    })
    .filter((m): m is MediaFile => m !== null);

/**
 * Maps a raw backend response to PostCover.
 * Backend returns { post: {...}, author: {...} } — falls back to flat object for safety.
 */
export const mapPostCover = (data: any): PostCover => {
  const p = data.post ?? data;   // post fields
  return {
    id:             p.id             ?? "",
    caption:        p.caption        ?? null,
    coverFile:      pickUrl(p.coverFile)
                    ?? pickUrl(p.coverPhoto)
                    ?? pickUrl(p.thumbnailUrl)
                    ?? pickUrl(p.coverPhotoUrl)
                    ?? pickUrl(p.mediaFiles)
                    ?? pickUrl(p.files)
                    ?? null,
    comments:       p.commentCount   ?? p.comments   ?? 0,
    likes:          p.likeCount      ?? p.likes      ?? 0,
    identifier:     p.identifier     ?? p.postType   ?? null,
    mediaCount:     (p.mediaFiles    ?? p.files      ?? []).length,
    creationDate:   p.creationDate   ?? null,
    isPrivate:      p.isPrivate      ?? false,
    isAnnouncement: p.isAnnouncement ?? false,
  };
};

export interface PostPreview {
  id: string;
  caption: string;
  description: string;
  creatorName: string;
  creatorProfileImg?: string | null;
  creationDate: string;
  files: Array<File>;
  likes: number;
  identifer: string | null;
  isAnnouncement: boolean;
  isPrivatePost: boolean;
  hasTimer: boolean;
  timeInHours: string;
}

// ── Post knife reference (embedded in post detail responses) ─────────────────
export interface PostKnifeRef {
  id: string | null;
  displayName: string;
  knifeMaker: string;
  baseKnifeModel: string | null;
  coverPhoto: string | null;
}

const normalizeKnifeRef = (raw: any): PostKnifeRef | null => {
  if (!raw) return null;
  const ref: PostKnifeRef = {
    id:             raw.id            ?? null,
    displayName:    raw.displayName   ?? raw.name         ?? "",
    knifeMaker:     raw.knifeMaker    ?? raw.maker        ?? raw.brand       ?? "",
    baseKnifeModel: raw.baseKnifeModel ?? raw.model       ?? raw.baseModel   ?? null,
    coverPhoto:     raw.coverPhoto    ?? raw.coverPhotoUrl ?? raw.imageUrl   ?? raw.photo ?? raw.thumbnailUrl ?? null,
  };
  // Treat an effectively empty object (no id, no name) as absent
  if (!ref.id && !ref.displayName) return null;
  return ref;
};

// ── Full post detail (for the post page) ─────────────────────────────────────
export interface PostDetail {
  id: string;
  accountId: string;            // creator's account ID — used to detect ownership
  postType: string;             // GENERIC | BUY_SELL | TRADE | TRICK_TUTORIAL | COMBO
  caption: string;
  description: string | null;
  mediaFiles: MediaFile[];
  tags: string[];               // GENERIC tags (SCREAMING_SNAKE_CASE from backend)
  // Creator
  creatorDisplayName: string;
  creatorIdentifierCode: string | null;
  creatorProfileImg: string | null;
  creationDate: string;
  // Stats
  likes: number;
  comments: number;
  // BUY_SELL
  mode: string | null;          // "BUYING" | "SELLING"
  price: string | null;
  offeringKnife: PostKnifeRef | null;   // SELLING and TRADE
  // TRADE
  lookingForText: string | null;
  lookingForImageUrl: string | null;
  // TRICK_TUTORIAL / COMBO
  difficultyTag: string | null;
  techniqueTags: string[];
  // GENERIC / other — optional reference knife
  referenceKnife: PostKnifeRef | null;
  isPrivate: boolean;
  isAnnouncement: boolean;
}

/**
 * Maps a raw backend response to PostDetail.
 * Backend returns { post: {...}, author: {...} } — falls back to flat object for safety.
 */
export const mapPostDetail = (data: any): PostDetail => {
  const p = data.post   ?? data;   // post fields
  const a = data.author ?? null;   // null when account was deleted
  return {
    id:                    p.id                   ?? "",
    accountId:             p.accountId            ?? a?.accountId ?? p.creatorId ?? "",
    postType:              p.postType              ?? "GENERIC",
    caption:               p.caption              ?? "",
    description:           p.description          ?? null,
    mediaFiles:            extractMediaFiles(p.mediaFiles ?? p.files ?? []),
    tags:                  p.tags                 ?? [],
    creatorDisplayName:    a?.displayName         ?? p.creatorDisplayName ?? p.creatorName ?? "[deleted]",
    creatorIdentifierCode: a?.identifierCode      ?? p.creatorIdentifierCode ?? null,
    creatorProfileImg:     a?.profileImg          ?? p.creatorProfileImg   ?? null,
    creationDate:          p.creationDate         ?? "",
    likes:                 p.likeCount            ?? p.likes    ?? 0,
    comments:              p.commentCount         ?? p.comments ?? 0,
    mode:                  p.mode                 ?? null,
    price:                 p.price                ?? null,
    offeringKnife:         normalizeKnifeRef(data.offeringKnife ?? p.offeringKnife ?? p.offeredKnife ?? p.tradingKnife ?? p.listedKnife ?? null),
    lookingForText:        p.lookingForText        ?? null,
    lookingForImageUrl:    p.lookingForImageUrl   ?? p.lookingForImage ?? p.lookingForImg ?? null,
    difficultyTag:         p.difficultyTag        ?? null,
    techniqueTags:         p.techniqueTags        ?? [],
    referenceKnife:        normalizeKnifeRef(
                             data.referenceKnife   ?? data.taggedKnife      ?? data.collectionKnife ??
                             p.referenceKnife      ?? p.taggedKnife         ?? p.collectionKnife    ??
                             p.referencedKnife     ?? p.linkedKnife         ?? p.knife              ?? null
                           ),
    isPrivate:             p.isPrivate            ?? false,
    isAnnouncement:        p.isAnnouncement       ?? false,
  };
};

export interface CreationPostDTO {
  caption: string;
  description: string;
  creatorId: string;
  identifier: string;
  isPrivatePost: boolean;
  isAnnouncement: boolean;
  hasTimer: boolean;
  timerInHours: string;
}
