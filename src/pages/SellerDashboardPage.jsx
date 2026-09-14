import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, TrendingUp, DollarSign, Plus,
  Trash2, LogOut, CheckCircle2, QrCode, X, Upload, Camera,
  Link2, BarChart3, ShieldCheck, ChevronRight, ArrowUpRight,
  Bell, Zap, Menu, Store, Inbox, Download, Search, Edit3,
  ExternalLink, Phone, Check, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatKES } from '../data/products';
import { apiUrl } from '../lib/api';

/* ─── Design tokens ─────────────────────────────────────── */
const C = {
  bg: '#F8FAFC', sidebar: '#FFFFFF', card: '#FFFFFF',
  border: '#E2E8F0', borderLight: '#F1F5F9',
  primary: '#0058BC', primaryLight: '#EFF6FF', primaryMid: '#DBEAFE',
  text: '#0F172A', textSub: '#64748B', textLight: '#94A3B8',
  success: '#16A34A', successBg: '#F0FDF4', successBorder: '#BBF7D0',
  error: '#DC2626', errorBg: '#FEF2F2',
  warning: '#D97706', warningBg: '#FFFBEB',
  shadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 24px rgba(0,0,0,0.08)',
};

/* ─── Metric Card ────────────────────────────────────────── */
const MetricCard = ({ label, value, sub, subUp = true, icon: Icon, accent = C.primary, accentBg = C.primaryLight }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 24px', boxShadow: C.shadow, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: '16px 16px 0 0', opacity: 0.7 }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{label}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', fontWeight: 600, color: subUp ? C.success : C.textSub, marginTop: 6 }}>{sub}</div>}
      </div>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={accent} />
      </div>
    </div>
  </div>
);

/* ─── Sidebar Nav Item ───────────────────────────────────── */
const NavItem = ({ icon: Icon, label, active, badge, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
    width: '100%', cursor: 'pointer', textAlign: 'left',
    background: active ? C.primaryLight : 'transparent',
    border: active ? `1px solid ${C.primaryMid}` : '1px solid transparent',
    color: active ? C.primary : C.textSub,
    fontWeight: active ? 700 : 500, fontSize: '0.875rem', transition: 'all 0.15s',
  }}>
    <Icon size={16} /><span style={{ flex: 1 }}>{label}</span>
    {badge != null && <span style={{ padding: '2px 7px', borderRadius: 999, background: C.primaryMid, color: C.primary, fontSize: '0.7rem', fontWeight: 700 }}>{badge}</span>}
    {active && <ChevronRight size={13} color={C.primary} />}
  </button>
);

/* ─── Empty State ────────────────────────────────────────── */
const EmptyRow = ({ label, cols = 6 }) => (
  <tr>
    <td colSpan={cols} style={{ padding: '52px 20px', textAlign: 'center' }}>
      <Inbox size={36} style={{ margin: '0 auto 12px', display: 'block', color: C.textLight, opacity: 0.5 }} />
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: C.textSub }}>{label}</div>
      <div style={{ fontSize: '0.78rem', color: C.textLight, marginTop: 4 }}>Add your first product or share your catalog to get started.</div>
    </td>
  </tr>
);

/* ─── Image Uploader ─────────────────────────────────────── */
function ImageUploader({ value, onChange }) {
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [preview, setPreview] = useState(value || '');
  const [tab, setTab] = useState('url');
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPreview(ev.target.result); onChange(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s); setCameraActive(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 100);
    } catch { alert('Camera permission denied or unavailable.'); }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current, video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const url = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(url); onChange(url); stopCamera();
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null); setCameraActive(false);
  };

  useEffect(() => () => { if (stream) stream.getTracks().forEach(t => t.stop()); }, [stream]);

  const inputBase = { width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.875rem', background: C.bg, border: `1px solid ${C.border}`, color: C.text, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' };

  return (
    <div>
      {preview && (
        <div style={{ marginBottom: 12, position: 'relative' }}>
          <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 12, border: `1px solid ${C.border}`, display: 'block' }} />
          <button type="button" onClick={() => { setPreview(''); onChange(''); }} style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={12} />
          </button>
        </div>
      )}

      {cameraActive && (
        <div style={{ position: 'relative', marginBottom: 12, borderRadius: 12, overflow: 'hidden', background: '#000', border: `2px solid ${C.primary}` }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button type="button" onClick={capturePhoto} style={{ padding: '9px 20px', borderRadius: 999, fontWeight: 700, fontSize: '0.85rem', background: C.primary, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Camera size={15} /> Capture
            </button>
            <button type="button" onClick={stopCamera} style={{ padding: '9px 14px', borderRadius: 999, fontWeight: 600, fontSize: '0.85rem', background: C.errorBg, color: C.error, border: `1px solid #FECACA`, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[['url', Link2, 'URL'], ['file', Upload, 'Upload'], ['camera', Camera, 'Camera']].map(([t, Icon, lbl]) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 10px', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', background: tab === t ? C.primaryLight : C.bg, border: tab === t ? `1.5px solid ${C.primaryMid}` : `1px solid ${C.border}`, color: tab === t ? C.primary : C.textSub, transition: 'all 0.15s' }}>
            <Icon size={13} /> {lbl}
          </button>
        ))}
      </div>

      {tab === 'url' && (
        <input type="url" style={inputBase} placeholder="https://example.com/image.jpg"
          value={preview.startsWith('data:') ? '' : preview}
          onChange={e => { setPreview(e.target.value); onChange(e.target.value); }}
          onFocus={e => e.target.style.borderColor = C.primary}
          onBlur={e => e.target.style.borderColor = C.border}
        />
      )}
      {tab === 'file' && (
        <div onClick={() => fileRef.current?.click()} style={{ padding: '22px', borderRadius: 12, border: `2px dashed ${C.border}`, background: C.bg, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = C.primaryLight; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; }}>
          <Upload size={22} style={{ margin: '0 auto 8px', color: C.primary, display: 'block' }} />
          <div style={{ fontWeight: 600, color: C.textSub, fontSize: '0.85rem' }}>Click to browse files</div>
          <div style={{ fontSize: '0.73rem', color: C.textLight, marginTop: 3 }}>PNG, JPG, WEBP — max 5 MB</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}
      {tab === 'camera' && !cameraActive && (
        <button type="button" onClick={openCamera} style={{ width: '100%', padding: '20px', borderRadius: 12, border: `2px dashed ${C.border}`, background: C.bg, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = C.primaryLight; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; }}>
          <Camera size={24} color={C.primary} />
          <span style={{ fontWeight: 600, color: C.textSub, fontSize: '0.85rem' }}>Open Camera</span>
          <span style={{ fontSize: '0.73rem', color: C.textLight }}>Tap to capture product photo</span>
        </button>
      )}
    </div>
  );
}

/* ─── Add/Edit Product Modal ────────────────────────────── */
function AddProductModal({ onClose, onAdd, initialProduct }) {
  const isEditing = !!initialProduct;
  const [form, setForm] = useState({
    name: initialProduct?.name || '',
    category: initialProduct?.category || 'Laptops',
    price: initialProduct?.price != null ? String(initialProduct.price) : '',
    stock: initialProduct?.stock != null ? String(initialProduct.stock) : '10',
    description: initialProduct?.description || '',
    specs: initialProduct?.specs || '',
    image_url: initialProduct?.image_url || ''
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const labelStyle = { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 };
  const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 11, fontSize: '0.9rem', background: C.bg, border: `1px solid ${C.border}`, color: C.text, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' };
  const onFocus = e => e.target.style.borderColor = C.primary;
  const onBlur = e => e.target.style.borderColor = C.border;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    onAdd({
      id: initialProduct?.id || `p-${Date.now()}`,
      name: form.name,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      description: form.description || '',
      specs: form.specs || '',
      is_active: true,
      image_url: form.image_url || ''
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 580, background: C.card, borderRadius: '24px 24px 0 0', border: `1px solid ${C.border}`, borderBottom: 'none', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -12px 60px rgba(0,0,0,0.15)' }}>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: C.border }} />
        </div>

        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: C.card, padding: '16px 24px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} color={C.primary} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: C.text, fontSize: '1rem' }}>
                {isEditing ? 'Edit Hardware Listing' : 'List New Hardware'}
              </div>
              <div style={{ fontSize: '0.72rem', color: C.textLight }}>
                {isEditing ? `Update listing specs & pricing for ${initialProduct.id}` : 'Publish item to Byte Tech Marketplace'}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: C.bg, border: `1px solid ${C.border}`, color: C.textSub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div>
              <label style={labelStyle}>Product Photo</label>
              <ImageUploader value={form.image_url} onChange={v => set('image_url', v)} />
            </div>

            <div>
              <label style={labelStyle}>Product Name / Model *</label>
              <input type="text" required placeholder="e.g. Apple MacBook Pro M3 Max 16-inch" style={inputStyle} onFocus={onFocus} onBlur={onBlur} value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select style={{ ...inputStyle, appearance: 'auto' }} value={form.category} onChange={e => set('category', e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                  <option value="Laptops">Laptops</option>
                  <option value="Phones">Phones</option>
                  <option value="Audio">Audio</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Monitors">Monitors</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Price (KES) *</label>
                <input type="number" required min="1" placeholder="e.g. 245000" style={inputStyle} onFocus={onFocus} onBlur={onBlur} value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Inventory Stock Units</label>
              <input type="number" min="0" placeholder="e.g. 15" style={inputStyle} onFocus={onFocus} onBlur={onBlur} value={form.stock} onChange={e => set('stock', e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Description (optional)</label>
              <textarea rows={3} placeholder="Describe the hardware condition, specifications, and package contents…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} onFocus={onFocus} onBlur={onBlur} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Key Specifications</label>
              <input type="text" placeholder="e.g. 36GB RAM, 1TB SSD, 16-core GPU, Space Black" style={inputStyle} onFocus={onFocus} onBlur={onBlur} value={form.specs} onChange={e => set('specs', e.target.value)} />
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 12, background: C.successBg, border: `1px solid ${C.successBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <QrCode size={16} color={C.success} />
              <div style={{ fontSize: '0.78rem', color: C.success }}>
                <strong>KRA eTIMS Auto-Sealing</strong> — 16% VAT electronic tax invoice generated automatically on customer checkout.
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div style={{ padding: '16px 24px 28px', display: 'flex', gap: 12, position: 'sticky', bottom: 0, background: C.card, borderTop: `1px solid ${C.border}` }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 13, fontWeight: 700, fontSize: '0.9rem', background: C.bg, border: `1px solid ${C.border}`, color: C.textSub, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 2, padding: '13px', borderRadius: 13, fontWeight: 800, fontSize: '0.9rem', background: 'linear-gradient(135deg,#0058BC,#2563EB)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(0,88,188,0.28)' }}>
              <CheckCircle2 size={17} /> {isEditing ? 'Save Changes' : 'Publish to Byte Tech'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Seller Dashboard ──────────────────────────────── */
export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const { currentSeller, sellerToken, isSellerAuthenticated, logoutSeller } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [addOpen, setAddOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ── Live state connected to database ──
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ gross_sales: 0, net_earnings: 0, platform_fee: 0, total_orders: 0 });
  const [orders, setOrders] = useState([]);

  // Filters
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Stock edit state
  const [editingStockProduct, setEditingStockProduct] = useState(null);
  const [stockInputVal, setStockInputVal] = useState(10);

  // Full product edit state
  const [editingProduct, setEditingProduct] = useState(null);

  // M-Pesa Payout request state
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [lastPayout, setLastPayout] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchSellerData = async () => {
    if (!sellerToken) return;
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/sellers/dashboard'), {
        headers: { 'Authorization': `Bearer ${sellerToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const totals = data.totals || data.data?.totals;
        if (totals) {
          setStats({
            gross_sales: Number(totals.gross_sales) || 0,
            net_earnings: Number(totals.net_earnings) || 0,
            platform_fee: Number(totals.total_commission_paid) || 0,
            total_orders: Number(totals.total_orders) || 0,
          });
        }
        const prodList = data.products || data.data?.products;
        if (Array.isArray(prodList)) {
          setProducts(prodList.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: Number(p.price),
            stock: Number(p.stock) || 0,
            image_url: p.image_url || '',
            description: p.description || '',
            specs: p.specs || '',
            is_active: p.is_active !== 0
          })));
        }
        const orderList = data.orders || data.data?.orders;
        if (Array.isArray(orderList)) {
          setOrders(orderList);
        }
      }
    } catch (e) {
      console.error('Failed to load seller dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSellerAuthenticated) { 
      navigate('/seller/register'); 
    } else {
      fetchSellerData();
    }
  }, [isSellerAuthenticated, sellerToken, navigate]);

  if (!isSellerAuthenticated || !currentSeller) return null;

  const handleAdd = async (product) => {
    setAddOpen(false);
    setEditingProduct(null);
    if (sellerToken) {
      try {
        const res = await fetch(apiUrl('/sellers/products'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`
          },
          body: JSON.stringify({
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            image_url: product.image_url,
            description: product.description || '',
            specs: product.specs || ''
          })
        });
        if (res.ok) {
          const resData = await res.json();
          const savedProd = resData.product || resData.data?.product || product;
          setProducts(p => {
            const exists = p.some(x => x.id === savedProd.id);
            if (exists) {
              return p.map(x => x.id === savedProd.id ? { ...x, ...savedProd } : x);
            }
            return [savedProd, ...p];
          });
          showToast(`"${product.name}" saved live in the marketplace!`);
          fetchSellerData();
        }
      } catch (err) {
        console.error('Failed to persist product:', err);
      }
    }
  };

  const handleRequestPayout = async () => {
    if (!sellerToken) return;
    try {
      setPayoutLoading(true);
      const res = await fetch(apiUrl('/sellers/payout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sellerToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setPayoutRequested(true);
        const payoutInfo = data.data || data;
        setLastPayout(payoutInfo);
        showToast(`M-Pesa B2C Payout initiated! Ref: ${payoutInfo.payout_ref || 'B2C-SENT'}`);
        fetchSellerData();
      } else {
        showToast(data.error || 'Payout request could not be processed.');
      }
    } catch (err) {
      console.error('Failed to request payout:', err);
      showToast('Error requesting M-Pesa disbursement.');
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this hardware listing?')) return;
    setProducts(p => p.filter(x => x.id !== id));
    if (sellerToken) {
      try {
        const res = await fetch(`${apiUrl('/sellers/products')}?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${sellerToken}` }
        });
        if (res.ok) {
          showToast('Product listing removed successfully.');
          fetchSellerData();
        }
      } catch (err) {
        console.error('Failed to delete product from database:', err);
      }
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      const res = await fetch(apiUrl('/sellers/products/stock'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sellerToken}`
        },
        body: JSON.stringify({ product_id: productId, stock: newStock })
      });
      if (res.ok) {
        setProducts(p => p.map(x => x.id === productId ? { ...x, stock: newStock } : x));
        setEditingStockProduct(null);
        showToast('Stock quantity updated successfully.');
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  const exportSalesCSV = () => {
    if (!orders.length) {
      showToast('No sales records to export yet.');
      return;
    }
    const headers = ['Item ID', 'Order ID', 'Product Name', 'Quantity', 'Unit Price (KES)', 'Total Price (KES)', 'Commission Fee (KES)', 'Net Earning (KES)', 'Customer', 'Date'];
    const rows = orders.map(o => [
      `"${o.id}"`,
      `"${o.order_id}"`,
      `"${(o.product_name || '').replace(/"/g, '""')}"`,
      o.quantity,
      o.unit_price,
      o.total_price,
      o.platform_fee,
      o.seller_earning,
      `"${o.customer_name || 'Customer'}"`,
      `"${o.order_created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentSeller.store_name}_Sales_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sales statement downloaded successfully!');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchQuery = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchQuery && matchCat;
    });
  }, [products, productSearch, categoryFilter]);

  const navItems = [
    { id: 'overview',  icon: LayoutDashboard, label: 'Overview' },
    { id: 'products',  icon: Package,          label: 'My Products', badge: products.length || undefined },
    { id: 'revenue',   icon: BarChart3,        label: 'Sales & Revenue' },
  ];
  const complianceItems = [
    { id: 'etims',   icon: QrCode, label: 'KRA eTIMS' },
    { id: 'payouts', icon: Zap,    label: 'M-Pesa Payouts' },
  ];

  const tabLabel = {
    overview: 'Overview', products: 'My Hardware Inventory', revenue: 'Sales & Commission Statements',
    etims: 'KRA eTIMS Tax Compliance', payouts: 'M-Pesa Payout Settlements',
  }[activeTab] || activeTab;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'Inter,system-ui,sans-serif' }}>

      {/* ── Toast ── */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: '#0F172A', color: '#fff', padding: '14px 22px', borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 10, boxShadow: C.shadowMd,
          fontSize: '0.88rem', fontWeight: 600, border: '1px solid #334155'
        }}>
          <CheckCircle2 size={18} color="#22C55E" /> {toastMessage}
        </div>
      )}

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside style={{ width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column', background: C.sidebar, borderRight: `1px solid ${C.border}`, padding: '20px 12px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px', marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0058BC,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,88,188,0.25)' }}>B</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: C.text }}>ByteTech</div>
              <div style={{ fontSize: '0.65rem', color: C.primary, fontWeight: 800, letterSpacing: '0.06em' }}>SELLER HUB</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            <div style={{ fontSize: '0.68rem', color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 6px 8px' }}>Dashboard</div>
            {navItems.map(t => <NavItem key={t.id} {...t} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />)}
            <div style={{ fontSize: '0.68rem', color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 6px 8px' }}>Compliance</div>
            {complianceItems.map(t => <NavItem key={t.id} {...t} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />)}
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 16 }}>
            <div style={{ padding: '8px 6px', marginBottom: 10 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: C.text, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSeller.store_name}</div>
              <span style={{ padding: '2px 8px', borderRadius: 6, background: C.primaryLight, color: C.primary, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${C.primaryMid}` }}>
                {((currentSeller.commission_rate || 0.10) * 100).toFixed(0)}% commission
              </span>
            </div>
            <button onClick={logoutSeller} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, color: C.error, background: C.errorBg, border: '1px solid #FECACA', cursor: 'pointer', transition: 'all 0.15s' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0, paddingBottom: 60 }}>

        {/* Topbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(248,250,252,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: C.textSub, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 6 }}>
              <Menu size={20} />
            </button>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: C.text }}>{tabLabel}</div>
              <div style={{ fontSize: '0.74rem', color: C.textLight }}>{currentSeller.full_name} · {currentSeller.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={fetchSellerData} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, fontSize: '0.8rem', fontWeight: 600, color: C.textSub, cursor: 'pointer' }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {loading ? 'Syncing...' : 'Sync Data'}
            </button>
            <button onClick={() => setAddOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#0058BC,#2563EB)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,88,188,0.25)' }}>
              <Plus size={15} /> List Product
            </button>
          </div>
        </div>

        <div style={{ padding: '26px 28px' }}>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 1: OVERVIEW */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <>
              {/* Welcome banner */}
              <div style={{ background: 'linear-gradient(135deg,#0058BC 0%,#2563EB 100%)', borderRadius: 18, padding: '26px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24, boxShadow: '0 8px 32px rgba(0,88,188,0.2)' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, marginBottom: 10 }}>
                    <ShieldCheck size={12} /> Verified Byte Tech Merchant Partner
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                    Welcome back, {currentSeller.full_name.split(' ')[0]} 👋
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{currentSeller.store_name} · Mombasa Operations Hub</div>
                </div>
                <button onClick={() => setAddOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 12, background: '#fff', color: C.primary, fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                  <Plus size={17} /> List New Hardware
                </button>
              </div>

              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16, marginBottom: 24 }}>
                <MetricCard label="Gross Volume"     value={formatKES(stats.gross_sales)}   sub="Total item sales"           subUp={true}  icon={TrendingUp} accent={C.success} accentBg={C.successBg} />
                <MetricCard label="Net Disbursable"  value={formatKES(stats.net_earnings)}  sub="Payable via M-Pesa"         subUp={true}  icon={DollarSign} accent={C.primary} accentBg={C.primaryLight} />
                <MetricCard label="Platform Fees"    value={formatKES(stats.platform_fee)}  sub="Incl. 16% VAT eTIMS"        subUp={false} icon={Zap}        accent={C.warning} accentBg={C.warningBg} />
                <MetricCard label="Orders Fulfilled" value={stats.total_orders}             sub="ACID confirmed sales"       subUp={true}  icon={Package}    accent="#7C3AED"   accentBg="#F5F3FF" />
              </div>

              {/* Quick links */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14, marginBottom: 28 }}>
                {[
                  { label: 'Manage Inventory', desc: `${products.length} active listings`, icon: Package, tab: 'products', accent: C.primary, accentBg: C.primaryLight },
                  { label: 'Sales Statements', desc: 'Download CSV audit report', icon: BarChart3, tab: 'revenue', accent: '#7C3AED', accentBg: '#F5F3FF' },
                  { label: 'KRA eTIMS Engine', desc: '16% VAT automated invoices', icon: QrCode, tab: 'etims', accent: C.success, accentBg: C.successBg },
                  { label: 'M-Pesa Payouts', desc: 'Disburse earnings instantly', icon: Zap, tab: 'payouts', accent: C.warning, accentBg: C.warningBg },
                ].map(item => (
                  <button key={item.tab} onClick={() => setActiveTab(item.tab)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left', boxShadow: C.shadow, transition: 'all 0.15s' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: item.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <item.icon size={19} color={item.accent} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: C.text, fontSize: '0.9rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.76rem', color: C.textSub, marginTop: 3 }}>{item.desc}</div>
                    </div>
                    <ArrowUpRight size={15} color={C.textLight} />
                  </button>
                ))}
              </div>

              {/* Recent Sales Table */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: C.text }}>Recent Sales for {currentSeller.store_name}</div>
                    <div style={{ fontSize: '0.76rem', color: C.textSub, marginTop: 2 }}>Itemized breakdown of purchased hardware</div>
                  </div>
                  <button onClick={() => setActiveTab('revenue')} style={{ fontSize: '0.82rem', fontWeight: 700, color: C.primary, background: C.primaryLight, border: `1px solid ${C.primaryMid}`, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    View Statements <ArrowUpRight size={13} />
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Order Ref</th>
                        <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Hardware Item</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Qty</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Gross (KES)</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Fee</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Net Earning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <EmptyRow label="No hardware sales recorded yet" cols={6} />
                      ) : (
                        orders.slice(0, 5).map(o => (
                          <tr key={o.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                            <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: C.primary }}>{o.order_id}</td>
                            <td style={{ padding: '14px 18px', fontWeight: 600, color: C.text, fontSize: '0.85rem' }}>{o.product_name}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '0.85rem', color: C.textSub }}>{o.quantity}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: C.text }}>{formatKES(o.total_price)}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '0.85rem', color: C.warning }}>{formatKES(o.platform_fee)}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: C.success }}>{formatKES(o.seller_earning)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 2: MY PRODUCTS */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'products' && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: C.shadow }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ fontWeight: 800, color: C.text, fontSize: '1.1rem' }}>My Hardware Inventory</div>
                  <div style={{ fontSize: '0.76rem', color: C.textSub, marginTop: 2 }}>{filteredProducts.length} items listed under {currentSeller.store_name}</div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
                    <input type="text" placeholder="Search product..." value={productSearch} onChange={e => setProductSearch(e.target.value)}
                      style={{ padding: '7px 12px 7px 32px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: '0.82rem', outline: 'none' }} />
                  </div>

                  {/* Category Filter */}
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                    style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: '0.82rem', color: C.text, outline: 'none' }}>
                    <option value="all">All Categories</option>
                    <option value="Laptops">Laptops</option>
                    <option value="Phones">Phones</option>
                    <option value="Audio">Audio</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Monitors">Monitors</option>
                    <option value="Accessories">Accessories</option>
                  </select>

                  <button onClick={() => setAddOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: C.primary, color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <Plus size={14} /> Add Product
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                      {['Product', 'Category', 'Price (KES)', 'Stock Level', 'Status', 'Actions'].map((h, idx) => (
                        <th key={h} style={{ padding: '12px 18px', textAlign: ['Price (KES)', 'Stock Level'].includes(h) ? 'right' : idx === 5 ? 'right' : 'left', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0
                      ? <EmptyRow label="No products match your filter" cols={6} />
                      : filteredProducts.map((item, i) => (
                          <tr key={item.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                            <td style={{ padding: '15px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {item.image_url
                                  ? <img src={item.image_url} alt={item.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', background: C.bg, border: `1px solid ${C.border}`, flexShrink: 0 }} />
                                  : <div style={{ width: 44, height: 44, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={18} color={C.textLight} /></div>
                                }
                                <div>
                                  <span style={{ fontWeight: 700, color: C.text, fontSize: '0.88rem' }}>{item.name}</span>
                                  <div style={{ fontSize: '0.72rem', color: C.textLight, fontFamily: 'monospace' }}>{item.id}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '15px 18px' }}>
                              <span style={{ padding: '3px 9px', borderRadius: 7, background: '#F5F3FF', color: '#7C3AED', fontSize: '0.73rem', fontWeight: 700, textTransform: 'capitalize' }}>{item.category}</span>
                            </td>
                            <td style={{ padding: '15px 18px', textAlign: 'right', fontWeight: 800, color: C.primary, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{formatKES(item.price)}</td>
                            <td style={{ padding: '15px 18px', textAlign: 'right' }}>
                              <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: '0.73rem', fontWeight: 700, background: item.stock > 0 ? C.successBg : C.errorBg, color: item.stock > 0 ? C.success : C.error, border: `1px solid ${item.stock > 0 ? C.successBorder : '#FECACA'}` }}>
                                {item.stock} in stock
                              </span>
                            </td>
                            <td style={{ padding: '15px 18px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 700, color: C.success }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.success }} /> Active Listing
                              </span>
                            </td>
                            <td style={{ padding: '15px 18px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button onClick={() => setEditingProduct(item)} title="Edit Hardware Listing"
                                  style={{ padding: '6px 10px', borderRadius: 7, background: C.primaryLight, border: `1px solid ${C.primaryMid}`, color: C.primary, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Edit3 size={13} /> Edit
                                </button>
                                <button onClick={() => { setEditingStockProduct(item); setStockInputVal(item.stock); }} title="Quick Stock Adjustment"
                                  style={{ padding: '6px 10px', borderRadius: 7, background: C.bg, border: `1px solid ${C.border}`, color: C.textSub, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                                  Stock
                                </button>
                                <button onClick={() => handleDelete(item.id)} title="Remove Product" style={{ color: C.error, background: C.errorBg, border: '1px solid #FECACA', cursor: 'pointer', padding: '6px 10px', borderRadius: 7 }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 3: SALES & REVENUE */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'revenue' && (
            <div>
              {/* Financial Balance Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16, marginBottom: 26 }}>
                <MetricCard label="Gross Merchandise Value" value={formatKES(stats.gross_sales)} sub="Total customer sales" subUp={true} icon={TrendingUp} accent={C.success} accentBg={C.successBg} />
                <MetricCard label="Net Disbursable Balance" value={formatKES(stats.net_earnings)} sub="After commission deductions" subUp={true} icon={DollarSign} accent={C.primary} accentBg={C.primaryLight} />
                <MetricCard label="Commission Paid" value={formatKES(stats.platform_fee)} sub={`At ${((currentSeller.commission_rate || 0.10) * 100).toFixed(0)}% base rate`} subUp={false} icon={Zap} accent={C.warning} accentBg={C.warningBg} />
                <MetricCard label="Items Sold" value={orders.reduce((acc, o) => acc + (Number(o.quantity) || 1), 0)} sub="Total hardware dispatched" subUp={true} icon={Package} accent="#7C3AED" accentBg="#F5F3FF" />
              </div>

              {/* Order Sales Statement Table */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: C.text }}>Commission & Payout Statement</div>
                    <div style={{ fontSize: '0.76rem', color: C.textSub, marginTop: 2 }}>Itemized accounting log for all hardware orders</div>
                  </div>
                  <button onClick={exportSalesCSV} style={{ padding: '8px 16px', borderRadius: 8, background: C.primary, color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={14} /> Download Statement CSV
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Order Ref</th>
                        <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Item Name</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Unit Price</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Qty</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Gross KES</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Fee</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Net Earning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <EmptyRow label="No sales records available yet" cols={7} />
                      ) : (
                        orders.map(o => (
                          <tr key={o.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                            <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: C.primary }}>{o.order_id}</td>
                            <td style={{ padding: '14px 18px', fontWeight: 600, color: C.text, fontSize: '0.85rem' }}>{o.product_name}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '0.85rem', color: C.textSub }}>{formatKES(o.unit_price)}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '0.85rem', color: C.text }}>{o.quantity}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: C.text }}>{formatKES(o.total_price)}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '0.85rem', color: C.warning }}>{formatKES(o.platform_fee)}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: C.success }}>{formatKES(o.seller_earning)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 4: KRA eTIMS COMPLIANCE */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'etims' && (
            <div style={{ background: C.card, border: `1px solid ${C.successBorder}`, borderRadius: 16, padding: 28, boxShadow: C.shadow }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={22} color={C.success} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: C.success, fontSize: '1.05rem' }}>KRA eTIMS Automated Fiscal Engine</div>
                  <div style={{ fontSize: '0.76rem', color: C.textSub }}>All orders sealed with electronic tax invoices under Rate A (16.0% VAT)</div>
                </div>
                <span style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 999, background: C.successBg, color: C.success, fontSize: '0.73rem', fontWeight: 700, border: `1px solid ${C.successBorder}`, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.success }} /> COMPLIANT
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
                {[
                  { label: 'Taxpayer PIN',         value: 'P051234567Z' },
                  { label: 'Virtual Control Unit', value: 'KRA-VSCU-001' },
                  { label: 'VAT Rate',             value: '16.0% (Rate A)' },
                  { label: 'Fiscal Invoices Issued', value: stats.total_orders },
                  { label: 'Merchant Store',       value: currentSeller.store_name },
                  { label: 'Compliance Status',    value: 'Tax Verified' },
                ].map(f => (
                  <div key={f.label} style={{ background: C.bg, borderRadius: 12, padding: '16px', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: '0.68rem', color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{f.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 800, color: C.text }}>{f.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 22 }}>
                <a href="https://itax.kra.go.ke/KRA-Portal/invoiceChk.htm" target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: C.successBg, border: `1px solid ${C.successBorder}`, color: C.success, fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                  Open KRA iTax Confirmation Portal <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 5: M-PESA PAYOUTS */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'payouts' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Account Card */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: C.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: C.warningBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={22} color={C.warning} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: C.text, fontSize: '1.05rem' }}>M-Pesa B2C Merchant Payouts</div>
                    <div style={{ fontSize: '0.75rem', color: C.textSub }}>Automated disbursements directly to your phone</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: C.bg }}>
                    <span style={{ fontSize: '0.85rem', color: C.textSub }}>Registered Store</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.text }}>{currentSeller.store_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: C.bg }}>
                    <span style={{ fontSize: '0.85rem', color: C.textSub }}>M-Pesa Phone</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.text }}>{currentSeller.phone || '2547XXXXXXXX'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: C.bg }}>
                    <span style={{ fontSize: '0.85rem', color: C.textSub }}>Disbursable Balance</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: C.success }}>{formatKES(stats.net_earnings)}</span>
                  </div>
                </div>

                <button onClick={handleRequestPayout}
                  disabled={payoutLoading || payoutRequested || stats.net_earnings <= 0}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 12, fontWeight: 800, fontSize: '0.9rem',
                    background: stats.net_earnings > 0 ? 'linear-gradient(135deg,#16A34A,#22C55E)' : C.bg,
                    color: stats.net_earnings > 0 ? '#fff' : C.textLight,
                    border: 'none', cursor: (stats.net_earnings > 0 && !payoutLoading) ? 'pointer' : 'not-allowed',
                    boxShadow: stats.net_earnings > 0 ? '0 4px 14px rgba(22,163,74,0.3)' : 'none'
                  }}>
                  {payoutLoading ? 'Initiating Disbursal...' : payoutRequested ? '✓ Disbursement Processing' : `Disburse ${formatKES(stats.net_earnings)} to M-Pesa`}
                </button>

                {lastPayout && (
                  <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: C.successBg, border: `1px solid ${C.successBorder}`, fontSize: '0.8rem', color: C.success }}>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>✓ M-Pesa B2C Transfer Sent!</div>
                    <div>Ref: <strong>{lastPayout.payout_ref}</strong></div>
                    <div>Sent to: <strong>{lastPayout.recipient}</strong></div>
                    <div style={{ fontSize: '0.72rem', color: C.textSub, marginTop: 4 }}>Time: {new Date(lastPayout.completed_at || Date.now()).toLocaleTimeString()}</div>
                  </div>
                )}
              </div>

              {/* Settlement Schedule Info */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: C.text, marginBottom: 4 }}>Payout Terms & Security</div>
                  <div style={{ fontSize: '0.78rem', color: C.textSub, marginBottom: 18 }}>IntaSend Instant B2C Payment Gateway with automated reconciliation.</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem', color: C.textSub }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} color={C.success} /> <strong>Instant STK & B2C:</strong> Funds delivered within 60 seconds of order completion.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} color={C.success} /> <strong>Zero Hidden Fees:</strong> Platform fees ({((currentSeller.commission_rate || 0.10) * 100).toFixed(0)}%) are transparently deducted per line item.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} color={C.success} /> <strong>KRA Compliant:</strong> Digital tax seal attached to each transaction.
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24, padding: 14, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, fontSize: '0.78rem', color: C.textLight }}>
                  Need to change your M-Pesa phone number? Contact Byte Tech Operations Support: support@bytetech.ke
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Modal: Add / Edit Product ── */}
      {(addOpen || editingProduct) && (
        <AddProductModal
          initialProduct={editingProduct}
          onClose={() => { setAddOpen(false); setEditingProduct(null); }}
          onAdd={handleAdd}
        />
      )}

      {/* ── Modal: Adjust Stock ── */}
      {editingStockProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', boxShadow: C.shadowMd }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.text }}>Update Stock Level</h3>
              <button onClick={() => setEditingStockProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSub }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '0.82rem', color: C.textSub, marginBottom: 18 }}>
              Adjust available inventory units for <strong>{editingStockProduct.name}</strong>.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: C.textSub, textTransform: 'uppercase', marginBottom: 6 }}>Units in Stock</label>
              <input type="number" min="0" max="10000" value={stockInputVal} onChange={e => setStockInputVal(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: '1.1rem', fontWeight: 800, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditingStockProduct(null)} style={{ flex: 1, padding: '12px', borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleUpdateStock(editingStockProduct.id, Number(stockInputVal))}
                style={{ flex: 1, padding: '12px', borderRadius: 10, background: C.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Save Stock</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
