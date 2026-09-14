import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, FileText, Phone, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="policy-page" style={{ background: '#F8FAFC', minHeight: '100vh', padding: '48px 16px 80px' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <Link 
            to="/" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '0.9rem', textDecoration: 'none', fontWeight: '600' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header Hero Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0A192F 0%, #0D2847 100%)',
          borderRadius: '20px',
          padding: '40px 36px',
          color: '#ffffff',
          marginBottom: '32px',
          boxShadow: '0 12px 36px rgba(10, 25, 47, 0.15)',
          border: '1px solid rgba(0, 209, 255, 0.2)'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 209, 255, 0.15)', padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700', color: '#00D1FF', marginBottom: '16px' }}>
            <ShieldCheck size={16} />
            <span>Kenya Data Protection Act 2019 Compliant</span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#ffffff', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Privacy Policy
          </h1>

          <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: 1.6, maxWidth: '680px' }}>
            Byte Tech Ltd values your trust. This Privacy Policy details how we collect, handle, safeguard, and process your personal and payment data when you shop on our marketplace.
          </p>

          <div style={{ display: 'flex', gap: '20px', marginTop: '24px', fontSize: '0.84rem', color: '#CBD5E1', flexWrap: 'wrap' }}>
            <div><strong>Effective Date:</strong> January 1, 2026</div>
            <div>•</div>
            <div><strong>Last Updated:</strong> September 2026</div>
            <div>•</div>
            <div><strong>Entity:</strong> Byte Tech Ltd (KRA PIN: P051234567Z)</div>
          </div>
        </div>

        {/* Content Container */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '40px 36px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid #E2E8F0',
          lineHeight: '1.7',
          color: '#334155'
        }}>

          {/* Section 1 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0A192F', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={20} color="#0058BC" />
              <span>1. Information We Collect</span>
            </h2>
            <p style={{ marginBottom: '12px' }}>
              When you browse our catalog, register as a customer or merchant, or complete a purchase, we collect the necessary information to fulfill your hardware orders and satisfy Kenyan fiscal regulations:
            </p>
            <ul style={{ paddingLeft: '24px', marginBottom: '14px' }}>
              <li><strong>Contact & Identity Data:</strong> Full name, phone number, email address, and physical delivery/dispatch address.</li>
              <li><strong>Transaction & Payment Details:</strong> M-Pesa phone number, payment method, M-Pesa transaction reference IDs, and order itemization. <em>Note: We never store your M-Pesa PIN or raw banking credentials.</em></li>
              <li><strong>Fiscal & Tax Data:</strong> KRA PIN (if requested by enterprise buyers for KRA eTIMS invoice issuance and VAT input deductions).</li>
              <li><strong>Merchant Profile Data:</strong> Business registration certificates, store name, payout bank or M-Pesa paybill accounts, and national ID details for vetted sellers.</li>
            </ul>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

          {/* Section 2 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0A192F', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Eye size={20} color="#0058BC" />
              <span>2. How We Use Your Information</span>
            </h2>
            <p style={{ marginBottom: '12px' }}>
              Your data is strictly utilized to deliver genuine hardware and high-grade marketplace services:
            </p>
            <ul style={{ paddingLeft: '24px' }}>
              <li><strong>Order Fulfillment & Courier Dispatch:</strong> Coordinating express delivery within Mombasa CBD and 24h nationwide shipping via authorized couriers.</li>
              <li><strong>KRA eTIMS Tax Invoicing:</strong> Generating authentic fiscal tax receipts transmitted to the Kenya Revenue Authority portal with verified CU serial numbers.</li>
              <li><strong>Payment Verification:</strong> Facilitating automated M-Pesa STK push confirmations via Safaricom's regulated payment infrastructure.</li>
              <li><strong>Customer & After-Sales Support:</strong> Providing direct customer care and technical support for workstations, laptops, and studio audio.</li>
              <li><strong>Fraud Prevention & Platform Security:</strong> Detecting suspicious activity and securing verified merchant listings.</li>
            </ul>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

          {/* Section 3 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0A192F', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="#10B981" />
              <span>3. Data Protection & Security Safeguards</span>
            </h2>
            <p style={{ marginBottom: '12px' }}>
              Byte Tech Ltd employs enterprise-grade technical and organizational measures:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: '700', color: '#0A192F', marginBottom: '4px' }}>256-Bit SSL/TLS Encryption</div>
                <div style={{ fontSize: '0.86rem', color: '#64748B' }}>All traffic between your browser and our servers is encrypted over HTTPS.</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: '700', color: '#0A192F', marginBottom: '4px' }}>PCI-DSS Tier 1 Gateways</div>
                <div style={{ fontSize: '0.86rem', color: '#64748B' }}>Payments are processed through licensed, CBK-regulated financial partners.</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: '700', color: '#0A192F', marginBottom: '4px' }}>Zero Third-Party Selling</div>
                <div style={{ fontSize: '0.86rem', color: '#64748B' }}>We never sell, rent, or trade your personal information to external advertisers.</div>
              </div>
            </div>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

          {/* Section 4 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0A192F', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} color="#0058BC" />
              <span>4. Your Rights Under Kenyan Law</span>
            </h2>
            <p style={{ marginBottom: '12px' }}>
              Under the <strong>Kenya Data Protection Act, 2019</strong>, you have the right to:
            </p>
            <ul style={{ paddingLeft: '24px' }}>
              <li>Be informed of how your personal data is processed.</li>
              <li>Access, rectify, or request deletion of inaccurate personal records.</li>
              <li>Opt out of marketing communications at any time.</li>
              <li>Request an electronic copy of all transactional records associated with your account.</li>
            </ul>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

          {/* Contact Section */}
          <section style={{ background: '#F1F5F9', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0A192F', marginBottom: '8px' }}>
              Questions or Data Privacy Inquiries?
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#475569', marginBottom: '16px' }}>
              If you have any questions regarding this Privacy Policy or wish to exercise your data rights, contact our compliance officer:
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
              <div>
                <strong>Entity:</strong> Byte Tech Ltd
              </div>
              <div>
                <strong>Phone:</strong> <a href="tel:+254748189196" style={{ color: '#0058BC', textDecoration: 'none', fontWeight: '700' }}>+254 748 189196</a>
                {' '}&bull;{' '}
                <a href="tel:+254741213889" style={{ color: '#0058BC', textDecoration: 'none', fontWeight: '700' }}>+254 741 213 889</a>
              </div>
              <div>
                <strong>Location:</strong> Mombasa CBD, Kenya
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
