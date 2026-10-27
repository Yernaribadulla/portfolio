import catalog from '../../public/products.json';

export interface DigitalProduct {
  id: string;
  name: string;
  category: 'web_template' | 'developer_tool';
  summary: string;
  description: string;
  price: { amount: number; currency: string };
  status: 'draft' | 'in_review' | 'available' | 'paused';
  demo_url: string | null;
  product_url: string | null;
  purchase_url: string | null;
  image_url: string;
  features: string[];
  requirements: string[];
  limitations: string[];
  version: string;
  updated_at: string;
}

export const products = (catalog.products as DigitalProduct[]).filter(product => product.status !== 'draft');
export const productStatus = {
  draft: 'In preparation',
  in_review: 'In review',
  available: 'Available',
  paused: 'Unavailable',
};
export const productCategory = {
  web_template: 'Website template',
  developer_tool: 'Developer tool',
};

export function httpsLink(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function purchaseLink(product: DigitalProduct): string | null {
  return product.status === 'available' ? httpsLink(product.purchase_url) : null;
}

export function productRoute(): { id: string | null } | null {
  if (location.hash === '#products' || location.hash === '#products/') return { id: null };
  if (!location.hash.startsWith('#products/')) return null;
  try { return { id: decodeURIComponent(location.hash.slice('#products/'.length)) }; }
  catch { return { id: '' }; }
}

export function productImage(path: string): string | undefined {
  if (!/^products\/[a-zA-Z0-9_./-]+$/.test(path) || path.includes('..')) return undefined;
  return `${import.meta.env.BASE_URL}${path}`;
}
