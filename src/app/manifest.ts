import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "مجالس — من المجلس إلى الحياة",
    short_name: "مجالس",
    description: "منصة تعليمية عربية لدراسة الكتب التراثية والإسلامية مجلساً مجلساً مع الخرائط الذهنية والبطاقات الذكية.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F4EFE3",
    theme_color: "#1F3D2B",
    lang: "ar",
    dir: "rtl",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
