import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Truck, Sparkles, 
  CheckCircle2, Laptop, Smartphone, Headphones, 
  Monitor, Phone, MessageCircle, FileText, Zap, ChevronRight
} from 'lucide-react';
import ShimmerButton from '../components/magicui/ShimmerButton';
import Marquee from '../components/magicui/Marquee';
import ProductCard from '../components/ProductCard';
import { apiUrl } from '../lib/api';

const BRAND_PARTNERS = [
  { name: 'Apple Authorized', query: 'Apple' },
  { name: 'Lenovo ThinkPad', query: 'Lenovo' },
  { name: 'HP Enterprise', query: 'HP' },
  { name: 'ASUS ROG', query: 'ASUS' },
  { name: 'Sony Pro Audio', query: 'Sony' },
  { name: 'Dell Technologies', query: 'Dell' },
  { name: 'Samsung Galaxy', query: 'Samsung' },
  { name: 'Logitech Master', query: 'Logitech' },
  { name: 'NVIDIA RTX Workstations', query: 'RTX' },
  { name: 'Bose Professional', query: 'Bose' },
  { name: 'Anker Prime Hardware', query: 'Anker' }
];

const CATEGORIES = [
  {
    id: 'laptops',
    title: 'Workstations & Laptops',
    description: 'Apple Silicon M3/M4, Lenovo ThinkPad X1, Dell XPS Workstations',
    badge: 'Compilation & AI',
    icon: Laptop,
    path: '/catalog?cat=laptops'
  },
  {
    id: 'phones',
    title: 'Flagship Smartphones',
    description: 'iPhone 16 Pro Max, Samsung Galaxy S24 Ultra, Google Pixel',
    badge: 'Dual SIM & 5G',
    icon: Smartphone,
    path: '/catalog?cat=phones'
  },
  {
    id: 'audio',
    title: 'Studio & ANC Audio',
    description: 'Sony WH-1000XM5, AirPods Max, Bose Noise Cancelling Headphones',
    badge: 'Hi-Res Acoustics',
    icon: Headphones,
    path: '/catalog?cat=audio'
  },
  {
    id: 'accessories',
    title: 'Pro Monitors & Docks',
    description: '4K Creator Displays, Thunderbolt 4 Docks, Logitech MX Master 3S',
    badge: 'Desk Ergonomics',
    icon: Monitor,
    path: '/catalog?cat=accessories'
  }
];

export default function HomePage() {
  const navigate = useNavigate();

  // Fetch 4 featured products from live DB
  const [featuredProducts, setFeaturedProducts] = useState([]);
  useEffect(() => {
    fetch(apiUrl('/products?limit=4'))
      .then(r => r.json())
      .then(data => {
        const list = data.products || data.data?.products || [];
        setFeaturedProducts(list.map(p => ({
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
        })));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="home-page" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* 1. Flagship Hardware Showcase Hero - Power Meets Precision Engineering (Image 2 Design) */}
      <section className="flagship-hero-section">
        {/* Background image on the right, seamlessly blending into the dark canvas */}
        <div className="flagship-hero-bg" />

        {/* Left-Aligned Vision & Actions Container */}
        <div className="flagship-hero-container">
          <div className="flagship-hero-content">
            <h1 className="flagship-title">
              Power Meets <br />
              <span className="flagship-title-cyan">Precision Engineering.</span>
            </h1>

            <p className="flagship-desc">
              Next-generation workstation laptops, 4K displays, lossless audio, and high-frequency tactile hardware designed for visionary creators.
            </p>

            <div className="flagship-cta-row">
              <Link to="/catalog" className="btn-flagship-primary">
                <span>Explore Entire Catalog</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Authorized Hardware Partners & Global Brands Marquee */}
      <section style={{ 
        padding: '24px 0 28px', 
        background: '#FFFFFF', 
        borderBottom: '1px solid #E2E8F0',
        overflow: 'hidden' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <span style={{ 
            fontSize: '0.78rem', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em', 
            color: '#64748B' 
          }}>
            Authorized Hardware Partners & Global Brands
          </span>
        </div>
        <Marquee speed={32} pauseOnHover>
          {BRAND_PARTNERS.map((brand, idx) => (
            <Link 
              key={idx} 
              to={`/catalog?q=${encodeURIComponent(brand.query)}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                margin: '0 8px',
                background: '#F8FAFC',
                borderRadius: '999px',
                border: '1px solid #E2E8F0',
                fontWeight: '700',
                fontSize: '0.92rem',
                color: '#0F172A',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00D1FF';
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 88, 188, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.background = '#F8FAFC';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0058BC', flexShrink: 0 }} />
              <span>{brand.name}</span>
            </Link>
          ))}
        </Marquee>
      </section>

      {/* 2. Curated 4-Category Visual Navigator */}
      <section style={{ padding: '60px 16px', maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#0058BC' }}>
              Curated Collections
            </div>
            <h2 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#0A192F', marginTop: '4px' }}>
              Explore By Hardware Category
            </h2>
          </div>
          <Link 
            to="/catalog" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0058BC', fontWeight: '700', fontSize: '0.92rem', textDecoration: 'none' }}
          >
            <span>View All Categories</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                to={cat.path}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00D1FF';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 88, 188, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.03)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(0, 88, 188, 0.1), rgba(0, 209, 255, 0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={24} color="#0058BC" />
                    </div>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: '#F1F5F9',
                      color: '#475569'
                    }}>
                      {cat.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                    {cat.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5 }}>
                    {cat.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0058BC', fontWeight: '700', fontSize: '0.86rem', marginTop: '20px' }}>
                  <span>Browse Gear</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Spotlight Flagship Hardware (Top 4 Best Sellers) */}
      <section style={{ padding: '60px 16px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#0058BC' }}>
                Featured Deals
              </div>
              <h2 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#0A192F', marginTop: '4px' }}>
                Today's Flagship Hardware Picks
              </h2>
            </div>
            
            <Link 
              to="/catalog" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#0058BC', fontSize: '0.92rem', textDecoration: 'none' }}
            >
              <span>View All 18+ In Stock Hardware</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            {featuredProducts.map((product, idx) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                featured={idx === 0} 
              />
            ))}
          </div>

        </div>
      </section>

      {/* 5. Enterprise Guarantee & Direct Support Banner */}
      <section style={{ padding: '64px 16px' }}>
        <div style={{
          maxWidth: '1120px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, #0A192F 0%, #0D2847 100%)',
          borderRadius: '20px',
          padding: '44px 36px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '32px',
          boxShadow: '0 20px 60px rgba(10, 25, 47, 0.3)',
          border: '1px solid rgba(0, 209, 255, 0.2)'
        }}>
          <div style={{ maxWidth: '620px' }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(0, 209, 255, 0.15)',
              border: '1px solid rgba(0, 209, 255, 0.35)',
              color: '#00D1FF',
              padding: '4px 14px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              Direct Enterprise & Wholesale Support
            </span>

            <h3 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#ffffff', lineHeight: 1.25, marginBottom: '12px' }}>
              Need Custom Workstation Quotes or Urgent Corporate Delivery?
            </h3>

            <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Speak directly with our hardware specialists in Mombasa. We support corporate purchase orders, 
              custom RAM/SSD specifications, 16% VAT KRA eTIMS invoices, and same-day CBD courier dispatch.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href="tel:+254748189196"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '999px',
                  background: '#FFFFFF',
                  color: '#0A192F',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                }}
              >
                <Phone size={16} color="#0058BC" />
                <span>Call: +254 748 189196</span>
              </a>

              <a
                href="tel:+254741213889"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '999px',
                  background: '#FFFFFF',
                  color: '#0A192F',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                }}
              >
                <Phone size={16} color="#0058BC" />
                <span>Call: +254 741 213 889</span>
              </a>

              <a
                href="https://wa.me/254748189196?text=Hello%20Byte%20Tech%20Direct,%20I%20would%20like%20to%20inquire%20about%20hardware"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '999px',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                }}
              >
                <MessageCircle size={16} />
                <span>WhatsApp Hardware Dispatch</span>
              </a>
            </div>
          </div>

          <div>
            <ShimmerButton 
              variant="electric" 
              size="lg"
              onClick={() => navigate('/catalog')}
            >
              <span>Explore All Hardware</span>
              <ArrowRight size={18} />
            </ShimmerButton>
          </div>
        </div>
      </section>

    </div>
  );
}
