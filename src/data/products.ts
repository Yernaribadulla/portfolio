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

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const stringList = (value: unknown): value is string[] => Array.isArray(value) && value.every(nonempty);
const safeOptionalUrl = (value: unknown) => value === null || (typeof value === 'string' && httpsLink(value) !== null);

function validProduct(value: unknown): value is DigitalProduct {
  if (!record(value) || !record(value.price)) return false;
  if (!nonempty(value.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id)) return false;
  if (typeof value.category !== 'string' || !['web_template', 'developer_tool'].includes(value.category)) return false;
  if (typeof value.status !== 'string' || !['draft', 'in_review', 'available', 'paused'].includes(value.status)) return false;
  if (![value.name, value.summary, value.description, value.version, value.updated_at].every(nonempty)) return false;
  if (typeof value.price.amount !== 'number' || !Number.isFinite(value.price.amount) || value.price.amount < 0) return false;
  if (typeof value.price.currency !== 'string' || !/^[A-Z]{3}$/.test(value.price.currency)) return false;
  if (!Intl.supportedValuesOf('currency').includes(value.price.currency)) return false;
  if (![value.demo_url, value.product_url, value.purchase_url].every(safeOptionalUrl)) return false;
  if (typeof value.image_url !== 'string' || !productImage(value.image_url)) return false;
  return [value.features, value.requirements, value.limitations].every(stringList);
}

export async function loadProducts(signal?: AbortSignal): Promise<DigitalProduct[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}products.json`, { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error('Catalogue request failed');
  const catalogue: unknown = await response.json();
  if (!record(catalogue) || catalogue.schema_version !== 1 || !Array.isArray(catalogue.products)
    || !catalogue.products.every(validProduct)) throw new Error('Invalid product catalogue');
  const ids = catalogue.products.map(product => product.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate product identifiers');
  return catalogue.products.filter(product => product.status !== 'draft');
}
