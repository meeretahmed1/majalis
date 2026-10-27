export const FATH_AL_QAREEB_SLUG = "fath-al-qareeb";
export const FATH_AL_QAREEB_LEGACY_SLUG =
  "كتاب-فتح-القريب-المجيب-في-شرح-ألفاظ-التقريب";

export const AL_HIKAM_SLUG = "fadl-al-ilm";
export const AL_HIKAM_LEGACY_SLUGS = [
  "al-hikam",
  "al-hikam-al-ataiyyah",
  "الحكم-العطائية",
  "كتاب-الحكم-العطائية",
  "hikam-al-ataiyyah",
  "hikam",
];

export function normalizeBookSlug(slug: string) {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // Keep the original value if it is not valid percent-encoding.
  }

  if (decoded === FATH_AL_QAREEB_LEGACY_SLUG) {
    return FATH_AL_QAREEB_SLUG;
  }

  if (AL_HIKAM_LEGACY_SLUGS.includes(decoded)) {
    return AL_HIKAM_SLUG;
  }

  return decoded;
}
