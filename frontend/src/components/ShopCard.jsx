import { Link } from 'react-router-dom';

export default function ShopCard({ shop, compact = false }) {
  const address = `${shop.address}, ${shop.area}, ${shop.city}`;
  return <div className="card shop-card p-5 space-y-3">
    <div className="shop-awning" aria-hidden="true" /><div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-lg shrink-0">{shop.name?.charAt(0)}</div>
      <div><Link className="font-bold hover:text-primary-600" to={`/shops/${shop._id}`}>{shop.name}</Link><p className="text-sm text-gray-500">{shop.area} · {shop.city}</p></div>
      {shop.isDemo && <span className="badge-gray ml-auto">Demo</span>}
    </div>
    {!compact && <p className="text-sm text-gray-500 leading-relaxed">{shop.description}</p>}
    <p className="text-sm">{address}</p>
    <p className="text-sm text-gray-500">Pickup hours: {shop.hours}</p>
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to={`/products?shop=${shop._id}`} className="text-primary-600 font-semibold">Browse products →</Link>
      {!shop.isDemo && <a className="text-primary-600" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">Directions ↗</a>}
    </div>
    {shop.isDemo && !compact && <p className="text-xs text-gray-500">Sample shop for the project demo. Not a real pickup location.</p>}
  </div>;
}
