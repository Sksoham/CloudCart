
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics','Fashion','Home & Kitchen','Books','Beauty & Personal Care','Sports & Outdoors','Toys & Games','Grocery','Other'];
const EMPTY = { title:'', description:'', image:'', category:'', brand:'', price:'', discountPrice:'', stock:'', sku:'', isActive:true };

export default function AdminProductForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    productService.getProductById(id)
      .then(({ data }) => {
        const p = data.product;
        setForm({ title:p.title, description:p.description, image:p.image, category:p.category,
          brand:p.brand||'', price:p.price, discountPrice:p.discountPrice||'', stock:p.stock, sku:p.sku||'', isActive:p.isActive });
        setPreview(p.image);
      })
      .catch(() => { toast.error('Product not found'); navigate('/admin/products'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.image.trim())       e.image       = 'Image URL is required';
    if (!form.category)           e.category    = 'Category is required';
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0) e.price = 'Valid price required';
    if (form.discountPrice !== '' && Number(form.discountPrice) >= Number(form.price)) e.discountPrice = 'Discount must be less than price';
    if (form.stock === '' || isNaN(Number(form.stock)) || Number(form.stock) < 0) e.stock = 'Valid stock required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    if (field === 'image') setPreview(val);
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the validation errors'); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock),
        discountPrice: form.discountPrice !== '' ? Number(form.discountPrice) : undefined };
      if (isEdit) { await productService.updateProduct(id, payload); toast.success('Product updated!'); }
      else        { await productService.createProduct(payload);     toast.success('Product created!'); }
      navigate('/admin/products');
    } catch (err) { toast.error(err.message || 'Failed to save product'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="container-custom py-20 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"/></div>;

  const Field = ({ label, field, type='text', placeholder, required, half }) => (
    <div className={half ? '' : 'col-span-2'}>
      <label className="label">{label}{required && ' *'}</label>
      <input type={type} value={form[field]} onChange={handleChange(field)} placeholder={placeholder}
        className={`input ${errors[field] ? 'input-error' : ''}`} step={type==='number'?'any':undefined} min={type==='number'?'0':undefined}/>
      {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="container-custom py-10 max-w-4xl animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin/products" className="btn-ghost p-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </Link>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isEdit ? 'Update product details below' : 'Fill in the details to list a new product'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Product Title" field="title" placeholder="e.g. Apple iPhone 15 Pro" required />
                <div className="col-span-2">
                  <label className="label">Description *</label>
                  <textarea rows={4} value={form.description} onChange={handleChange('description')}
                    placeholder="Describe the product..." className={`input resize-none ${errors.description?'input-error':''}`} maxLength={2000}/>
                  <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/2000</p>
                  {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select value={form.category} onChange={handleChange('category')} className={`input ${errors.category?'input-error':''}`}>
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                </div>
                <Field label="Brand" field="brand" placeholder="e.g. Apple" half />
                <Field label="SKU" field="sku" placeholder="e.g. APPL-IP15P" half />
              </div>
            </div>
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Pricing & Inventory</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Original Price (INR)" field="price" type="number" placeholder="0" required half />
                <Field label="Discount Price (INR)" field="discountPrice" type="number" placeholder="Optional" half />
                <Field label="Stock Quantity" field="stock" type="number" placeholder="0" required half />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Product Image</h2>
              <div>
                <label className="label">Image URL *</label>
                <input type="url" value={form.image} onChange={handleChange('image')}
                  placeholder="https://example.com/image.jpg" className={`input ${errors.image?'input-error':''}`}/>
                {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
                <p className="text-xs text-gray-400 mt-1">Paste a public image URL</p>
              </div>
              {preview && (
                <div className="mt-4 aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300.png?text=Invalid+URL'; }}/>
                </div>
              )}
            </div>
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Status</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={form.isActive} onChange={handleChange('isActive')} className="sr-only"/>
                  <div className={`w-11 h-6 rounded-full transition-colors ${form.isActive?'bg-primary-600':'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 mx-0.5 ${form.isActive?'translate-x-5':'translate-x-0'}`}/>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {form.isActive ? 'Active (visible to customers)' : 'Inactive (hidden)'}
                </span>
              </label>
            </div>
            <div className="flex flex-col gap-3">
              <button type="submit" disabled={saving} className="btn-primary btn-lg w-full">
                {saving ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{isEdit?'Updating…':'Creating…'}</span>
                  : isEdit ? 'Update Product' : 'Create Product'}
              </button>
              <Link to="/admin/products" className="btn-secondary w-full text-center">Cancel</Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
