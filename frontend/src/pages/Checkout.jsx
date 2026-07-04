
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services';
import toast from 'react-hot-toast';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const PAYMENT_METHODS = [
  { value: 'COD',  label: 'Cash on Delivery', icon: '💵' },
  { value: 'UPI',  label: 'UPI Payment',       icon: '📱' },
  { value: 'CARD', label: 'Credit / Debit Card',icon: '💳' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();

  const items    = cart?.items || [];
  const subtotal = cart?.totalPrice ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const tax      = Number((subtotal * 0.18).toFixed(2));
  const total    = Number((subtotal + shipping + tax).toFixed(2));

  const [address, setAddress] = useState({
    fullName:   user?.name || '',
    phone:      user?.phone || '',
    street:     user?.address?.street || '',
    city:       user?.address?.city || '',
    state:      user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country:    user?.address?.country || 'India',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [errors, setErrors]   = useState({});
  const [placing, setPlacing] = useState(false);

  const validate = () => {
    const e = {};
    if (!address.fullName.trim())   e.fullName   = 'Full name is required';
    if (!address.phone.trim())      e.phone      = 'Phone number is required';
    if (!address.street.trim())     e.street     = 'Street address is required';
    if (!address.city.trim())       e.city       = 'City is required';
    if (!address.state.trim())      e.state      = 'State is required';
    if (!address.postalCode.trim()) e.postalCode = 'Postal code is required';
    if (!address.country.trim())    e.country    = 'Country is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setAddress((a) => ({ ...a, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handlePlaceOrder = async () => {
    if (!validate()) { toast.error('Please fill in all required fields'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    setPlacing(true);
    try {
      const { data } = await orderService.placeOrder({
        shippingAddress: address,
        paymentMethod,
      });
      await clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/orders/${data.order._id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-custom py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h2>
        <Link to="/products" className="btn-primary btn-lg">Shop Now</Link>
      </div>
    );
  }

  const Field = ({ label, field, type = 'text', placeholder, half }) => (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="label">{label}</label>
      <input
        type={type}
        value={address[field]}
        onChange={handleChange(field)}
        placeholder={placeholder}
        className={`input ${errors[field] ? 'input-error' : ''}`}
      />
      {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="container-custom py-10 animate-fade-in">
      <h1 className="page-title mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Address + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="card p-6">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <span className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Shipping Address
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name *"     field="fullName"   placeholder="John Doe" />
              <Field label="Phone Number *"  field="phone"      placeholder="+91 98765 43210" type="tel" />
              <Field label="Street Address *" field="street"   placeholder="123, MG Road, Apartment 4B" />
              <Field label="City *"          field="city"       placeholder="Mumbai" half />
              <Field label="State *"         field="state"      placeholder="Maharashtra" half />
              <Field label="Postal Code *"   field="postalCode" placeholder="400001" half />
              <Field label="Country *"       field="country"    placeholder="India" half />
            </div>
          </div>

          {/* Payment Method */}
          <div className="card p-6">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <span className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Payment Method
            </h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((pm) => (
                <label
                  key={pm.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    paymentMethod === pm.value
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={pm.value}
                    checked={paymentMethod === pm.value}
                    onChange={() => setPaymentMethod(pm.value)}
                    className="text-primary-600"
                  />
                  <span className="text-xl">{pm.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{pm.label}</span>
                  {pm.value === 'COD' && (
                    <span className="ml-auto badge badge-green">Recommended</span>
                  )}
                </label>
              ))}
            </div>
            {paymentMethod !== 'COD' && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                ⚠️ This is a demo project. No actual payment will be charged. Order will be marked as paid automatically.
              </p>
            )}
          </div>
        </div>

        {/* Right: Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-5 max-h-52 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product} className="flex gap-3">
                  <img src={item.image} alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/48.png?text=CC'; }}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white flex-shrink-0">{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : fmt(shipping)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>GST (18%)</span><span>{fmt(tax)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
                <span>Total</span><span className="text-lg">{fmt(total)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="btn-accent w-full btn-lg mt-5"
            >
              {placing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Placing Order…
                </span>
              ) : `Place Order — ${fmt(total)}`}
            </button>

            <p className="text-xs text-center text-gray-400 mt-3">
              🔒 Your payment info is encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
