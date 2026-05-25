const YOUTUBE_ID_PATTERN = /(?:youtube\.com\/(?:watch\?v=|shorts\/|v\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg|mov)(?:[?#]|$)/i;

export function toEmbedUrl(url) {
  if (!url || typeof url !== 'string') return url;

  const trimmed = url.trim();

  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    if (trimmed.includes('youtube.com/embed/')) return trimmed;

    const match = trimmed.match(YOUTUBE_ID_PATTERN);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }

  return trimmed;
}

export function getVideoSourceUrl(video) {
  if (!video) return '';
  if (typeof video === 'string') return video.trim();

  return (video.video_url || video.embed_url || video.embedUrl || video.url || '').trim();
}

export function getVideoProvider(url) {
  if (!url || typeof url !== 'string') return 'unknown';

  const trimmed = url.trim();

  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) return 'youtube';
  if (trimmed.includes('drive.google.com')) return 'google-drive';
  if (DIRECT_VIDEO_PATTERN.test(trimmed)) return 'direct';

  return 'unknown';
}

export function getGoogleDriveViewUrl(url) {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/view`;

  const openMatch = trimmed.match(/[?&]id=([^&]+)/);
  if (openMatch) return `https://drive.google.com/file/d/${openMatch[1]}/view`;

  return trimmed;
}

export function getVideoThumbnailUrl(video) {
  if (!video) return '';

  const explicitThumbnail = video.thumbnail_url || video.thumbnailUrl || video.image_url || video.imageUrl;
  if (explicitThumbnail) return explicitThumbnail;

  const source = getVideoSourceUrl(video);
  if (!source) return '';

  const match = source.match(YOUTUBE_ID_PATTERN);

  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
}
