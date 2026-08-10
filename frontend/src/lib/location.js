/**
 * The studio location is stored as one free-form line in Site settings,
 * for example "Pune, Maharashtra · India".
 *
 * Different parts of the site want different amounts of it — the nav wants
 * a city, the contact page wants the whole line — so the pieces are derived
 * here rather than asking the admin to fill in three separate fields that
 * could drift apart.
 *
 * Segments may be separated by commas or the middot used in the settings
 * placeholder, and stray spaces around them are tolerated.
 */

function segments(location) {
  if (typeof location !== "string") return [];
  return location
    .split(/[,·]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** "Pune, Maharashtra · India" → "Pune". Empty string when unset. */
export function cityOf(location) {
  return segments(location)[0] ?? "";
}

/** "Pune, Maharashtra · India" → "India". Empty when only one segment. */
export function countryOf(location) {
  const parts = segments(location);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

/**
 * "Pune, Maharashtra · India" → "Pune · India"; falls back to whatever
 * single part exists so the nav never renders a bare separator.
 */
export function shortLocation(location) {
  const city = cityOf(location);
  const country = countryOf(location);
  if (city && country) return `${city} · ${country}`;
  return city || country;
}
