import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { Package } from 'lucide-react'
import OrderTracker from '@/components/order/OrderTracker'
import { formatTZS, formatDate, DELIVERY_ZONES, PAYMENT_METHODS } from '@/utils'
import { OrderStatusBadge } from '@/components/ui/Badge'
import LText from '@/components/shared/LText'
import { PageHeader } from '@/components/shared/PageHeader'
import PayNowButton from '@/components/order/PayNowButton'
import DeliveryRatingSection from '@/components/delivery/DeliveryRatingSection'
import OrderReviewSection from '@/components/reviews/OrderReviewSection'
import OrderLiveMapSection from '@/components/delivery/OrderLiveMapSection'
import { WhatsAppTrackingButton } from '@/components/order/WhatsAppTrackingButton'

export default async function OrderPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*, product:products(*, images:product_images(*)), seller:sellers(store_name)),
      tracking:order_tracking(* order: created_at asc)
    `)
    .eq('id', params.id)
    .eq('buyer_id', user.id)
    .single() as { data: any }

  if (!order) notFound()

  const zone = DELIVERY_ZONES[order.delivery_zone as keyof typeof DELIVERY_ZONES]
  const payment = PAYMENT_METHODS.find((p) => p.id === order.payment_method)

  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-4 sm:py-8 max-w-2xl">
        <PageHeader
          title={<><LText k="orderNumber" /> #{order.id.slice(-8).toUpperCase()}</>}
          subtitle={<><LText k="orderDate" /> {formatDate(order.created_at)}</>}
          backHref="/orders"
          backLabel={<LText k="orders" />}
          actions={<OrderStatusBadge status={order.status} />}
          className="mb-6"
        />

        {/* Tracker */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <h2 className="font-semibold text-sm text-foreground mb-4"><LText k="orderStatus" /></h2>
          <OrderTracker currentStatus={order.status} tracking={order.tracking} />
        </div>

        {/* Items */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <h2 className="font-semibold text-sm text-foreground mb-4"><LText k="items" /> ({order.items?.length})</h2>
          <div className="space-y-4 divide-y divide-border">
            {order.items?.map((item: any) => {
              const img = item.product?.images?.find((i: any) => i.is_primary) ?? item.product?.images?.[0]
              return (
                <div key={item.id} className="flex gap-3 pt-4 first:pt-0">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {img ? <Image src={img.url} alt={item.product?.name ?? ''} fill sizes="56px" className="object-cover" /> : <Package className="absolute inset-0 m-auto w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{item.product?.name}</p>
                    <p className="text-xs text-muted-foreground"><LText k="quantity" />: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm text-foreground">{formatTZS(item.total_price)}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <h2 className="font-semibold text-sm text-foreground mb-3"><LText k="orderSummary" /></h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground"><span><LText k="items" /></span><span>{formatTZS(order.subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span><LText k="shipping" /></span><span>{formatTZS(order.delivery_fee)}</span></div>
            <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border">
              <span><LText k="total" /></span><span>{formatTZS(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Delivery & payment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2"><LText k="delivery" /></h2>
            <p className="font-semibold text-sm text-foreground">{order.delivery_name}</p>
            <p className="text-xs text-muted-foreground">{order.delivery_phone}</p>
            <p className="text-xs text-muted-foreground mt-1">{zone?.nameSw}</p>
            <p className="text-xs text-muted-foreground">{order.delivery_address}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2"><LText k="payment" /></h2>
            <p className="font-semibold text-sm text-foreground">{payment?.label ?? order.payment_method}</p>
            {order.payment_reference && <p className="text-xs text-muted-foreground mt-1">Ref: {order.payment_reference}</p>}
            <span className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${order.payment_confirmed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
              <LText k={order.payment_confirmed ? 'confirmed' : 'pending'} />
            </span>
            {!order.payment_confirmed && order.payment_method !== 'cod' && (
              <div>
                <PayNowButton orderId={order.id} />
              </div>
            )}
          </div>
        </div>

        {order.status === 'out_for_delivery' && (
          <OrderLiveMapSection orderId={order.id} />
        )}

        {/* WhatsApp tracking - large touch target for outdoor use */}
        <div className="mt-4">
          <WhatsAppTrackingButton orderId={order.id} phone={order.delivery_phone} total={order.total_amount} variant="customer" />
          <p className="text-xs text-center text-muted-foreground mt-2">
            <LText k="whatsappTrackingHint" /> {/* fallback if key missing */}
            {order.delivery_phone ? '' : ''}
            Pata taarifa kwa WhatsApp — share tracking na familia
          </p>
        </div>

        {order.status === 'delivered' && (
          <div className="mt-4">
            <DeliveryRatingSection orderId={order.id} reviewerId={order.buyer_id} reviewerRole="buyer" />
          </div>
        )}

        {order.status === 'delivered' && (
          <OrderReviewSection
            orderId={order.id}
            buyerId={order.buyer_id}
            items={(order.items ?? []).map((item: any) => ({
              product_id: item.product_id,
              product_name: item.product?.name ?? '',
              seller_id: item.seller_id,
              seller_name: item.seller?.store_name ?? '',
            }))}
          />
        )}
      </div>
    </main>
  )
}
