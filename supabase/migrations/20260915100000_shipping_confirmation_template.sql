-- Shipping notification moves to the reviewed comms flow: ship-delivery now
-- returns a draft rendered from this template (editable in the Comms library),
-- and the admin sends it explicitly via send-order-email. Nothing auto-sends.
insert into public.email_templates (key, label, subject, body, event_type, sort)
values (
  'shipping_confirmation',
  'Shipping confirmation',
  'Your Coastal Endurance order has shipped',
$body$Hi {{first_name}},

Shipment {{sequence}} of your order was posted on {{shipped_on}}.

Tracking number: {{tracking_number}}
Track it here: {{tracking_url}}

Sent with Australia Post. Tracking can take up to 24 hours to show its first scan. Standard delivery is usually a few business days within Australia; international orders take longer and may pass through customs on arrival.$body$,
  'email_sent',
  100
)
on conflict (key) do nothing;
