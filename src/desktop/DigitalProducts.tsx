import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Package } from 'lucide-react';
import { loadProducts, productCategory, productStatus, productImage, httpsLink, purchaseLink, type DigitalProduct } from '../data/products';
import '../styles/products.css';

const external = { target: '_blank', rel: 'noopener noreferrer' };
const price = (product: DigitalProduct) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: product.price.currency, maximumFractionDigits: 2,
}).format(product.price.amount);

function ProductVisual({ product }: { product: DigitalProduct }) {
  const source = productImage(product.image_url);
  return source ? <img className="product-visual" src={source} alt={`${product.name} preview`} /> : null;
}

function Facts({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <section className="product-facts"><h3>{title}</h3><ul>{items.map((item, i) => <li key={`${i}-${item}`}>{item}</li>)}</ul></section>;
}

export default function DigitalProducts({ selectedId }: { selectedId: string | null }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [catalogue, setCatalogue] = useState<{ state: 'loading' } | { state: 'error' } | { state: 'ready'; products: DigitalProduct[] }>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogue({ state: 'loading' });
    loadProducts(controller.signal).then(products => {
      if (!controller.signal.aborted) setCatalogue({ state: 'ready', products });
    }).catch(() => {
      if (!controller.signal.aborted) setCatalogue({ state: 'error' });
    });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [selectedId, catalogue.state]);

  if (catalogue.state === 'loading') return <article className="products-content" role="status">
    <h2 ref={heading} tabIndex={-1}>Loading products</h2>
    <p>Opening the current catalogue…</p>
  </article>;

  if (catalogue.state === 'error') return <article className="products-content">
    <h2 ref={heading} tabIndex={-1}>Catalogue unavailable</h2>
    <p role="alert">The catalogue could not be loaded. Please try again.</p>
    <button className="primary" onClick={() => setAttempt(current => current + 1)}>Try again</button>
    <p><a className="products-back" href="#desktop"><ArrowLeft size={15} /> Back to desktop</a></p>
  </article>;

  const products = catalogue.products;
  const selected = products.find(product => product.id === selectedId);

  if (selectedId !== null && !selected) return <article className="products-content">
    <a className="products-back" href="#products"><ArrowLeft size={15} /> All products</a>
    <h2 ref={heading} tabIndex={-1}>Product not found</h2>
    <p>This link does not match a product in the current catalogue.</p>
  </article>;

  if (!selected) return <article className="products-content">
    <div className="eyebrow">YERNAR / DIGITAL PRODUCTS</div>
    <h2 ref={heading} tabIndex={-1}>Made to build on.</h2>
    <p className="products-lead">Templates and tools, with the details you need before choosing.</p>
    <div className="product-grid">{products.map(product => <a className="product-card" key={product.id} href={`#products/${encodeURIComponent(product.id)}`} aria-label={`View ${product.name}`}>
      <div className="product-card-body">
        <div className="product-card-meta"><span>{productCategory[product.category]}</span><span className="product-status" data-status={product.status}>{productStatus[product.status]}</span></div>
        <h3>{product.name}<ArrowUpRight size={20} /></h3>
        <p>{product.summary}</p>
        <div className="product-card-price"><span>{price(product)} <small>{product.price.currency} base price</small></span><span>View details →</span></div>
      </div>
      <ProductVisual product={product} />
    </a>)}</div>
    {!products.length && <p>No products are listed yet.</p>}
  </article>;

  const purchase = purchaseLink(selected);
  const demo = httpsLink(selected.demo_url);
  const productPage = httpsLink(selected.product_url);
  return <article className="products-content product-detail">
    <a className="products-back" href="#products"><ArrowLeft size={15} /> All products</a>
    <div className="product-card-meta"><span className="eyebrow">{productCategory[selected.category]}</span><span className="product-status" data-status={selected.status}>{productStatus[selected.status]}</span></div>
    <h2 ref={heading} tabIndex={-1}>{selected.name}</h2>
    <p className="products-lead">{selected.summary}</p>
    <div className="product-purchase">
      <div><strong>{price(selected)}</strong><span>{selected.price.currency} base price</span></div>
      {purchase ? <a className="primary" href={purchase} {...external}>Buy on marketplace <ArrowUpRight size={16} /></a> : <span className="product-pending"><Package size={17} />{productStatus[selected.status]} · Purchase unavailable</span>}
    </div>
    <ProductVisual product={selected} />
    <p className="product-description">{selected.description}</p>
    <div className="product-external-links">
      {demo && <a href={demo} {...external}>Live demo <ArrowUpRight size={15} /></a>}
      {productPage && <a href={productPage} {...external}>Product page <ArrowUpRight size={15} /></a>}
    </div>
    <Facts title="What's included" items={selected.features} />
    <Facts title="What you need" items={selected.requirements} />
    <Facts title="Before you buy" items={selected.limitations} />
    <p className="product-version">Version {selected.version} · Updated <time dateTime={selected.updated_at}>{selected.updated_at}</time></p>
  </article>;
}
