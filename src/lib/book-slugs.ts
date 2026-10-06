export const FATH_AL_QAREEB_SLUG = "fath-al-qareeb";
export const FATH_AL_QAREEB_LEGACY_SLUG =
  "كتاب-فتح-القريب-المجيب-في-شرح-ألفاظ-التقريب";

export function normalizeBookSlug(slug: string) {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // Keep the original value if it is not valid percent-encoding.
  }

  return decoded === FATH_AL_QAREEB_LEGACY_SLUG
    ? FATH_AL_QAREEB_SLUG
    : decoded;
}
