// Staff-only operations handbook, shown inside the admin area (never customer-facing).
const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-typewriter text-sm uppercase tracking-widest text-foreground mb-3">{children}</h2>
);

const AdminGuide = () => (
  <div className="max-w-[760px] space-y-10 font-body text-[15px] leading-relaxed text-muted-foreground">
    <section>
      <H>What this store is</H>
      <p>
        Coastal Endurance sells one product, Field Oil, as a <strong>single bottle ($78)</strong> or a
        prepaid <strong>12-month bundle ($234)</strong>: 4 bottles for the price of 3, shipped on a schedule the customer
        chooses (default every 3 months). The bundle is paid once upfront, so we still owe those
        shipments over the following year. Keeping on top of the dispatch schedule is the most
        important daily job.
      </p>
    </section>

    <section>
      <H>Your daily job</H>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Open the <strong>To ship</strong> tab. Anything overdue is shown in bold.</li>
        <li>Post the bottle, type the tracking number into the row, and click <strong>Mark shipped</strong>. The customer is automatically emailed their tracking.</li>
        <li>You also get a <strong>daily email</strong> each morning listing what is due or overdue, so you never have to remember to check.</li>
      </ol>
    </section>

    <section>
      <H>How to…</H>
      <ul className="space-y-3">
        <li><strong>Ship a delivery:</strong> To ship tab → enter tracking → Mark shipped.</li>
        <li><strong>Complete an order:</strong> Orders tab → Mark order fulfilled (once every shipment is sent).</li>
        <li><strong>Refund a customer:</strong> do it in <strong>Stripe</strong> (Payments → open the order → Refund). The store updates itself: the order is set to refunded, remaining shipments are cancelled, bottles are restocked, and you get a confirmation email. Do not change anything here by hand.</li>
        <li><strong>Restock / change price / hide the product:</strong> Supabase dashboard → Table Editor → <code>products</code> (edit <code>stock_quantity</code>) or <code>product_variants</code> (edit <code>price_cents</code>, where 7800 = $78.00).</li>
        <li><strong>Add a staff member:</strong> Supabase → Table Editor → <code>admins</code> → insert their Google login email. That grants this admin area and the notification emails.</li>
      </ul>
    </section>

    <section>
      <H>Emails the store sends you</H>
      <ul className="list-disc pl-5 space-y-1">
        <li>New order, on every paid order</li>
        <li>Low stock, when bottles drop to 10 or fewer</li>
        <li>Daily “shipments to send” digest</li>
        <li>Order refunded</li>
      </ul>
    </section>

    <section>
      <H>Systems landscape</H>
      <p className="mb-3">Each part of the business runs in a different system:</p>
      <div className="border border-border divide-y divide-border">
        {[
          ["GitHub", "The source code. Pushing to it deploys the site."],
          ["Vercel", "Hosts the website (coastalendurance.com) and this admin area."],
          ["Supabase", "The backend: database, customer logins, server logic, scheduled jobs."],
          ["Stripe", "Takes payments and handles refunds."],
          ["Resend", "Sends all email (receipts, tracking, your alerts)."],
          ["Google", "Customer sign-in."],
          ["Namecheap", "The domain and its DNS."],
        ].map(([s, d]) => (
          <div key={s} className="flex gap-4 p-3 text-sm">
            <span className="w-28 shrink-0 font-typewriter uppercase tracking-wider text-foreground">{s}</span>
            <span>{d}</span>
          </div>
        ))}
      </div>
    </section>

    <section>
      <H>How an order flows</H>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Customer pays on <strong>Stripe</strong>'s secure page.</li>
        <li><strong>Supabase</strong> records the order, reduces stock, and (via <strong>Resend</strong>) emails the customer a receipt and emails you a new-order alert.</li>
        <li>You ship from the <strong>To ship</strong> tab; the customer is emailed tracking.</li>
        <li>A refund in <strong>Stripe</strong> flows back automatically (refunded, shipments cancelled, restocked).</li>
      </ol>
    </section>

    <section>
      <H>Where to log in</H>
      <ul className="space-y-2">
        <li><strong>Supabase</strong> — products, stock, order data, staff list: <a className="underline" href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">supabase.com/dashboard</a></li>
        <li><strong>Stripe</strong> — payments and refunds: <a className="underline" href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">dashboard.stripe.com</a></li>
        <li><strong>Vercel</strong> — hosting and deploys: <a className="underline" href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">vercel.com</a></li>
        <li><strong>Resend</strong> — email delivery logs: <a className="underline" href="https://resend.com" target="_blank" rel="noopener noreferrer">resend.com</a></li>
      </ul>
      <p className="mt-3 text-sm">Access to those consoles is separate from this admin area; ask the owner for an invite.</p>
    </section>
  </div>
);

export default AdminGuide;
