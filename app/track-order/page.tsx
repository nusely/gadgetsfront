'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { buildApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';

interface TrackedOrderItem {
  id?: string;
  product_name?: string;
  quantity: number;
  unit_price?: number;
  subtotal?: number;
}

interface TrackedOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  delivery_fee?: number;
  total: number;
  created_at: string;
  order_items?: TrackedOrderItem[];
  delivery_address?: Record<string, any> | null;
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const paymentLabels: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

const statusBadgeStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(() => {
    return (
      searchParams.get('order') ||
      searchParams.get('order_number') ||
      ''
    );
  });
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedOrder = orderNumber.trim();
    const trimmedEmail = email.trim();

    if (!trimmedOrder || !trimmedEmail) {
      toast.error('Enter both order number and email to track your order.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await fetch(buildApiUrl('/api/orders/track'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_number: trimmedOrder,
          email: trimmedEmail,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        const message = result?.message || 'Unable to find an order with those details.';
        setError(message);
        toast.error(message);
        return;
      }

      setOrder(result.data as TrackedOrder);
    } catch (err) {
      console.error('Error tracking order:', err);
      const message = err instanceof Error ? err.message : 'Failed to track order. Please try again later.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAddress = (address?: Record<string, any> | null) => {
    if (!address) return 'No delivery address on file.';

    const parts = [
      address.full_name,
      address.street_address,
      address.city,
      address.region,
      address.country,
    ]
      .filter((part) => part && String(part).trim().length > 0)
      .map((part) => String(part).trim());

    return parts.length > 0 ? parts.join(', ') : 'No delivery address on file.';
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-2xl p-6 sm:p-10 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-4 text-center">
            Track Your Order
          </h1>
          <p className="text-sm sm:text-base text-[#3A3A3A] text-center mb-6">
            Enter your order number and the email used during checkout to see the latest status.
          </p>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Order Number</label>
              <Input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ORD-001031125"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="sm:col-span-2 flex justify-center">
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? 'Checking…' : 'Track Order'}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>

        {order && (() => {
          const statusLabel = statusLabels[order.status] || order.status;
          const paymentLabel =
            paymentLabels[order.payment_status] || order.payment_status;

          return (
            <div className="bg-white shadow-md rounded-2xl p-6 sm:p-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">
                    Order #{order.order_number}
                  </h2>
                  <p className="text-sm text-[#3A3A3A]">
                    Placed on {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm sm:text-base font-semibold ${
                      statusBadgeStyles[order.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusLabel}
                  </span>
                  <span className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-gray-100 text-gray-800">
                    {paymentLabel}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">Delivery Details</h3>
                <p className="text-sm text-[#3A3A3A] whitespace-pre-line">
                  {renderAddress(order.delivery_address)}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">Items in this Order</h3>
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-[#3A3A3A]">Product</th>
                        <th className="px-4 py-3 text-left font-medium text-[#3A3A3A]">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {(order.order_items || []).map((item) => (
                        <tr key={item.id || `${item.product_name}-${item.quantity}`}>
                          <td className="px-4 py-3 text-[#1A1A1A] font-medium">
                            {item.product_name || 'Product'}
                          </td>
                          <td className="px-4 py-3 text-[#3A3A3A]">{item.quantity}</td>
                        </tr>
                      ))}
                      {(!order.order_items || order.order_items.length === 0) && (
                        <tr>
                          <td className="px-4 py-4 text-center text-[#3A3A3A]" colSpan={2}>
                            No order items found for this order.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

