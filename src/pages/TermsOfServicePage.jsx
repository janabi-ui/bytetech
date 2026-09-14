import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, ShieldAlert, Truck, RefreshCw, Scale, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="terms-page" style={{ background: '#F8FAFC', minHeight: '100vh', padding: '48px 16px 80px' }}>
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
            <FileCheck size={16} />
            <span>Consumer Rights & Marketplace Agreement</span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#ffffff', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Terms of Service
          </h1>

          <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: 1.6, maxWidth: '680px' }}>
            Welcome to Byte Tech Direct. By accessing our marketplace, placing hardware orders, or listing products as a verified seller, you agree to comply with and be bound by the following operating terms.
          </p>

          <div style={{ display: 'flex', gap: '20px', marginTop: '24px', fontSize: '0.84rem', color: '#CBD5E1', flexWrap: 'wrap' }}>
            <div><strong>Effective Date:</strong> January 1, 2026</div>
            <div>•</div>
            <div><strong>Last Updated:</strong> September 2026</div>
            <div>•</div>
            <div><strong>Jurisdiction:</strong> Republic of Kenya</div>
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
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0A192F', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Scale size={20} color="#0058BC" />
              <span>1. Agreement & Platform Eligibility</span>
            </h2>
            <p style={{ marginBottom: '12px' }}>
              These Terms of Service constitute a legally binding agreement between you (the "Buyer", "Seller", or "User") and <strong>Byte Tech Ltd</strong> (Registration KRA PIN: P051234567Z).
            </p>
            <ul style={{ paddingLeft: '24px', marginBottom: '14px' }}>
              <li><strong>Age Requirement:</strong> You must be at least 18 years old or access under the supervision of a parent/legal guardian to make payments or conclude contracts.</li>
              <li><strong>Account Responsibility:</strong> You are solely responsible for safeguarding your login credentials and for all actions that occur under your registered profile.</li>
              <li><strong>Accuracy of Information:</strong> You certify that all registration, contact, and delivery details provided during checkout are true, accurate, and up-to-date.</li>
            </ul>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

          {/* Section 2 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0A192F', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} color="#10B981" />
              <span>2. Genuine Hardware Guarantee & Pricing</span>
            </h2>
            <p style={{ marginBottom: '12px' }}>
              Byte Tech Direct guarantees 100% authentic, brand-new consumer and enterprise computing hardware:
            </p>
            <ul style={{ paddingLeft: '24px' }}>
              <li><strong>Authorized Supply Chains:</strong> All laptops, workstations, phones, audio gear, and peripherals are sourced directly from authorized regional distributors (Apple, Dell, HP, Lenovo, Sony, Samsung, Asus).</li>
              <li><strong>Tax-Inclusive Pricing:</strong> All prices displayed on the catalog are in Kenyan Shillings (KES) and are inclusive of standard <strong>16% Value Added Tax (VAT)</strong> where applicable.</li>
              <li><strong>Price Amendments:</strong> We reserve the right to correct typographical errors or inadvertent pricing discrepancies prior to order confirmation and dispatch.</li>
            </ul>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

          {/* Section 3 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0A192F', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCheck size={20} color="#0058BC" />
              <span>3. Payments & KRA eTIMS Fiscal Receipts</span>
            </h2>
            <p style={{ marginBottom: '12px' }}>
              Financial settlements are executed through certified, CBK-regulated payment infrastructures:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: '700', color: '#0A192F', marginBottom: '4px' }}>M-Pesa STK Push</div>
                <div style={{ fontSize: '0.86rem', color: '#64748B' }}>Instant mobile checkout validated directly on Safaricom's secure gateway.</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: '700', color: '#0A192F', marginBottom: '4px' }}>KRA eTIMS Invoicing</div>
                <div style={{ fontSize: '0.86rem', color: '#64748B' }}>Every cleared order generates a downloadable fiscal PDF receipt with verified CU numbers.</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: '700', color: '#0A192F', marginBottom: '4px' }}>Escrow Protection</div>
                <div style={{ fontSize: '0.86rem', color: '#64748B' }}>Merchant funds remain in safe escrow until delivery and customer receipt verification.</div>
              </div>
            </div>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

          {/* Section 4 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0A192F', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Truck size={20} color="#0058BC" />
              <span>4. Shipping, Dispatch & Delivery Inspection</span>
            </h2>
            <ul style={{ paddingLeft: '24px' }}>
              <li><strong>Mombasa CBD Orders:</strong> Same-day dispatch for orders placed before 3:00 PM EAT. Direct office or doorstep courier delivery.</li>
              <li><strong>Nationwide Kenyan Shipping:</strong> 24 to 48 hours transit time to Nairobi, Kisumu, Nakuru, Eldoret, and other counties via Wells Fargo, G4S, or verified speed couriers.</li>
              <li><strong>Package Inspection:</strong> The buyer must inspect the security tamper seal of the package upon arrival. If the seal is compromised or damaged, refuse delivery and immediately contact support at <strong>+254 748 189196</strong>.</li>
            </ul>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

          {/* Section 5 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0A192F', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RefreshCw size={20} color="#0058BC" />
              <span>5. Return & Replacement Policy</span>
            </h2>
            <p style={{ marginBottom: '12px' }}>
              We stand behind every piece of hardware sold on Byte Tech Direct:
            </p>
            <ul style={{ paddingLeft: '24px' }}>
              <li><strong>Authenticity Guarantee:</strong> 100% genuine and verified hardware sourced exclusively from certified channels.</li>
              <li><strong>7-Day Dead-On-Arrival (DOA) Replacement:</strong> If a device exhibits factory hardware defects within 7 calendar days of receipt, Byte Tech will provide an immediate identical replacement or full refund.</li>
              <li><strong>Condition of Returned Goods:</strong> Returns must include all original packaging, accompanying serial tags, documentation, and accessories.</li>
            </ul>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

          {/* Section 6 */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0A192F', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={20} color="#0058BC" />
              <span>6. Governing Law & Dispute Resolution</span>
            </h2>
            <p style={{ marginBottom: '12px' }}>
              These Terms of Service shall be governed by and construed in accordance with the substantive laws of the <strong>Republic of Kenya</strong>.
            </p>
            <p>
              In the event of any controversy, claim, or dispute arising out of or relating to your use of this marketplace, the parties agree to first seek mutual amicable resolution. If unresolved within 30 days, the matter shall be submitted to the competent courts of Mombasa, Kenya.
            </p>
          </section>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

          {/* Contact Section */}
          <section style={{ background: '#F1F5F9', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0A192F', marginBottom: '8px' }}>
              Official Customer Care & Legal Inquiries
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#475569', marginBottom: '16px' }}>
              For questions regarding these Terms, contract clarifications, or return requests:
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
              <div>
                <strong>Entity:</strong> Byte Tech Ltd
              </div>
              <div>
                <strong>Direct Line:</strong> <a href="tel:+254748189196" style={{ color: '#0058BC', textDecoration: 'none', fontWeight: '700' }}>+254 748 189196</a>
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
