import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Truck, ArrowLeft, Star, Check, ShoppingBag, 
  Zap, QrCode, Share2, Award, ChevronRight, Plus, Minus, Loader2
} from 'lucide-react';
import { formatKES } from '../data/products';
import { apiUrl } from '../lib/api';
import { useCart } from '../context/CartContext';
import CheckoutModal from '../components/CheckoutModal';
import ShimmerButton from '../components/magicui/ShimmerButton';
import ProductCard from '../components/ProductCard';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, openCheckout } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Normalise DB product shape
  const normalise = (p) => ({
    ...p,
    title: p.name,
    image: p.image || p.image_url,
    price: parseFloat(p.price) || 0,
    sellerId: p.seller_id,
    brand: p.store_name || p.seller_name || 'Byte Tech Partner',
    inStock: (p.stock ?? 1) > 0,
    specs: typeof p.specs === 'string' ? p.specs.split('|').map(s => s.trim()) : (p.specs || []),
    seller: p.store_name || p.seller_name || 'Byte Tech',
    rating: p.rating ?? 4.8,
    reviews: p.reviews ?? 0,
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    fetch(apiUrl(`/products/detail?id=${encodeURIComponent(id)}`))
      .then(r => r.json())
      .then(data => {
        const p = data.product || data.data?.product;
        if (!p) { setNotFound(true); return; }
        const norm = normalise(p);
        setProduct(norm);
        // Fetch related products (same category)
        return fetch(apiUrl(`/products?limit=20`))
          .then(r2 => r2.json())
          .then(data2 => {
            const all = data2.products || data2.data?.products || [];
            setRelatedProducts(
              all.filter(rp => rp.category === p.category && rp.id !== p.id)
                 .slice(0, 3)
                 .map(normalise)
            );
          });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-blue)' }} />
    </div>
  );

  if (notFound || !product) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <h2 style={{ fontWeight: 800, color: 'var(--midnight-navy)' }}>Product Not Found</h2>
      <Link to="/catalog" style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>← Back to Catalog</Link>
    </div>
  );

  // Tax computation
  const vatAmount = Math.round(product.price * (0.16 / 1.16));
  const netAmount = product.price - vatAmount;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1600);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    openCheckout();
  };

  return (
    <div className="product-page" style={{ padding: '32px 0 80px' }}>
      <div className="container">
        {/* Breadcrumb navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <ChevronRight size={14} />
          <Link to="/catalog" style={{ color: 'var(--text-muted)' }}>Catalog</Link>
          <ChevronRight size={14} />
          <Link to={`/catalog?cat=${product.category}`} style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {product.category}
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--midnight-navy)', fontWeight: '600', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.title}
          </span>
        </div>

        {/* Main Product Display Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          background: 'var(--surface-white)',
          padding: '36px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Left: Product Media Gallery */}
          <div>
            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: 'var(--surface-frost)',
              border: '1px solid var(--surface-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '360px',
              maxHeight: '440px'
            }}>
              <img 
                src={product.image} 
                alt={product.title}
                style={{
                  maxHeight: '360px',
                  objectFit: 'contain',
                  transition: 'transform 0.4s ease'
                }}
              />
              <span style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: '700',
                color: 'var(--primary-blue)',
                border: '1px solid rgba(0, 88, 188, 0.2)'
              }}>
                {product.brand}
              </span>
            </div>

            {/* Quick trust metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--surface-frost)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                <ShieldCheck size={18} color="var(--primary-blue)" />
                <span>100% Genuine Tech</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--surface-frost)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                <Truck size={18} color="var(--accent-success)" />
                <span>Same-day Mombasa</span>
              </div>
            </div>
          </div>

          {/* Right: Product Details & Purchase Form */}
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {product.category}
            </span>
            <h1 style={{ fontSize: '2.1rem', fontWeight: '800', color: 'var(--midnight-navy)', marginTop: '6px', marginBottom: '12px', lineHeight: 1.25 }}>
              {product.title}
            </h1>

            {/* Rating Stars & Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(253, 165, 72, 0.15)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                <Star size={16} fill="var(--accent-amber)" color="var(--accent-amber)" />
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--accent-amber-dark)' }}>{product.rating}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({product.reviews} reviews)</span>
              </div>

              <span style={{
                fontSize: '0.85rem',
                fontWeight: '700',
                color: product.inStock ? 'var(--accent-success)' : 'var(--accent-error)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: product.inStock ? 'var(--accent-success)' : 'var(--accent-error)' }} />
                {product.inStock ? 'In Stock (Mombasa Central Hub)' : 'Backorder Available'}
              </span>
            </div>

            {/* Price & eTIMS Breakdown Box */}
            <div style={{
              background: 'var(--surface-frost)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--surface-border)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--primary-blue)' }}>
                  {formatKES(product.price)}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  VAT Inclusive
                </span>
              </div>

              {/* Fiscal Tax Card */}
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px dashed #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <QrCode size={16} color="var(--accent-success)" />
                  <span>KRA eTIMS Tax (16%): <strong>{formatKES(vatAmount)}</strong></span>
                </div>
                <span>Net: {formatKES(netAmount)}</span>
              </div>
            </div>

            {/* Specifications Chips */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--midnight-navy)', marginBottom: '10px' }}>
                Hardware Specifications
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {product.specs.map((spec, idx) => (
                  <span 
                    key={idx} 
                    style={{
                      padding: '8px 14px',
                      background: 'var(--surface-white)',
                      border: '1px solid var(--surface-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.88rem',
                      fontWeight: '600',
                      color: 'var(--midnight-navy)'
                    }}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
              {product.description}
            </p>

            {/* Quantity Selector & Action Buttons (Desktop) */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1.5px solid var(--surface-border)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--surface-white)',
                padding: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ width: '36px', textAlign: 'center', fontWeight: '700', fontSize: '1rem' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                style={{
                  flex: '1 1 180px',
                  padding: '14px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: addedAnimation ? 'var(--accent-success)' : 'var(--midnight-navy)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
              >
                {addedAnimation ? (
                  <>
                    <Check size={18} />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <ShimmerButton
                variant="electric"
                size="md"
                onClick={handleBuyNow}
                style={{ flex: '1 1 180px' }}
              >
                <Zap size={18} />
                <span>Buy Now with M-Pesa</span>
              </ShimmerButton>
            </div>
          </div>
        </div>

        {/* Related Hardware Section */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '64px' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--midnight-navy)', marginBottom: '20px' }}>
              Similar Hardware in {product.category}
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="mobile-sticky-bar">
        <div className="mobile-sticky-bar-inner">
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total (16% VAT Inc)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-blue)' }}>
              {formatKES(product.price * quantity)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleAddToCart}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: addedAnimation ? 'var(--accent-success)' : 'var(--surface-muted)',
                color: addedAnimation ? '#fff' : 'var(--midnight-navy)',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {addedAnimation ? <Check size={18} /> : <ShoppingBag size={18} />}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--primary-blue), #00D1FF)',
                color: '#fff',
                fontWeight: '700',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Zap size={16} />
              <span>M-Pesa STK</span>
            </button>
          </div>
        </div>
      </div>

      {/* M-Pesa Checkout Modal */}
      <CheckoutModal />
    </div>
  );
}
