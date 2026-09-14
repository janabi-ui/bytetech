import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Printer, ArrowLeft, FileText, Search, 
  AlertCircle, Download, FileCode, Check, Trash2, X
} from 'lucide-react';
import { formatKES } from '../data/products';
import { apiUrl } from '../lib/api';

export default function ReceiptPage() {
  const { id: routeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryId = searchParams.get('order_id') || searchParams.get('id') || searchParams.get('orderId');
  const targetId = (routeId || queryId || '').trim();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(targetId));
  const [searchQuery, setSearchQuery] = useState(targetId);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastLocalOrder, setLastLocalOrder] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Check for locally cached recent order on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bytetechltd_last_order');
      if (stored) {
        setLastLocalOrder(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse last local order:', e);
    }
  }, []);

  // Fetch or resolve order whenever targetId changes
  useEffect(() => {
    if (!targetId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // 1. Check local storage for quick match
    let localMatch = null;
    try {
      const direct = localStorage.getItem(`bt_order_${targetId}`) || localStorage.getItem(`tn_order_${targetId}`);
      if (direct) {
        localMatch = JSON.parse(direct);
      } else {
        const last = localStorage.getItem('bytetechltd_last_order');
        if (last) {
          const parsed = JSON.parse(last);
          const rawTarget = targetId.replace(/\D/g, '');
          const orderPhone = (parsed.customer_phone || parsed.phone || '').replace(/\D/g, '');
          if (parsed && (
            parsed.id === targetId || 
            parsed.flw_tx_ref === targetId ||
            (rawTarget.length >= 7 && (orderPhone.includes(rawTarget) || rawTarget.includes(orderPhone)))
          )) {
            localMatch = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Local order read error:', e);
    }

    // 2. Fetch live database record from API
    fetch(apiUrl(`/orders/get?id=${encodeURIComponent(targetId)}`))
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Order not found' : 'Failed to fetch order');
        }
        return res.json();
      })
      .then((data) => {
        const fetchedOrder = data?.data?.order || data?.order;
        if (fetchedOrder) {
          setOrder(fetchedOrder);
        } else if (localMatch) {
          setOrder(localMatch);
        } else {
          setOrder(null);
          setErrorMsg(`No record found for Order ID "${targetId}". Please verify the reference.`);
        }
      })
      .catch((err) => {
        if (localMatch) {
          setOrder(localMatch);
        } else {
          setOrder(null);
          setErrorMsg(
            err.message === 'Order not found'
              ? `No active order found with ID "${targetId}". Please verify the reference.`
              : 'Could not connect to database server. Please check your network and try again.'
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [targetId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const clean = (searchQuery || '').trim();
    if (!clean) return;
    navigate(`/receipt?orderId=${encodeURIComponent(clean)}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetSearch = () => {
    setOrder(null);
    setErrorMsg(null);
    setSearchQuery('');
    navigate('/receipt');
  };

  /**
   * Generates a 100% visual-match PDF directly matching the online screen view,
   * with exact colors, full width header, green status badge with checkmark, item table, and KRA eTIMS QR.
   */
  const handleDownloadPdf = async () => {
    if (!order || isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const element = document.getElementById('printable-receipt');
      if (!element) {
        window.print();
        setIsGeneratingPdf(false);
        return;
      }

      if (window.html2pdf) {
        const opt = {
          margin: [8, 8, 8, 8],
          filename: `ByteTech_Official_Receipt_${order.id}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            allowTaint: true, 
            logging: false, 
            scrollX: 0,
            scrollY: 0 
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: 'avoid-all' }
        };

        await window.html2pdf().set(opt).from(element).save();
        setDownloadSuccess('pdf');
        setTimeout(() => setDownloadSuccess(null), 3000);
      } else {
        window.print();
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadJson = () => {
    if (!order) return;
    const jsonStr = JSON.stringify(order, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ByteTech_Tax_Invoice_${order.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('json');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDeleteReceipt = async () => {
    if (!order) return;
    setIsDeleting(true);
    try {
      const pin = sessionStorage.getItem('tn_admin_pin') || '';
      await fetch(apiUrl('/orders/delete'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(pin ? { 'x-admin-pin': pin } : {})
        },
        body: JSON.stringify({ order_id: order.id })
      });

      // Purge local storage cached orders
      try {
        localStorage.removeItem(`tn_order_${order.id}`);
        localStorage.removeItem(`bt_order_${order.id}`);
        const last = localStorage.getItem('bytetechltd_last_order');
        if (last) {
          const parsed = JSON.parse(last);
          if (parsed && (parsed.id === order.id || parsed.flw_tx_ref === order.id)) {
            localStorage.removeItem('bytetechltd_last_order');
            setLastLocalOrder(null);
          }
        }
      } catch (_) {}

      const deletedId = order.id;
      setDeleteConfirmOpen(false);
      setOrder(null);
      setErrorMsg(null);
      setSearchQuery('');
      navigate('/receipt');
      alert(`Receipt #${deletedId} was permanently deleted.`);
    } catch (err) {
      console.error('Failed to delete receipt:', err);
      alert('Unable to delete receipt. Please check your connection.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearLocalOrder = (e) => {
    if (e) e.stopPropagation();
    try {
      localStorage.removeItem('bytetechltd_last_order');
      if (lastLocalOrder?.id) {
        localStorage.removeItem(`tn_order_${lastLocalOrder.id}`);
        localStorage.removeItem(`bt_order_${lastLocalOrder.id}`);
      }
      setLastLocalOrder(null);
    } catch (_) {}
  };

  return (
    <div className="receipt-page" style={{ background: '#0A192F', minHeight: '100vh', padding: '40px 16px 80px' }}>
      {/* Embedded Print & Export Styling */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: auto;
            margin: 8mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .receipt-page {
            background: #ffffff !important;
            padding: 0 !important;
            min-height: auto !important;
          }
          .no-print,
          .receipt-nav-bar,
          .receipt-download-bar,
          header,
          nav,
          footer,
          .mobile-bottom-nav {
            display: none !important;
          }
          .receipt-card {
            box-shadow: none !important;
            border: 1px solid #CBD5E1 !important;
            border-radius: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
        #printable-receipt {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      `}</style>

      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        
        {/* Navigation & Action Bar */}
        <div className="receipt-nav-bar no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <Link 
            to="/catalog" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '0.9rem', textDecoration: 'none' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Byte Tech Catalog</span>
          </Link>

          {order && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleResetSearch}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 15px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  fontWeight: '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <Search size={14} />
                <span>Search Order</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '999px',
                  background: downloadSuccess === 'pdf' ? '#059669' : 'linear-gradient(135deg, #00D1FF, #0058BC)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.86rem',
                  cursor: isGeneratingPdf ? 'wait' : 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(0, 209, 255, 0.25)',
                  transition: 'all 0.2s',
                  opacity: isGeneratingPdf ? 0.8 : 1
                }}
              >
                {isGeneratingPdf ? (
                  <>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span>Generating PDF…</span>
                  </>
                ) : downloadSuccess === 'pdf' ? (
                  <>
                    <Check size={16} />
                    <span>PDF Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Download PDF Receipt</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
              >
                <Printer size={16} />
                <span>Save as PDF / Print</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isDeleting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '999px',
                  background: 'rgba(239, 68, 68, 0.16)',
                  color: '#FCA5A5',
                  fontWeight: '700',
                  fontSize: '0.86rem',
                  cursor: isDeleting ? 'wait' : 'pointer',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={16} />
                <span>Delete Receipt</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.7)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '16px', 
            padding: '60px 20px', 
            textAlign: 'center' 
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              border: '4px solid rgba(0, 209, 255, 0.2)',
              borderTopColor: '#00D1FF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
              Retrieving live fiscal order data from secure database…
            </p>
          </div>
        )}

        {/* Lookup Portal when no order is displayed */}
        {!loading && !order && (
          <div style={{
            background: '#0F2038',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '36px 28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
          }}>
            <div style={{ textAlign: 'center', maxWidth: '580px', margin: '0 auto 32px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(0, 209, 255, 0.2), rgba(0, 88, 188, 0.2))',
                border: '1px solid rgba(0, 209, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#00D1FF'
              }}>
                <FileText size={26} />
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '8px' }}>
                Official Tax Receipt & Order Lookup
              </h1>
              <p style={{ fontSize: '0.92rem', color: '#94A3B8', lineHeight: 1.5 }}>
                Enter your <strong>Receipt Reference (BT01-...)</strong> or your <strong>Customer Phone Number</strong> to verify payment clearance, view KRA eTIMS fiscal compliance details, and download your official PDF receipt.
              </p>
            </div>

            {/* Error Message if search failed */}
            {errorMsg && (
              <div style={{
                maxWidth: '560px',
                margin: '0 auto 24px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#FCA5A5',
                fontSize: '0.88rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#0A1526',
                border: '1.5px solid rgba(0, 209, 255, 0.3)',
                borderRadius: '12px',
                padding: '6px 16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}>
                <Search size={18} color="#64748B" style={{ flexShrink: 0, marginRight: '8px' }} />
                <input
                  type="text"
                  placeholder="e.g. BT01-0712345678-XXXX or 0712345678"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    padding: '10px 0'
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #00D1FF, #0058BC)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em'
                }}
              >
                Lookup Receipt
              </button>
            </form>

            {/* Quick Access to Last Local Order if Available */}
            {lastLocalOrder && (
              <div style={{
                maxWidth: '560px',
                margin: '28px auto 0',
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B' }}>
                    Recent Device Order
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#F1F5F9', fontFamily: 'monospace' }}>
                    {lastLocalOrder.id}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    {formatKES(lastLocalOrder.total_amount || lastLocalOrder.total || 0)} • {lastLocalOrder.payment_method || 'M-Pesa'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/receipt?orderId=${encodeURIComponent(lastLocalOrder.id)}`)}
                    style={{
                      background: 'rgba(0, 209, 255, 0.15)',
                      border: '1px solid rgba(0, 209, 255, 0.4)',
                      color: '#00D1FF',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    View Receipt
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLocalOrder}
                    title="Dismiss cached order"
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#FCA5A5',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Printable Official Receipt Card (when an order is active) */}
        {!loading && order && (
          <>
            <div 
              id="printable-receipt" 
              className="receipt-card" 
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 80px rgba(0,0,0,0.4)',
                width: '100%',
                maxWidth: '820px',
                margin: '0 auto'
              }}
            >
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #0A192F 0%, #0D2847 100%)',
                padding: '28px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#ffffff',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0058BC, #00D1FF)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: '800'
                  }}>B</div>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>Byte Tech Ltd</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Electronics Marketplace & Authorized Hardware</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#00D1FF', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Official Tax Receipt
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#ffffff', marginTop: '4px', fontFamily: 'monospace', fontWeight: '800', letterSpacing: '0.5px' }}>
                    Receipt #{order.id}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '3px' }}>
                    Branch / Terminal: <strong style={{ color: '#00D1FF' }}>BT01</strong>
                  </div>
                </div>
              </div>

              {/* Metadata Block: Customer & Payment */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                padding: '24px 32px',
                borderBottom: '1px solid #E2E8F0'
              }}>
                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8', marginBottom: '8px' }}>
                    Billed Customer
                  </h4>
                  <p style={{ fontWeight: '800', color: '#1E293B', fontSize: '1.05rem' }}>
                    {order.customer_name || order.customerName || 'Authorized Buyer'}
                  </p>
                  <p style={{ color: '#0058BC', fontSize: '0.9rem', marginTop: '4px', fontWeight: '700', fontFamily: 'monospace' }}>
                    Customer No: {order.customer_phone || order.phone || 'Phone on File'}
                  </p>
                  {(order.customer_email || order.email) && (
                    <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '2px' }}>
                      {order.customer_email || order.email}
                    </p>
                  )}
                  <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '2px' }}>
                    {order.shipping_address || order.address || 'Standard Delivery Hub'}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8', marginBottom: '8px' }}>
                    Payment Verification
                  </h4>
                  
                  {/* Robust Non-Flex Verification Badge (100% html2canvas & print compatible) */}
                  <div style={{ 
                    display: 'inline-block', 
                    background: order.status === 'pending' ? '#FEF3C7' : '#DCFCE7', 
                    padding: '5px 14px', 
                    borderRadius: '999px',
                    border: order.status === 'pending' ? '1px solid #FDE68A' : '1px solid #BBF7D0'
                  }}>
                    <svg 
                      width="15" 
                      height="15" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke={order.status === 'pending' ? '#B45309' : '#15803D'} 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span style={{ 
                      display: 'inline-block', 
                      verticalAlign: 'middle', 
                      color: order.status === 'pending' ? '#B45309' : '#15803D',
                      fontSize: '0.82rem', 
                      fontWeight: '700'
                    }}>
                      {order.status === 'paid' ? 'Payment Verified & Cleared' : (order.status || 'Verified')}
                    </span>
                  </div>

                  <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '8px' }}>
                    Method: <strong>{order.payment_method || 'M-Pesa'}</strong>
                  </p>
                  <p style={{ color: '#475569', fontSize: '0.85rem' }}>
                    Txn Ref: <strong style={{ fontFamily: 'monospace' }}>{order.flw_transaction_id || order.flw_tx_ref || order.txnId || 'MPESA-TXN'}</strong>
                  </p>
                  <p style={{ color: '#94A3B8', fontSize: '0.82rem', marginTop: '4px' }}>
                    {order.created_at ? new Date(order.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : (order.date || new Date().toLocaleString())}
                  </p>
                </div>
              </div>

              {/* Item Table */}
              <div style={{ padding: '0 32px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: '16px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>Hardware Item</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>Qty</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>Unit Price</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items && order.items.length > 0) ? (
                      order.items.map((item, idx) => {
                        const itemName = item.product_name || item.title || 'Hardware Item';
                        const itemQty = Number(item.quantity || 1);
                        const itemPrice = Number(item.unit_price || item.price || 0);
                        const itemTotal = Number(item.total_price || (itemPrice * itemQty));

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '14px', color: '#1E293B', fontWeight: '600' }}>
                              <div>{itemName}</div>
                              {item.seller_name && (
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '3px' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                                    <path d="M2 7h20" />
                                  </svg>
                                  <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>{item.seller_name}</span>
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'center', color: '#475569' }}>
                              {itemQty}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'right', color: '#475569' }}>
                              {formatKES(itemPrice)}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'right', color: '#0F172A', fontWeight: '700' }}>
                              {formatKES(itemTotal)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
                          No itemized lines recorded for this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Calculation */}
              {(() => {
                const total = Number(order.total_amount || order.total || 0);
                const vat = Number(order.vat || (order.vat_breakdown?.vat_amount) || Math.round(total * (0.16 / 1.16)));
                const subtotal = Number(order.subtotal || (order.vat_breakdown?.subtotal) || (total - vat));
                const cuSerial = order.kra_cu_number || order.cuSerial || 'KRA-VSCU-001';
                const cuInvoice = order.kra_invoice_number || order.cuInvoice || `KRA-BT01-${order.id}`;
                const qrUrl = order.kra_qr_url || order.etimsQr || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://itax.kra.go.ke/KRA-Portal/invoiceConfirmation.htm?cuNumber=${cuSerial}&invoiceNumber=${cuInvoice}&pin=P051234567Z`)}`;

                return (
                  <>
                    <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #E2E8F0', marginTop: '16px' }}>
                      <div style={{ minWidth: '280px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.9rem', color: '#475569' }}>
                          <span>Subtotal (Excl. VAT 16%)</span>
                          <span>{formatKES(subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.9rem', color: '#475569' }}>
                          <span>KRA VAT (16%)</span>
                          <span style={{ color: '#10B981', fontWeight: '600' }}>{formatKES(vat)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', fontSize: '1.25rem', fontWeight: '800', color: '#0A192F', borderTop: '2px solid #0A192F', marginTop: '8px' }}>
                          <span>Total Paid</span>
                          <span style={{ color: '#0058BC' }}>{formatKES(total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* KRA eTIMS Fiscal Compliance Block */}
                    <div style={{
                      margin: '0 32px 28px',
                      padding: '18px 24px',
                      background: '#F8FAFC',
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}>
                      <div style={{ flex: '1 1 280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: '800', color: '#0A192F', marginBottom: '8px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                          <span>KRA eTIMS FISCAL TAX INVOICE</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, fontFamily: 'monospace' }}>
                          <div><strong>KRA PIN:</strong> P051234567Z</div>
                          <div><strong>BRANCH CODE:</strong> BT01 (Store HQ)</div>
                          <div><strong>CU SERIAL:</strong> {cuSerial}</div>
                          <div><strong>CU INVOICE NO:</strong> {cuInvoice}</div>
                          <div><strong>TAX CLASSIFICATION:</strong> Rate A (16% VAT Inclusive)</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <img 
                          src={qrUrl} 
                          crossOrigin="anonymous"
                          alt="KRA eTIMS QR" 
                          style={{ width: '92px', height: '92px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px', background: '#fff', display: 'block', margin: '0 auto 6px' }}
                        />
                        <a 
                          href={`https://itax.kra.go.ke/KRA-Portal/invoiceChk.htm?cu=${cuInvoice}`}
                          target="_blank" 
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: '#0058BC', fontWeight: '700', textDecoration: 'none' }}
                        >
                          <span>Verify on iTax &rarr;</span>
                        </a>
                      </div>
                    </div>

                    {/* Footer Note */}
                    <div style={{ background: '#F8FAFC', padding: '18px 32px', textAlign: 'center', borderTop: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#64748B' }}>
                      <p>Thank you for shopping with Byte Tech Ltd. Genuine hardware direct from authorized dealers.</p>
                      <p style={{ marginTop: '4px' }}>For tax credit reconciliation, quote CU INVOICE: <strong>{cuInvoice}</strong></p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Dedicated Download & Export Bar below receipt */}
            <div className="receipt-download-bar no-print" style={{
              marginTop: '24px',
              padding: '20px 24px',
              background: 'rgba(15, 32, 56, 0.9)',
              border: '1px solid rgba(0, 209, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '0.95rem' }}>
                  Download & Export Your Official Documents
                </div>
                <div style={{ color: '#94A3B8', fontSize: '0.82rem', marginTop: '2px' }}>
                  Direct PDF document download matching the exact official invoice layout.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: downloadSuccess === 'pdf' ? '#059669' : 'linear-gradient(135deg, #00D1FF, #0058BC)',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.86rem',
                    cursor: isGeneratingPdf ? 'wait' : 'pointer',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0, 209, 255, 0.2)',
                    opacity: isGeneratingPdf ? 0.8 : 1
                  }}
                >
                  {isGeneratingPdf ? (
                    <>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#ffffff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span>Generating PDF…</span>
                    </>
                  ) : downloadSuccess === 'pdf' ? (
                    <>
                      <Check size={16} />
                      <span>PDF Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Download PDF Receipt</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#CBD5E1',
                    fontWeight: '600',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.18)'
                  }}
                >
                  <Printer size={16} />
                  <span>Save as PDF / Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: downloadSuccess === 'json' ? '#059669' : 'rgba(255, 255, 255, 0.06)',
                    color: '#94A3B8',
                    fontWeight: '600',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                >
                  {downloadSuccess === 'json' ? <Check size={14} /> : <FileCode size={14} />}
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Delete Receipt Confirmation Modal */}
        {deleteConfirmOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 25, 47, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: '#0D213D',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
              color: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444',
                  flexShrink: 0
                }}>
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Delete Receipt?</h3>
                  <div style={{ fontSize: '0.8rem', color: '#F87171' }}>Permanent Deletion</div>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#CBD5E1', lineHeight: 1.5, marginBottom: '22px' }}>
                Are you sure you want to permanently delete receipt <strong style={{ color: '#F87171', fontFamily: 'monospace' }}>#{order?.id}</strong>? This action purges the order and itemized line records from both the database and local storage.
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={isDeleting}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#E2E8F0',
                    fontWeight: 600,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteReceipt}
                  disabled={isDeleting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: '#DC2626',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: isDeleting ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={15} />
                  <span>{isDeleting ? 'Deleting…' : 'Yes, Delete Receipt'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
