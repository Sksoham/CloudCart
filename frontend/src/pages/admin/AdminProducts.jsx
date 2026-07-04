
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');
  const [deleting, setDeleting] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.keyword = search;
      const { data } = await productService.getProducts(params);
      setProducts(data.products);
      setPages(data.pages);
      setTotal(data.total);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await productService.deleteProduct(id);
      toast.success('Product deleted successfully');
      setConfirmId(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    } finally { setDeleting(null); }
  };

  return (
    <div className="container-custom py-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total products</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">+ Add New Product</Link>
      </div>

      <div className="mb-6">
        <input type="text" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..." className="input max-w-sm"/>
      </div>

      {loading ? <Loader /> : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-500 mb-4">No products found.</p>
          <Link to="/admin/products/new" className="btn-primary">Add First Product</Link>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    {['Product','Category','Price','Stock','Status','Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/40.png?text=CC'; }}/>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white line-clamp-1 text-xs">{p.title}</p>
                            <p className="text-xs text-gray-400 font-mono">{p._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3"><span className="badge badge-blue">{p.category}</span></td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-900 dark:text-white">{fmt(p.discountPrice || p.price)}</p>
                        {p.discountPrice && <p className="text-xs text-gray-400 line-through">{fmt(p.price)}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold text-sm ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-green-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`badge ${p.isActive ? 'badge-green' : 'badge-gray'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/admin/products/${p._id}/edit`} className="btn-secondary btn-sm text-xs">Edit</Link>
                          {confirmId === p._id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(p._id)} disabled={deleting === p._id} className="btn-danger btn-sm text-xs">
                                {deleting === p._id ? '...' : 'Confirm'}
                              </button>
                              <button onClick={() => setConfirmId(null)} className="btn-ghost btn-sm text-xs">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmId(p._id)} className="btn-danger btn-sm text-xs">Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
