-- 023: fix create_order's item parsing
--
-- create_order declares "item jsonb" and loops
--   for item in select value from jsonb_array_elements(p_items)
-- With a scalar loop target, `item` holds the jsonb element itself, so the
-- body has to read item->>'product_id'. The function instead wrote
-- item.value->>'product_id', which PostgreSQL parses as a column reference on
-- a table alias named "item" and fails with:
--   ERROR: missing FROM-clause entry for table "item" (42P01)
-- Every order attempt therefore failed and no order was ever created.

create or replace function public.create_order(
  p_buyer_id uuid,
  p_items jsonb,
  p_delivery_zone text,
  p_delivery_address text,
  p_delivery_name text,
  p_delivery_phone text,
  p_payment_method text,
  p_payment_reference text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_order_id uuid;
  v_delivery_fee integer;
  v_subtotal integer := 0;
  v_commission_amount integer;
  v_total_amount integer;
  v_price integer;
  v_stock integer;
  v_status product_status;
  v_seller_id uuid;
  v_product_id uuid;
  v_quantity integer;
  v_already_ordered integer;
  item jsonb;
  line record;
  seller_row record;
  v_seller_user_id uuid;
begin
  -- ATOMICITY: the entire function body runs inside a single implicit
  -- transaction. If ANY step raises an exception, every insert/update (orders,
  -- order_items, stock decrements, order_tracking, commissions, notifications)
  -- is rolled back automatically - nothing is left half-applied.

  -- The buyer id must always be the calling user; guards against direct RPC
  -- misuse placing orders on another user's behalf.
  if p_buyer_id is distinct from auth.uid() then
    raise exception 'Unauthorized';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  -- Delivery fee is looked up server-side from delivery_zones (never trusted
  -- from the client).
  select fee into v_delivery_fee
  from delivery_zones
  where zone = p_delivery_zone::delivery_zone;

  if v_delivery_fee is null then
    raise exception 'Invalid delivery zone: %', p_delivery_zone;
  end if;

  -- Session-local scratch table (auto-dropped at transaction end) carrying the
  -- server-fetched price/seller so each product row is read exactly once.
  create temp table tmp_order_items (
    product_id uuid not null,
    seller_id  uuid not null,
    price      integer not null,
    quantity   integer not null
  ) on commit drop;

  -- Pass 1: lock every product row FOR UPDATE and validate status + stock.
  -- Row locks are held until commit, so two concurrent buyers both locking the
  -- same last item are serialized - the second sees the already-decremented
  -- stock (TOCTOU-safe). Quantity is validated cumulatively so duplicate line
  -- items for one product cannot oversell within a single order either.
  for item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (item->>'product_id')::uuid;
    v_quantity   := (item->>'quantity')::integer;

    if v_quantity <= 0 then
      raise exception 'Invalid quantity for product %', item->>'product_id';
    end if;

    select price, stock_quantity, status, seller_id
      into v_price, v_stock, v_status, v_seller_id
    from products
    where id = v_product_id
    for update;

    if not found or v_status <> 'active' then
      raise exception 'Product unavailable: %', item->>'product_id';
    end if;

    select coalesce(sum(quantity), 0) into v_already_ordered
    from tmp_order_items
    where product_id = v_product_id;

    if v_stock < v_quantity + v_already_ordered then
      raise exception 'Insufficient stock: %', item->>'product_id';
    end if;

    insert into tmp_order_items (product_id, seller_id, price, quantity)
    values (v_product_id, v_seller_id, v_price, v_quantity);

    v_subtotal := v_subtotal + v_price * v_quantity;
  end loop;

  v_commission_amount := round(v_subtotal * 0.05)::integer;
  v_total_amount      := v_subtotal + v_delivery_fee;

  insert into orders (
    buyer_id, status, subtotal, delivery_fee, commission_amount, total_amount,
    delivery_zone, delivery_address, delivery_name, delivery_phone,
    payment_method, payment_reference, notes
  ) values (
    p_buyer_id, 'pending', v_subtotal, v_delivery_fee, v_commission_amount, v_total_amount,
    p_delivery_zone::delivery_zone, p_delivery_address, p_delivery_name, p_delivery_phone,
    p_payment_method, p_payment_reference, p_notes
  )
  returning id into v_order_id;

  -- Pass 2: order items + stock decrement (product rows are still locked).
  for line in select product_id, seller_id, price, quantity from tmp_order_items
  loop
    insert into order_items (order_id, product_id, seller_id, quantity, unit_price, total_price)
    values (v_order_id, line.product_id, line.seller_id, line.quantity, line.price, line.price * line.quantity);

    update products
    set stock_quantity = stock_quantity - line.quantity,
        total_sold     = total_sold + line.quantity,
        status         = case when stock_quantity - line.quantity <= 0
                              then 'out_of_stock'::product_status
                              else status end
    where id = line.product_id;
  end loop;

  -- Initial tracking event
  insert into order_tracking (order_id, status, note, created_by)
  values (v_order_id, 'pending', 'Order received', p_buyer_id);

  -- Commission + seller notification per distinct seller in the order
  for seller_row in
    select seller_id, sum(price * quantity) as amount
    from tmp_order_items
    group by seller_id
  loop
    insert into commissions (order_id, seller_id, order_amount, commission_rate, commission_amount)
    values (v_order_id, seller_row.seller_id, seller_row.amount, 5, round(seller_row.amount * 0.05)::integer);

    select user_id into v_seller_user_id
    from sellers
    where id = seller_row.seller_id;

    if v_seller_user_id is not null then
      insert into notifications (user_id, type, title_en, title_sw, body_en, body_sw, link)
      values (
        v_seller_user_id,
        'order_placed',
        'New order received',
        'Agizo jipya limepokelewa',
        'You have a new order worth ' || seller_row.amount || ' TZS.',
        'Una agizo jipya la TZS ' || seller_row.amount || '.',
        '/seller/orders'
      );
    end if;
  end loop;

  return (select row_to_json(o)::jsonb from orders o where o.id = v_order_id);
end;
$function$;

grant execute on function public.create_order(uuid, jsonb, text, text, text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';

