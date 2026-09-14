import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatKES } from '../data/products';
import { X, Smartphone, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import ShimmerButton from './magicui/ShimmerButton';
import confetti from 'canvas-confetti';
import { apiUrl } from '../lib/api';

export function CheckoutModal() {
    const {
        cart,
        cartTotal,
        cartSubtotal,
        cartVAT,
        checkoutCustomer,
        setCheckoutCustomer,
        isCheckoutOpen,
        closeCheckout,
        clearCart
    } = useCart();

    const navigate = useNavigate();

    // Steps: 'FORM' | 'STK_WAITING' | 'SUCCESS'
    const [step, setStep] = useState('FORM');
    const [phone, setPhone] = useState(checkoutCustomer.phone || '');
    const [name, setName] = useState(checkoutCustomer.name || '');
    const [email, setEmail] = useState(checkoutCustomer.email || '');
    const [address, setAddress] = useState(checkoutCustomer.address || '');
    const [statusText, setStatusText] = useState('');
    const [errorText, setErrorText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // M-Pesa STK tracking
    const [checkoutRequestId, setCheckoutRequestId] = useState('');
    const [currentOrderId, setCurrentOrderId] = useState('');
    const [isSimulated, setIsSimulated] = useState(false);
    const [countdown, setCountdown] = useState(60);

    const pollIntervalRef = useRef(null);
    const countdownTimerRef = useRef(null);

    useEffect(() => {
        if (checkoutCustomer.phone) setPhone(checkoutCustomer.phone);
        if (checkoutCustomer.name) setName(checkoutCustomer.name);
        if (checkoutCustomer.email) setEmail(checkoutCustomer.email);
        if (checkoutCustomer.address) setAddress(checkoutCustomer.address);
    }, [checkoutCustomer]);

    // Clean up timers on unmount or close
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        };
    }, []);

    if (!isCheckoutOpen) return null;

    const normalizePhone = (raw) => {
        let p = raw.replace(/\D/g, '');
        if (p.startsWith('0')) p = '254' + p.substring(1);
        if (p.startsWith('7') || p.startsWith('1')) p = '254' + p;
        return p;
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setErrorText('');

        const cleanedPhone = normalizePhone(phone);
        if (!cleanedPhone || cleanedPhone.length !== 12 || !cleanedPhone.startsWith('254')) {
            setErrorText('Please enter a valid Safaricom phone number (e.g. 0712 345 678 or 0110 123 456).');
            return;
        }

        const customerPayload = {
            phone: cleanedPhone,
            name: name.trim() || 'Byte Tech Customer',
            email: email.trim() || `${cleanedPhone}@bytetech.co.ke`,
            address: address.trim() || 'Mombasa, Kenya'
        };

        setCheckoutCustomer(customerPayload);
        setIsProcessing(true);
        setStatusText('Sending M-Pesa STK Push prompt to your phone…');

        const custNum = cleanedPhone.startsWith('254') ? '0' + cleanedPhone.substring(3) : cleanedPhone;
        const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderId = `BT01-${custNum}-${randSuffix}`;
        setCurrentOrderId(orderId);

        try {
            const res = await fetch(apiUrl('/payments/mpesa-stk'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: cleanedPhone,
                    amount: cartTotal,
                    order_id: orderId,
                    customer: customerPayload,
                    cartItems: cart
                })
            });

            const data = await res.json();

            if (data.success && data.data?.CheckoutRequestID) {
                const reqId = data.data.CheckoutRequestID;
                setCheckoutRequestId(reqId);
                setIsSimulated(Boolean(data.data.is_simulated));
                setStep('STK_WAITING');
                setCountdown(60);
                setIsProcessing(false);

                // Start polling M-Pesa Status
                startPolling(reqId, orderId, customerPayload);
            } else {
                setIsProcessing(false);
                setErrorText(data.message || data.error || 'Failed to dispatch M-Pesa prompt. Please try again.');
            }
        } catch (err) {
            console.error('M-Pesa STK dispatch error:', err);
            setIsProcessing(false);
            setErrorText('Network error while contacting M-Pesa gateway. Please check your connection.');
        }
    };

    const startPolling = (reqId, orderId, customer) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

        countdownTimerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownTimerRef.current);
                    clearInterval(pollIntervalRef.current);
                    setErrorText('M-Pesa transaction timed out. If you already entered your PIN, you can verify your receipt.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(apiUrl('/payments/mpesa-query'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        checkout_request_id: reqId,
                        order_id: orderId
                    })
                });

                const data = await res.json();
                const status = data.data?.status;

                if (status === 'COMPLETED') {
                    clearInterval(pollIntervalRef.current);
                    clearInterval(countdownTimerRef.current);
                    await finalizeOrder(orderId, customer, data.data.receipt || reqId);
                } else if (status === 'CANCELLED' || status === 'FAILED') {
                    clearInterval(pollIntervalRef.current);
                    clearInterval(countdownTimerRef.current);
                    setStep('FORM');
                    setErrorText(data.data?.message || 'M-Pesa transaction was cancelled or declined.');
                }
            } catch (err) {
                console.warn('Status poll warning:', err);
            }
        }, 3500);
    };

    const handleSimulateApprove = async () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        const simReceipt = 'QK' + Math.random().toString(36).substring(2, 10).toUpperCase();
        await finalizeOrder(currentOrderId, checkoutCustomer, simReceipt);
    };

    const finalizeOrder = async (orderId, customer, transactionId) => {
        setStatusText('Payment confirmed! Finalizing eTIMS Tax Invoice…');
        setStep('SUCCESS');

        try {
            await fetch(apiUrl('/orders/create'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: orderId,
                    transaction_id: transactionId,
                    invoice_id: transactionId,
                    flw_transaction_id: transactionId,
                    tx_ref: orderId,
                    cartItems: cart,
                    customer: customer,
                    payment_method: 'M-Pesa'
                })
            }).catch(() => null);

            await fetch(apiUrl('/orders/fiscalize'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: orderId,
                    total_amount: cartTotal,
                    customer_name: customer.name,
                    customer_email: customer.email,
                    payment_method: 'M-Pesa',
                    items: cart
                })
            }).catch(() => null);

            const localOrder = {
                id: orderId,
                flw_transaction_id: transactionId,
                total_amount: cartTotal,
                total: cartTotal,
                subtotal: cartSubtotal,
                vat: cartVAT,
                customer_name: customer.name,
                customer_phone: customer.phone,
                customer_email: customer.email,
                shipping_address: customer.address,
                payment_method: 'M-Pesa',
                created_at: new Date().toISOString(),
                items: cart
            };
            localStorage.setItem(`tn_order_${orderId}`, JSON.stringify(localOrder));
            localStorage.setItem('bytetechltd_last_order', JSON.stringify(localOrder));

            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
            clearCart();
            closeCheckout();
            navigate(`/receipt?orderId=${encodeURIComponent(orderId)}`);
        } catch (err) {
            console.error('Finalize error:', err);
            navigate(`/receipt?orderId=${encodeURIComponent(orderId)}`);
        }
    };

    const inputBase = {
        width: '100%',
        background: 'var(--surface-frost)',
        border: '1.5px solid var(--surface-border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        fontSize: '0.9rem',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-body)',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.78rem',
        fontWeight: '700',
        color: 'var(--text-muted)',
        marginBottom: '5px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    };

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget && !isProcessing && step !== 'STK_WAITING') closeCheckout(); }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(10, 25, 47, 0.65)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                animation: 'co-fadeIn 0.2s ease',
            }}
        >
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '520px',
                background: 'var(--surface-white)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                boxShadow: '0 -12px 48px rgba(10,25,47,0.14)',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'co-slideUp 0.3s cubic-bezier(.16,1,.3,1)',
            }}>
                {/* Drag handle */}
                <div style={{
                    width: '44px', height: '5px',
                    background: 'var(--surface-border)',
                    borderRadius: '999px',
                    margin: '12px auto 4px',
                    flexShrink: 0,
                }} />

                {/* Header */}
                <div style={{
                    padding: '14px 24px 16px',
                    borderBottom: '1px solid var(--surface-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(16, 185, 129, 0.25)'
                        }}>
                            <Smartphone size={20} color="#10B981" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--midnight-navy)', margin: 0 }}>
                                Safaricom M-Pesa Express
                            </h2>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '1px 0 0' }}>
                                Instant STK Push • Official Tax Invoiced
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeCheckout}
                        disabled={isProcessing}
                        style={{
                            width: '34px', height: '34px',
                            borderRadius: '50%',
                            background: 'var(--surface-frost)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--surface-border)'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content Area */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    
                    {errorText && (
                        <div style={{
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-md)',
                            background: '#FEF2F2',
                            border: '1px solid #FCA5A5',
                            color: '#991B1B',
                            fontSize: '0.84rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '18px'
                        }}>
                            <AlertCircle size={17} style={{ flexShrink: 0 }} />
                            <span>{errorText}</span>
                        </div>
                    )}

                    {/* Step 1: Customer Input Form */}
                    {step === 'FORM' && (
                        <form onSubmit={handleFormSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                
                                <div>
                                    <label style={labelStyle}>M-Pesa Phone Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="0712 345 678 or 2547..."
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            style={{ ...inputBase, paddingLeft: '40px', fontWeight: '700', fontSize: '0.95rem' }}
                                        />
                                        <Smartphone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#10B981' }} />
                                    </div>
                                    <span style={{ fontSize: '0.74rem', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                                        The M-Pesa PIN prompt will appear automatically on this handset.
                                    </span>
                                </div>

                                <div>
                                    <label style={labelStyle}>Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. John Kamau"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={inputBase}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Delivery Address / Mombasa CBD Location</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Nyali, Digo Road, Mombasa"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        style={inputBase}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle}>Email Address (For Tax Receipt)</label>
                                    <input
                                        type="email"
                                        placeholder="name@company.co.ke"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={inputBase}
                                    />
                                </div>

                                {/* Order Summary Box */}
                                <div style={{
                                    background: 'var(--surface-frost)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '16px',
                                    border: '1px solid var(--surface-border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                        <span>Items Subtotal:</span>
                                        <span>{formatKES(cartSubtotal)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        <span>16% VAT Included:</span>
                                        <span>{formatKES(cartVAT)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '800', color: 'var(--midnight-navy)', borderTop: '1px solid var(--surface-border)', paddingTop: '8px' }}>
                                        <span>Total to Pay:</span>
                                        <span style={{ color: 'var(--primary-blue)' }}>{formatKES(cartTotal)}</span>
                                    </div>
                                </div>

                                <ShimmerButton
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    disabled={isProcessing}
                                    style={{ width: '100%', marginTop: '6px' }}
                                >
                                    {isProcessing ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            <Loader2 size={18} className="spin" />
                                            <span>{statusText || 'Contacting M-Pesa…'}</span>
                                        </span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            <span>Pay {formatKES(cartTotal)} via M-Pesa</span>
                                            <ArrowRight size={18} />
                                        </span>
                                    )}
                                </ShimmerButton>

                            </div>
                        </form>
                    )}

                    {/* Step 2: Waiting for STK Push Entry on Phone */}
                    {step === 'STK_WAITING' && (
                        <div style={{ textAlign: 'center', padding: '12px 8px' }}>
                            <div style={{
                                width: '72px', height: '72px',
                                borderRadius: '50%',
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '2px solid #10B981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 18px',
                                position: 'relative'
                            }}>
                                <Smartphone size={36} color="#10B981" />
                                <span style={{
                                    position: 'absolute',
                                    inset: '-6px',
                                    borderRadius: '50%',
                                    border: '2px dashed #10B981',
                                    animation: 'spin 12s linear infinite'
                                }} />
                            </div>

                            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--midnight-navy)', marginBottom: '8px' }}>
                                Check Your Phone Screen
                            </h3>

                            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto 20px' }}>
                                An automated STK Push prompt has been sent to <strong>{phone}</strong>.
                                Enter your <strong>M-Pesa PIN</strong> to complete <strong>{formatKES(cartTotal)}</strong>.
                            </p>

                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '999px',
                                background: 'var(--surface-frost)',
                                border: '1px solid var(--surface-border)',
                                fontSize: '0.84rem',
                                color: 'var(--text-main)',
                                fontWeight: '700',
                                marginBottom: '24px'
                            }}>
                                <RefreshCw size={14} className="spin" color="var(--primary-blue)" />
                                <span>Awaiting PIN verification ({countdown}s)...</span>
                            </div>

                            {/* Simulation helper button for sandbox testing */}
                            {isSimulated && (
                                <div style={{
                                    padding: '14px',
                                    borderRadius: 'var(--radius-md)',
                                    background: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                    marginBottom: '20px'
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '700', marginBottom: '8px' }}>
                                        ⚡ Sandbox / Test Environment Active
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSimulateApprove}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '999px',
                                            background: '#16A34A',
                                            color: '#FFFFFF',
                                            fontWeight: '700',
                                            fontSize: '0.84rem',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Simulate Instant PIN Approval
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => setStep('FORM')}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '999px',
                                        background: 'transparent',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.86rem',
                                        fontWeight: '600',
                                        border: '1px solid var(--surface-border)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Change Phone Number
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success Confirmation State */}
                    {step === 'SUCCESS' && (
                        <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                            <div style={{
                                width: '64px', height: '64px',
                                borderRadius: '50%',
                                background: '#ECFDF5',
                                border: '2px solid #10B981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px'
                            }}>
                                <CheckCircle2 size={36} color="#10B981" />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--midnight-navy)', marginBottom: '6px' }}>
                                M-Pesa Payment Received!
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                {statusText || 'Redirecting to your official KRA eTIMS invoice receipt…'}
                            </p>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}

export default CheckoutModal;
