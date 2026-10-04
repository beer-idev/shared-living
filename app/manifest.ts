import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Shared Living",
    short_name: "Shared Living",
    description: "Shared bills, fair chores, and a happier home.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f9fb",
    theme_color: "#17291f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
