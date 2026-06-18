// stickerApi.js — fetch OFX sticker categories used by the in-game picker.
// Mirrors the RN endpoints (see src/core/routes/index.js and src/core/api.js).
// `type` is "self" (own seat) or "opponent" (other seats).
//
// Auth-server URL is overridable via REACT_APP_AUTH_SERVICE; default points at
// the same production host the React Native app uses.
const AUTH_SERVICE =
  process.env.REACT_APP_AUTH_SERVICE || "https://poker-auth-api.onsdlc.cloud";

const POST = async (url, body, token) => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const getAllActiveStickersCategories = async (
  { page = 1, limit = 10, type = "self" } = {},
  token
) => {
  try {
    return await POST(
      `${AUTH_SERVICE}/v1/sticker/active-categories`,
      { page, limit, type },
      token
    );
  } catch (e) {
    console.log("[stickerApi] active-categories error", e?.message);
    return null;
  }
};

export const addRecentSticker = async ({ stickerId, type }, token) => {
  try {
    return await POST(
      `${AUTH_SERVICE}/v1/sticker/recent`,
      { stickerId, type },
      token
    );
  } catch (e) {
    console.log("[stickerApi] addRecentSticker error", e?.message);
    return null;
  }
};
