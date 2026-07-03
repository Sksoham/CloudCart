// src/pages/admin/AdminUsers.jsx
import { useState, useEffect, useCallback } from 'react';
import { userService } from '../../services';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updating, setUpdating] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const { data } = await userService.getAllUsers(params);
      setUsers(data.users); setPages(data.pages); setTotal(data.total);
    } catch { setUsers([]); } finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleRoleToggle = async (user) => {
    setUpdating(user._id);
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await userService.updateUser(user._id, { role: newRole });
      toast.success(`${user.name} is now ${newRole}`);
      load();
    } catch (err) { toast.error(err.message || 'Failed to update role'); }
    finally { setUpdating(null); }
  };

  const handleToggleActive = async (user) => {
    setUpdating(user._id);
    try {
      await userService.updateUser(user._id, { isActive: !user.isActive });
      toast.success(`Account ${user.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) { toast.error(err.message || 'Failed to update status'); }
    finally { setUpdating(null); }
  };

  const handleDelete = async (id) => {
    try {
      await userService.deleteUser(id);
      toast.success('User deleted');
      setConfirmDel(null);
      load();
    } catch (err) { toast.error(err.message || 'Failed to delete user'); }
  };

  return (
    <div className="container-custom py-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="text-sm text-gray-500 mt-1">{total} registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email..." className="input max-w-sm"/>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">All Roles</option>
          <option value="user">Customers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {loading ? <Loader /> : users.length === 0 ? (
        <div className="text-center py-20"><div className="text-5xl mb-4">👥</div><p className="text-gray-500">No users found.</p></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    {['User','Email','Role','Status','Joined','Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white text-xs">{user.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{user.email}</td>
                      <td className="px-5 py-3">
                        <span className={`badge ${user.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
                          {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-5 py-3">
                        {updating === user._id ? (
                          <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"/>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            <button onClick={() => handleRoleToggle(user)}
                              className="btn-secondary btn-sm text-xs">
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            <button onClick={() => handleToggleActive(user)}
                              className={`btn-sm text-xs ${user.isActive ? 'btn-danger' : 'btn bg-green-600 text-white hover:bg-green-700'}`}>
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            {confirmDel === user._id ? (
                              <>
                                <button onClick={() => handleDelete(user._id)} className="btn-danger btn-sm text-xs">Confirm</button>
                                <button onClick={() => setConfirmDel(null)} className="btn-ghost btn-sm text-xs">Cancel</button>
                              </>
                            ) : (
                              <button onClick={() => setConfirmDel(user._id)} className="btn-danger btn-sm text-xs">Delete</button>
                            )}
                          </div>
                        )}
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
