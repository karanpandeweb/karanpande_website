// A read-only safety net for previews and temporary API outages. The CMS remains
// the source of truth whenever it responds successfully.
export const FALLBACK_SETTINGS = {
  hero_video_url: "",
  hero_poster_url: "/assets/placeholders/ai-hero-wedding.jpg",
  hero_headline_1: "Stories that feel",
  hero_headline_2: "like your own.",
  hero_subtitle: "Wedding photographs and films made with instinct, intimacy and an eye for everything happening between the big moments.",
  about_photo_url: "https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=1400&q=85",
  about_bio_1: "I photograph weddings, pre-wedding stories, and cinematic films from Sambhaji Nagar. Six years in, I am still drawn to the unscripted things: a nervous hand, a sudden laugh, light moving across a crowded room.",
  about_bio_2: "The work lives between documentary and editorial. I give each story room to breathe, then shape it with honest colour, deliberate sequencing, and a sense of place.",
  phone: "+91 98000 00000",
  whatsapp: "+91 98000 00000",
  email: "hello@karanpande.in",
  instagram: "karanpande",
  location: "Sambhaji Nagar, Maharashtra · India",
  featured_frames: [
    { url: "/assets/placeholders/ai-wedding-bride.jpg", title: "Before the vows" },
    { url: "/assets/placeholders/ai-prewedding-field.jpg", title: "Blue hour" },
    { url: "/assets/placeholders/ai-cinematic-baraat.jpg", title: "Baraat in motion" },
    { url: "https://images.unsplash.com/photo-1665960213508-48f07086d49c?auto=format&fit=crop&w=1600&q=85", title: "Mandap light" },
    { url: "https://images.pexels.com/photos/35069916/pexels-photo-35069916.jpeg?auto=compress&cs=tinysrgb&w=1600", title: "By the sea" },
  ],
};

export const FALLBACK_ALBUMS = [
  { id: "w-1", category: "wedding", slug: "aarav-meera", name: "Aarav & Meera", cover: "/assets/placeholders/ai-wedding-bride.jpg", location: "Udaipur, Rajasthan", date: "February 2025", description: "Three days of music, monsoon light, and two families becoming one.", order: 1 },
  { id: "w-2", category: "wedding", slug: "rohan-priya", name: "Rohan & Priya", cover: "https://images.unsplash.com/photo-1665960213508-48f07086d49c?auto=format&fit=crop&w=1600&q=85", location: "Sambhaji Nagar", date: "November 2024", description: "A neighbourhood wedding lit by lamps, laughter, and familiar faces.", order: 2 },
  { id: "w-3", category: "wedding", slug: "kabir-ananya", name: "Kabir & Ananya", cover: "https://images.pexels.com/photos/35069916/pexels-photo-35069916.jpeg?auto=compress&cs=tinysrgb&w=1600", location: "Goa", date: "December 2024", description: "Salt air, vermilion, and a ceremony by the sea.", order: 3 },
  { id: "p-1", category: "pre-wedding", slug: "ishaan-riya", name: "Ishaan & Riya", cover: "/assets/placeholders/ai-prewedding-field.jpg", location: "Jaisalmer", date: "January 2025", description: "A slow golden-hour walk across the winter dunes.", order: 1 },
  { id: "p-2", category: "pre-wedding", slug: "vikram-naina", name: "Vikram & Naina", cover: "https://images.unsplash.com/photo-1653688529238-1326ab9eeab9?auto=format&fit=crop&w=1600&q=85", location: "Coorg", date: "October 2024", description: "Coffee plantations, soft mist, and no hurry at all.", order: 2 },
  { id: "c-1", category: "cinematic", slug: "aarav-meera-film", name: "Aarav × Meera — Film", cover: "/assets/placeholders/ai-cinematic-baraat.jpg", location: "Udaipur", date: "February 2025", description: "A monsoon wedding film cut to a live sitar score.", order: 1 },
  { id: "c-2", category: "cinematic", slug: "the-first-dance", name: "The First Dance", cover: "https://images.pexels.com/photos/10603895/pexels-photo-10603895.jpeg?auto=compress&cs=tinysrgb&w=1600", location: "Mumbai", date: "September 2024", description: "A candlelit reception told in one lingering take.", order: 2 },
];

const media = (album_id, category, urls) => urls.map((item, index) => ({
  id: `${album_id}-${index + 1}`, album_id, category, kind: item.kind || "image",
  url: item.url, poster: item.poster, title: item.title, caption: item.caption || "", order: index + 1,
}));

export const FALLBACK_MEDIA = [
  ...media("w-1", "wedding", [
    { url: "/assets/placeholders/ai-wedding-bride.jpg", title: "Before the vows" },
    { url: "https://images.unsplash.com/photo-1599462616558-2b75fd26a283?auto=format&fit=crop&w=1800&q=85", title: "First look" },
    { url: "https://images.unsplash.com/photo-1722952934708-749c22eb2e58?auto=format&fit=crop&w=1800&q=85", title: "Baraat" },
  ]),
  ...media("w-2", "wedding", [
    { url: "https://images.unsplash.com/photo-1665960213508-48f07086d49c?auto=format&fit=crop&w=1800&q=85", title: "Mandap light" },
    { url: "https://images.pexels.com/photos/35069916/pexels-photo-35069916.jpeg?auto=compress&cs=tinysrgb&w=1800", title: "Together" },
  ]),
  ...media("w-3", "wedding", [
    { url: "https://images.pexels.com/photos/35069916/pexels-photo-35069916.jpeg?auto=compress&cs=tinysrgb&w=1800", title: "By the sea" },
    { url: "https://images.pexels.com/photos/32060316/pexels-photo-32060316.jpeg?auto=compress&cs=tinysrgb&w=1800", title: "Sunset walk" },
  ]),
  ...media("p-1", "pre-wedding", [
    { url: "/assets/placeholders/ai-prewedding-field.jpg", title: "Blue hour" },
    { url: "https://images.unsplash.com/photo-1715285978388-312252ee23de?auto=format&fit=crop&w=1800&q=85", title: "Hand in hand" },
  ]),
  ...media("p-2", "pre-wedding", [
    { url: "https://images.unsplash.com/photo-1653688529238-1326ab9eeab9?auto=format&fit=crop&w=1800&q=85", title: "Golden hour" },
    { url: "https://images.unsplash.com/photo-1715285977526-5574f70b0d3d?auto=format&fit=crop&w=1800&q=85", title: "Plantation" },
  ]),
  ...media("c-1", "cinematic", [{ kind: "video", url: "https://videos.pexels.com/video-files/5849887/5849887-uhd_2560_1440_24fps.mp4", poster: "/assets/placeholders/ai-cinematic-baraat.jpg", title: "Full film", caption: "5 min · sitar score" }]),
  ...media("c-2", "cinematic", [{ kind: "video", url: "https://videos.pexels.com/video-files/3205827/3205827-uhd_2560_1440_25fps.mp4", poster: "https://images.pexels.com/photos/10603895/pexels-photo-10603895.jpeg?auto=compress&cs=tinysrgb&w=1600", title: "First dance", caption: "A single take · candlelit" }]),
];

export const FALLBACK_TESTIMONIALS = [
  { id: "t-1", author: "Aarav & Meera", role: "Wedding · Udaipur", quote: "Karan did not just photograph our wedding — he remembered it for us. Every image feels like the moment we lived.", rating: 5 },
  { id: "t-2", author: "Rohan & Priya", role: "Wedding · Sambhaji Nagar", quote: "We asked for honest, unposed photographs. He gave us a small book of our two families that we open every anniversary.", rating: 5 },
  { id: "t-3", author: "Ishaan & Riya", role: "Pre-wedding · Jaisalmer", quote: "He waited for the light to turn and made the whole day feel effortless. The photographs are completely us.", rating: 5 },
];

export function fallbackAlbums(category) {
  return FALLBACK_ALBUMS.filter((album) => album.category === category);
}

export function fallbackAlbum(category, slug) {
  const album = FALLBACK_ALBUMS.find((item) => item.category === category && item.slug === slug);
  return album ? { album, media: FALLBACK_MEDIA.filter((item) => item.album_id === album.id) } : null;
}
