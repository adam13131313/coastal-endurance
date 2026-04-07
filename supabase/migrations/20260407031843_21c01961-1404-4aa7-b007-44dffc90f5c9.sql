
DROP POLICY "Anyone can insert orders" ON orders;
CREATE POLICY "Safe insert on orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (
    user_id IS NULL
    OR user_id = auth.uid()
  );

DROP POLICY "Anyone can insert order items" ON order_items;
CREATE POLICY "Safe insert on order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id IS NULL OR orders.user_id = auth.uid())
    )
  );
