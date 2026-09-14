import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Headphones, CheckCircle2, QrCode } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        {/* Trust Badges Row */}
        <div className="footer-trust-grid">
          <div className="trust-item">
            <div className="trust-icon-box">
              <ShieldCheck size={26} color="var(--primary-blue)" />
            </div>
            <div>
              <h4>100% Genuine Hardware</h4>
              <p>Direct from authorized dealers and regional distributors</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-box">
              <Zap size={26} color="var(--electric-blue)" />
            </div>
            <div>
              <h4>Instant M-Pesa STK</h4>
              <p>Safe, zero-friction mobile checkout via IntaSend Payments</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-box">
              <QrCode size={26} color="var(--accent-success)" />
            </div>
            <div>
              <h4>KRA eTIMS Invoiced</h4>
              <p>Automated fiscal tax receipts with scannable QR verification</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-box">
              <Headphones size={26} color="var(--accent-amber)" />
            </div>
            <div>
              <h4>Mombasa Express Dispatch</h4>
              <p>Same-day courier within Mombasa</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="footer-main-grid">
          <div className="footer-brand-col">
            <div className="brand-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0058BC, #00D1FF)',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 209, 255, 0.25)'
              }}>
                <Zap size={20} color="#FFFFFF" fill="#FFFFFF" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    Byte <span style={{ color: '#00D1FF' }}>Tech</span>
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(0, 209, 255, 0.15)',
                    color: '#00D1FF',
                    border: '1px solid rgba(0, 209, 255, 0.3)'
                  }}>
                    Direct
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: '500' }}>
                  Authorized Hardware
                </span>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '320px', lineHeight: '1.6' }}>
              Kenya’s premier hardware & computing ecosystem. High-performance workstations, enterprise accessories, and developer gears with instant fiscal compliance.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <span className="badge-etims-pill" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: '#ECFDF5',
                color: '#065F46',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: '600',
                border: '1px solid #A7F3D0'
              }}>
                <CheckCircle2 size={14} /> KRA eTIMS Active
              </span>
            </div>
          </div>

          <div className="footer-col">
            <h5 className="footer-title">Hardware Catalog</h5>
            <ul className="footer-links">
              <li><Link to="/catalog?cat=laptops">Laptops & MacBooks</Link></li>
              <li><Link to="/catalog?cat=phones">Smartphones & Tablets</Link></li>
              <li><Link to="/catalog?cat=audio">Studio & ANC Audio</Link></li>
              <li><Link to="/catalog?cat=wearables">Wearables & Smartwatches</Link></li>
              <li><Link to="/catalog?cat=accessories">Docks & Ergonomics</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5 className="footer-title">Customer Care</h5>
            <ul className="footer-links">
              <li><Link to="/cart">My Shopping Cart</Link></li>
              <li><Link to="/receipt">Order Fiscal Verification</Link></li>
              <li><Link to="/privacy">Privacy & Data Security</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/catalog">All Hardware Collections</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5 className="footer-title">Store & Support</h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
              <strong>Support:</strong> <a href="tel:+254748189196" style={{ color: 'var(--primary-blue)', textDecoration: 'none', fontWeight: '600' }}>+254 748 189196</a><br />
              <strong>Support:</strong> <a href="tel:+254741213889" style={{ color: 'var(--primary-blue)', textDecoration: 'none', fontWeight: '600' }}>+254 741 213 889</a><br />
              <strong>Fiscal PIN:</strong> P051234567Z
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom-row">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
            &copy; {new Date().getFullYear()} Byte Tech Ltd. All rights reserved. Registered under Laws of Kenya.
          </p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</Link>
            <Link to="/receipt" style={{ color: 'inherit', textDecoration: 'none' }}>eTIMS Declarations</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
