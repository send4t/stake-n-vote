import cache, { CACHE_VIDEO_EXPIRATION_DURATION } from "@/app/lib/node-cache";

export async function fetchLatestVideo() {
  const playlistId = "PLtyd7v_I7PGlMekTepCvnf8WMKVR1nhLZ"; // Replace with your actual playlist ID
  const cacheKey = `latest-yt-video-${playlistId}`;

  const cachedVideo: any = cache.get(cacheKey);

  // Check if the cached video exists and has not expired
  if (
    cachedVideo &&
    Date.now() - cachedVideo.cachedAt < CACHE_VIDEO_EXPIRATION_DURATION
  ) {
    return cachedVideo;
  }

  const apiKey = "AIzaSyDxUpBqBVU7GSTYpDLuBZsHv0222gRF2Pg";
  const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1&key=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const data = await response.json();

    const video = data.items?.[0]?.snippet;

    if (!video) {
      throw new Error("No video found");
    }

    // Cache the fetched video before returning it
    cache.set(cacheKey, { ...video, cachedAt: Date.now() });
    return video;
  } catch (error) {
    let message: string;
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = "Something went wrong";
    }
    console.error(error);
    return { error: message };
  }
}