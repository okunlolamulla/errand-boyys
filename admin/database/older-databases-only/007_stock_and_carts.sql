-- 007: stock management and customer carts (safe to run more than once)
--   * product_categories / products   what the shop sells. Add, edit, remove and mark out of stock from the admin dashboard.
--   * order_items                     the items inside every shop order (price copied from the shop at the time)
--   * carts                           what customers currently have in their carts, so the admin can see it
--   * place_order_items()             checks stock, saves the items and takes them off the stock in one step
-- New installs get all of this from supabase-setup.sql already; run this file only on a database that was set up before.

create table if not exists public.product_categories (
  id          text primary key,                       -- e.g. 'alcohols'
  name        text not null,
  emoji       text,
  tint        text default '#eef0f6',
  age18       boolean not null default false,         -- asks buyers to confirm they are 18 or older
  img         text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.products (
  id          text primary key,                       -- e.g. 'alcohols-1'
  category_id text not null references public.product_categories(id) on update cascade on delete restrict,
  name        text not null,
  size        text,
  price       numeric(12,2) not null check (price >= 0),
  was_price   numeric(12,2) check (was_price is null or was_price >= 0),   -- old price: shows as a Sale
  featured    boolean not null default false,
  is_new      boolean not null default false,
  img         text,                                   -- /assets/products/x.jpg on the website, or a full address
  in_stock    boolean not null default true,
  stock_qty   int check (stock_qty is null or stock_qty >= 0),  -- null = quantity not tracked
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);

create table if not exists public.order_items (
  id          bigint generated always as identity primary key,
  errand_id   text not null references public.errand_requests(errand_id) on delete cascade,
  product_id  text references public.products(id) on delete set null,
  name        text not null,
  size        text,
  unit_price  numeric(12,2) not null,
  qty         int not null check (qty > 0),
  created_at  timestamptz not null default now()
);
create index if not exists order_items_errand_idx on public.order_items (errand_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

create table if not exists public.carts (
  id             uuid primary key,                    -- made by the customer's browser
  items          jsonb not null default '[]'::jsonb,  -- [{id, name, size, price, qty}]
  item_count     int not null default 0,
  total          numeric(12,2) not null default 0,
  status         text not null default 'open' check (status in ('open', 'ordered')),
  errand_id      text references public.errand_requests(errand_id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists carts_status_idx on public.carts (status, updated_at desc);

alter table public.product_categories enable row level security;
alter table public.products           enable row level security;
alter table public.order_items        enable row level security;
alter table public.carts              enable row level security;

drop trigger if exists product_categories_updated on public.product_categories;
create trigger product_categories_updated before update on public.product_categories for each row execute function public.set_updated_at();
drop trigger if exists products_updated on public.products;
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists carts_updated on public.carts;
create trigger carts_updated before update on public.carts for each row execute function public.set_updated_at();

-- Public folder for product pictures uploaded from the admin dashboard.
insert into storage.buckets (id, name, public) values ('shop', 'shop', true) on conflict (id) do nothing;

-- Saves the items of a shop order and takes them off the stock, in one step.
-- p_items: [{"id": "<product id>", "qty": 2}, ...]. Raises 'OUT_OF_STOCK: <name>' or 'UNKNOWN_PRODUCT' if it cannot.
create or replace function public.place_order_items(p_errand_id text, p_items jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare it jsonb; pr public.products; q int;
begin
  for it in select * from jsonb_array_elements(p_items) loop
    q := (it->>'qty')::int;
    if q is null or q < 1 or q > 99 then raise exception 'BAD_QUANTITY'; end if;
    select * into pr from public.products where id = it->>'id' for update;
    if not found then raise exception 'UNKNOWN_PRODUCT: %', it->>'id'; end if;
    if not pr.in_stock or (pr.stock_qty is not null and pr.stock_qty < q) then raise exception 'OUT_OF_STOCK: %', pr.name; end if;
    insert into public.order_items (errand_id, product_id, name, size, unit_price, qty) values (p_errand_id, pr.id, pr.name, pr.size, pr.price, q);
    if pr.stock_qty is not null then
      update public.products set stock_qty = stock_qty - q, in_stock = (stock_qty - q) > 0 where id = pr.id;
    end if;
  end loop;
end $$;
revoke all on function public.place_order_items(text, jsonb) from public, anon, authenticated;
grant execute on function public.place_order_items(text, jsonb) to service_role;

-- The starting shop (94 products in 14 categories). Prices are placeholders: edit them in the admin dashboard.
insert into public.product_categories (id, name, emoji, tint, age18, img, sort_order) values
  ('alcohols', 'Alcohols', '🍷', '#f3e3ea', true, '/assets/products/alcohols-1.jpg', 1),
  ('baby-care', 'Baby Care', '🍼', '#e3f0fb', false, '/assets/products/baby-care-1.jpg', 2),
  ('bath-soap', 'Bath Soap', '🧼', '#e6f4f1', false, '/assets/products/bath-soap-4.jpg', 3),
  ('body-care', 'Body Care', '🧴', '#fbeee3', false, '/assets/products/body-care-1.jpg', 4),
  ('cleaning', 'Cleaning', '🧽', '#e3eefb', false, '/assets/products/cleaning-2.jpg', 5),
  ('fragrance', 'Fragrance', '🌸', '#f7e6f3', false, '/assets/products/fragrance-1.jpg', 6),
  ('fruits', 'Fruits', '🍎', '#fde8e8', false, '/assets/products/fruits-1.jpg', 7),
  ('groceries', 'Groceries', '🛒', '#e8f5e3', false, '/assets/products/groceries-1.jpg', 8),
  ('hair-extension', 'Hair & Extension', '💇‍♀️', '#efe6f7', false, '/assets/products/hair-extension-3.jpg', 9),
  ('hair-care', 'Hair Care', '💆', '#f3ece3', false, '/assets/products/hair-care-1.jpg', 10),
  ('non-alcoholic', 'Non-Alcoholic Drinks', '🥤', '#e3f5fb', false, '/assets/products/non-alcoholic-3.jpg', 11),
  ('oral-care', 'Oral Care', '🪥', '#e3f1f5', false, '/assets/products/oral-care-3.jpg', 12),
  ('seasoning', 'Seasoning', '🧂', '#fbf3df', false, '/assets/products/seasoning-1.jpg', 13),
  ('skin-care', 'Skin Care', '✨', '#fdf0e6', false, '/assets/products/skin-care-1.jpg', 14)
on conflict (id) do nothing;

insert into public.products (id, category_id, name, size, price, was_price, featured, is_new, img, sort_order) values
  ('alcohols-1', 'alcohols', 'Red wine', '75cl', 8500, null, false, false, '/assets/products/alcohols-1.jpg', 1),
  ('alcohols-2', 'alcohols', 'White wine', '75cl', 8000, null, false, false, '/assets/products/alcohols-2.jpg', 2),
  ('alcohols-3', 'alcohols', 'Premium lager beer', '6 x 33cl', 5400, null, false, false, '/assets/products/alcohols-3.jpg', 3),
  ('alcohols-4', 'alcohols', 'Vodka', '70cl', 12000, null, false, false, '/assets/products/alcohols-4.jpg', 4),
  ('alcohols-5', 'alcohols', 'Whisky', '70cl', 22000, null, false, false, '/assets/products/alcohols-5.jpg', 5),
  ('alcohols-6', 'alcohols', 'Gin', '75cl', 9500, null, false, false, '/assets/products/alcohols-6.jpg', 6),
  ('alcohols-7', 'alcohols', 'Sparkling wine', '75cl', 15000, null, false, true, '/assets/products/alcohols-7.jpg', 7),
  ('baby-care-1', 'baby-care', 'Baby diapers (size 3)', '40 pieces', 14500, null, true, false, '/assets/products/baby-care-1.jpg', 8),
  ('baby-care-2', 'baby-care', 'Baby wipes', '80 pieces', 2500, null, false, false, '/assets/products/baby-care-2.jpg', 9),
  ('baby-care-3', 'baby-care', 'Baby lotion', '200ml', 3200, null, false, false, '/assets/products/baby-care-3.jpg', 10),
  ('baby-care-4', 'baby-care', 'Baby powder', '200g', 2200, null, false, false, '/assets/products/baby-care-4.jpg', 11),
  ('baby-care-5', 'baby-care', 'Baby shampoo', '200ml', 2800, null, false, false, '/assets/products/baby-care-5.jpg', 12),
  ('baby-care-6', 'baby-care', 'Feeding bottle', '250ml', 3000, null, false, false, '/assets/products/baby-care-6.jpg', 13),
  ('baby-care-7', 'baby-care', 'Infant formula', '400g', 9800, null, false, false, '/assets/products/baby-care-7.jpg', 14),
  ('bath-soap-1', 'bath-soap', 'Antibacterial bath soap', '4 bars', 2800, null, false, false, '/assets/products/bath-soap-1.jpg', 15),
  ('bath-soap-2', 'bath-soap', 'Moisturising soap bar', '150g', 900, null, false, false, '/assets/products/bath-soap-2.jpg', 16),
  ('bath-soap-3', 'bath-soap', 'Shea butter soap', '200g', 1500, null, false, false, '/assets/products/bath-soap-3.jpg', 17),
  ('bath-soap-4', 'bath-soap', 'Liquid body wash', '500ml', 4200, null, false, false, '/assets/products/bath-soap-4.jpg', 18),
  ('bath-soap-5', 'bath-soap', 'African black soap', '250g', 1200, null, false, false, '/assets/products/bath-soap-5.jpg', 19),
  ('bath-soap-6', 'bath-soap', 'Medicated soap', '100g', 800, null, false, false, '/assets/products/bath-soap-6.jpg', 20),
  ('body-care-1', 'body-care', 'Body lotion', '400ml', 4500, 5200, true, false, '/assets/products/body-care-1.jpg', 21),
  ('body-care-2', 'body-care', 'Body butter', '250g', 5500, null, false, false, '/assets/products/body-care-2.jpg', 22),
  ('body-care-3', 'body-care', 'Roll-on deodorant', '50ml', 1800, null, false, false, '/assets/products/body-care-3.jpg', 23),
  ('body-care-4', 'body-care', 'Body spray', '150ml', 2600, null, false, false, '/assets/products/body-care-4.jpg', 24),
  ('body-care-5', 'body-care', 'Shaving cream', '200ml', 2200, null, false, false, '/assets/products/body-care-5.jpg', 25),
  ('body-care-6', 'body-care', 'Petroleum jelly', '250ml', 1900, null, false, false, '/assets/products/body-care-6.jpg', 26),
  ('cleaning-1', 'cleaning', 'Dishwashing liquid', '750ml', 1800, null, true, false, '/assets/products/cleaning-1.jpg', 27),
  ('cleaning-2', 'cleaning', 'Laundry detergent', '2kg', 4800, 5500, false, false, '/assets/products/cleaning-2.jpg', 28),
  ('cleaning-3', 'cleaning', 'Bleach', '1 litre', 1500, null, false, false, '/assets/products/cleaning-3.jpg', 29),
  ('cleaning-4', 'cleaning', 'Floor cleaner', '1 litre', 2400, null, false, false, '/assets/products/cleaning-4.jpg', 30),
  ('cleaning-5', 'cleaning', 'Toilet cleaner', '750ml', 1900, null, false, false, '/assets/products/cleaning-5.jpg', 31),
  ('cleaning-6', 'cleaning', 'Scouring sponges', '3 pieces', 900, null, false, false, '/assets/products/cleaning-6.jpg', 32),
  ('cleaning-7', 'cleaning', 'Fabric softener', '1 litre', 3200, null, false, false, '/assets/products/cleaning-7.jpg', 33),
  ('fragrance-1', 'fragrance', 'Eau de parfum for women', '100ml', 18000, null, false, false, '/assets/products/fragrance-1.jpg', 34),
  ('fragrance-2', 'fragrance', 'Eau de toilette for men', '100ml', 15500, null, false, false, '/assets/products/fragrance-2.jpg', 35),
  ('fragrance-3', 'fragrance', 'Body mist', '200ml', 5200, null, false, false, '/assets/products/fragrance-3.jpg', 36),
  ('fragrance-4', 'fragrance', 'Perfume oil', '10ml', 4500, null, false, false, '/assets/products/fragrance-4.jpg', 37),
  ('fragrance-5', 'fragrance', 'Room air freshener', '300ml', 2200, null, false, false, '/assets/products/fragrance-5.jpg', 38),
  ('fragrance-6', 'fragrance', 'Fragrance gift set', '3 pieces', 24000, null, false, true, '/assets/products/fragrance-6.jpg', 39),
  ('fruits-1', 'fruits', 'Apples', '1kg', 3500, 4000, false, false, '/assets/products/fruits-1.jpg', 40),
  ('fruits-2', 'fruits', 'Bananas', '1 bunch', 1500, null, true, false, '/assets/products/fruits-2.jpg', 41),
  ('fruits-3', 'fruits', 'Oranges', '1kg', 2000, null, false, false, '/assets/products/fruits-3.jpg', 42),
  ('fruits-4', 'fruits', 'Watermelon', '1 whole', 4000, null, false, false, '/assets/products/fruits-4.jpg', 43),
  ('fruits-5', 'fruits', 'Pineapple', '1 piece', 1800, null, false, false, '/assets/products/fruits-5.jpg', 44),
  ('fruits-6', 'fruits', 'Mangoes', '1kg', 2500, null, false, true, '/assets/products/fruits-6.jpg', 45),
  ('fruits-7', 'fruits', 'Grapes', '500g', 3800, null, false, false, '/assets/products/fruits-7.jpg', 46),
  ('groceries-1', 'groceries', 'Long grain rice', '10kg', 22000, 25300, true, false, '/assets/products/groceries-1.jpg', 47),
  ('groceries-2', 'groceries', 'Vegetable oil', '3 litres', 9500, 10900, false, false, '/assets/products/groceries-2.jpg', 48),
  ('groceries-3', 'groceries', 'Spaghetti', '500g', 1300, null, false, false, '/assets/products/groceries-3.jpg', 49),
  ('groceries-4', 'groceries', 'Sugar', '1kg', 1800, null, false, false, '/assets/products/groceries-4.jpg', 50),
  ('groceries-5', 'groceries', 'Tomato paste', '400g', 1200, null, false, false, '/assets/products/groceries-5.jpg', 51),
  ('groceries-6', 'groceries', 'Evaporated milk', '400g', 1700, null, false, false, '/assets/products/groceries-6.jpg', 52),
  ('groceries-7', 'groceries', 'Eggs', 'crate of 30', 5500, null, true, false, '/assets/products/groceries-7.jpg', 53),
  ('groceries-8', 'groceries', 'Bread', '1 loaf', 1500, null, false, false, '/assets/products/groceries-8.jpg', 54),
  ('hair-extension-1', 'hair-extension', 'Straight bundle hair', '20 inch', 45000, null, false, false, '/assets/products/hair-extension-1.jpg', 55),
  ('hair-extension-2', 'hair-extension', 'Curly weave', '18 inch', 38000, null, false, false, '/assets/products/hair-extension-3.jpg', 56),
  ('hair-extension-3', 'hair-extension', 'Braiding hair', 'pack', 3500, null, false, false, '/assets/products/hair-extension-3.jpg', 57),
  ('hair-extension-4', 'hair-extension', 'Lace closure', '4 x 4 inch', 25000, null, false, false, '/assets/products/hair-extension-4.jpg', 58),
  ('hair-extension-5', 'hair-extension', 'Hair clips', 'pack of 12', 1200, null, false, false, '/assets/products/hair-extension-5.jpg', 59),
  ('hair-extension-6', 'hair-extension', 'Wig cap', '1 piece', 1500, null, false, false, '/assets/products/hair-extension-6.jpg', 60),
  ('hair-care-1', 'hair-care', 'Shampoo', '400ml', 3800, 4400, false, false, '/assets/products/hair-care-1.jpg', 61),
  ('hair-care-2', 'hair-care', 'Conditioner', '400ml', 3900, null, false, false, '/assets/products/hair-care-2.jpg', 62),
  ('hair-care-3', 'hair-care', 'Hair growth oil', '200ml', 2800, null, false, false, '/assets/products/hair-care-3.jpg', 63),
  ('hair-care-4', 'hair-care', 'Hair relaxer kit', '1 kit', 4500, null, false, false, '/assets/products/hair-care-4.jpg', 64),
  ('hair-care-5', 'hair-care', 'Edge control', '100ml', 2200, null, false, false, '/assets/products/hair-care-5.jpg', 65),
  ('hair-care-6', 'hair-care', 'Detangling brush', '1 piece', 1800, null, false, false, '/assets/products/hair-care-6.jpg', 66),
  ('hair-care-7', 'hair-care', 'Satin bonnet', '1 piece', 2000, null, false, true, '/assets/products/hair-care-7.jpg', 67),
  ('non-alcoholic-1', 'non-alcoholic', 'Bottled water', '12 x 75cl', 3600, 4100, false, false, '/assets/products/non-alcoholic-1.jpg', 68),
  ('non-alcoholic-2', 'non-alcoholic', 'Orange juice', '1 litre', 2200, null, true, false, '/assets/products/non-alcoholic-2.jpg', 69),
  ('non-alcoholic-3', 'non-alcoholic', 'Malt drink', '6 x 33cl', 4800, null, false, false, '/assets/products/non-alcoholic-3.jpg', 70),
  ('non-alcoholic-4', 'non-alcoholic', 'Cola drink', '12 x 50cl', 5400, null, false, false, '/assets/products/non-alcoholic-4.jpg', 71),
  ('non-alcoholic-5', 'non-alcoholic', 'Energy drink', '33cl', 900, null, false, false, '/assets/products/non-alcoholic-5.jpg', 72),
  ('non-alcoholic-6', 'non-alcoholic', 'Tea bags', '100 bags', 2600, null, false, false, '/assets/products/non-alcoholic-6.jpg', 73),
  ('non-alcoholic-7', 'non-alcoholic', 'Chocolate drink powder', '400g', 4500, null, false, false, '/assets/products/non-alcoholic-7.jpg', 74),
  ('oral-care-1', 'oral-care', 'Toothpaste', '120g', 1500, null, true, false, '/assets/products/oral-care-1.jpg', 75),
  ('oral-care-2', 'oral-care', 'Soft toothbrush', '1 piece', 700, null, false, false, '/assets/products/oral-care-2.jpg', 76),
  ('oral-care-3', 'oral-care', 'Mouthwash', '500ml', 3200, null, false, false, '/assets/products/oral-care-3.jpg', 77),
  ('oral-care-4', 'oral-care', 'Dental floss', '50m', 1200, null, false, false, '/assets/products/oral-care-4.jpg', 78),
  ('oral-care-5', 'oral-care', 'Whitening toothpaste', '100g', 2400, null, false, false, '/assets/products/oral-care-5.jpg', 79),
  ('oral-care-6', 'oral-care', 'Electric toothbrush', '1 piece', 18000, null, false, true, '/assets/products/oral-care-6.jpg', 80),
  ('seasoning-1', 'seasoning', 'Seasoning cubes', '50 pieces', 2600, null, true, false, '/assets/products/seasoning-1.jpg', 81),
  ('seasoning-2', 'seasoning', 'Curry powder', '100g', 1000, null, false, false, '/assets/products/seasoning-2.jpg', 82),
  ('seasoning-3', 'seasoning', 'Thyme', '50g', 900, null, false, false, '/assets/products/seasoning-3.jpg', 83),
  ('seasoning-4', 'seasoning', 'Ground pepper', '200g', 1800, null, false, false, '/assets/products/seasoning-4.jpg', 84),
  ('seasoning-5', 'seasoning', 'Iodised salt', '1kg', 700, null, false, false, '/assets/products/seasoning-5.jpg', 85),
  ('seasoning-6', 'seasoning', 'Garlic powder', '100g', 1400, null, false, false, '/assets/products/seasoning-6.jpg', 86),
  ('seasoning-7', 'seasoning', 'Jollof spice mix', '100g', 1600, null, false, true, '/assets/products/seasoning-7.jpg', 87),
  ('skin-care-1', 'skin-care', 'Face wash', '150ml', 3200, 3700, false, false, '/assets/products/skin-care-1.jpg', 88),
  ('skin-care-2', 'skin-care', 'Moisturiser SPF 30', '50ml', 6500, null, false, false, '/assets/products/skin-care-2.jpg', 89),
  ('skin-care-3', 'skin-care', 'Sunscreen', '100ml', 5800, null, false, true, '/assets/products/skin-care-3.jpg', 90),
  ('skin-care-4', 'skin-care', 'Face serum', '30ml', 8500, null, true, false, '/assets/products/skin-care-4.jpg', 91),
  ('skin-care-5', 'skin-care', 'Facial toner', '200ml', 4200, null, false, false, '/assets/products/skin-care-5.jpg', 92),
  ('skin-care-6', 'skin-care', 'Lip balm', '1 piece', 1200, null, false, false, '/assets/products/skin-care-6.jpg', 93),
  ('skin-care-7', 'skin-care', 'Sheet face masks', '5 pieces', 4000, null, false, true, '/assets/products/skin-care-7.jpg', 94)
on conflict (id) do nothing;
