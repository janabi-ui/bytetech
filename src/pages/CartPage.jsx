import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, Plus, Minus, ArrowRight, ShieldCheck, 
  QrCode, ShoppingBag, ArrowLeft, CheckCircle2 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatKES } from '../data/products';
import CheckoutModal from '../components/CheckoutModal';
import ShimmerButton from '../components/magicui/ShimmerButton';

export default function CartPage() {
  const navigate = useNavigate();
  const { 
    items, 
    subtotal, 
    vatAmount, 
    netAmount, 
    deliveryFee, 
    orderTotal, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    openCheckout
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-page-empty" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '540px', margin: '0 auto' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <ShoppingBag size={40} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--midnight-navy)', marginBottom: '10px' }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
            Looking for high-performance laptops, accessories, or studio acoustics? Explore our authorized hardware catalog.
          </p>
          <ShimmerButton 
            variant="primary" 
            size="lg" 
            onClick={() => navigate('/catalog')}
          >
            <span>Explore Hardware Catalog</span>
            <ArrowRight size={18} />
          </ShimmerButton>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page" style={{ padding: '36px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--midnight-navy)' }}>
              Shopping Cart
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Review your tech gear before instant M-Pesa STK push and KRA eTIMS invoice issuance.
            </p>
          </div>
          <button
            type="button"
            onClick={clearCart}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: 'var(--accent-error)',
              fontWeight: '600'
            }}
          >
            <Trash2 size={16} />
            <span>Clear Cart</span>
          </button>
        </div>

        {/* 2-Column Layout: Cart Table & Summary Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'start'
        }}>
          {/* Left: Cart Items List */}
          <div style={{
            background: 'var(--surface-white)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--surface-border)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>Item Description</span>
              <span>Subtotal</span>
            </div>

            <div style={{ divideY: '1px solid var(--surface-border)' }}>
              {items.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--surface-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  {/* Media & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 260px' }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-frost)',
                      border: '1px solid var(--surface-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px',
                      flexShrink: 0
                    }}>
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        style={{ maxHeight: '60px', objectFit: 'contain' }}
                      />
                    </div>
                    <div>
                      <Link 
                        to={`/product/${item.id}`} 
                        style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--midnight-navy)', display: 'block', marginBottom: '4px' }}
                      >
                        {item.title}
                      </Link>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Unit Price: <strong>{formatKES(item.price)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Delete Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: '1px solid var(--surface-border)',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--surface-frost)',
                      padding: '2px'
                    }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ width: '32px', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div style={{ minWidth: '100px', textAlign: 'right', fontWeight: '800', fontSize: '1.05rem', color: 'var(--midnight-navy)' }}>
                      {formatKES(item.price * item.quantity)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      style={{ color: 'var(--text-light)', transition: 'color 0.2s', padding: '6px' }}
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px 24px', background: 'var(--surface-frost)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link 
                to="/catalog" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: '600', color: 'var(--primary-blue)' }}
              >
                <ArrowLeft size={16} />
                <span>Continue Shopping</span>
              </Link>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {items.length} unique hardware item{items.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Right: Order Summary & eTIMS Breakdown Card */}
          <div style={{
            background: 'var(--surface-white)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--surface-border)',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--midnight-navy)', marginBottom: '20px' }}>
              Order Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                <span>Net Taxable Amount</span>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{formatKES(netAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <QrCode size={16} color="var(--accent-success)" />
                  KRA eTIMS VAT (16%)
                </span>
                <span style={{ fontWeight: '600', color: 'var(--accent-success)' }}>{formatKES(vatAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                <span>Delivery (Mombasa Express Hub)</span>
                <span style={{ fontWeight: '600', color: 'var(--primary-blue)' }}>
                  {deliveryFee === 0 ? 'FREE' : formatKES(deliveryFee)}
                </span>
              </div>

              <div style={{ height: '1px', background: 'var(--surface-border)', margin: '6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--midnight-navy)' }}>
                  Total Payable
                </span>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-blue)' }}>
                  {formatKES(orderTotal)}
                </span>
              </div>
            </div>

            {/* Fiscal info badge */}
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.82rem',
              color: '#166534',
              marginBottom: '24px',
              display: 'flex',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>eTIMS Fiscalized:</strong> A verified KRA electronic tax invoice with QR code is generated upon payment.
              </div>
            </div>

            {/* Checkout Action Button */}
            <ShimmerButton
              variant="electric"
              size="lg"
              style={{ width: '100%' }}
              onClick={openCheckout}
            >
              <span>Pay with M-Pesa STK Push</span>
              <ArrowRight size={18} />
            </ShimmerButton>

            {/* Security notice */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '18px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
              <ShieldCheck size={16} />
              <span>Secured direct Safaricom M-Pesa STK push</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Drawer/Modal */}
      <CheckoutModal />
    </div>
  );
}
