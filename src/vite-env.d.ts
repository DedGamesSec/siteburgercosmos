/// <reference types="vite/client" />

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

export interface NewsItem {
  id: string;
  source: "telegram" | "vk";
  date: string;
  text: string;
  url: string;
  imageUrl?: string;
  /** Pre-translated English text, produced once at build/CI time. */
  en?: string;
}
