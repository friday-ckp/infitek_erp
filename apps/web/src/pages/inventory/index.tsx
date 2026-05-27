import { Navigate } from 'react-router-dom';

export default function InventoryIndexPage() {
  return <Navigate to="/inventory/available" replace />;
}
