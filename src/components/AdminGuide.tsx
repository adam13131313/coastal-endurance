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
      <H>Field team (free bottles)</H>
      <p className="mb-3">
        The field team are people we invite to try Field Oil for free in exchange for feedback and word of mouth.
        Each person gets <strong>one free bottle</strong>. You add them one at a time, as you recruit them, from the
        <strong> Field team</strong> tab. There is no list to upload.
      </p>
      <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">To add a member</p>
      <ol className="list-decimal pl-5 space-y-2 mb-4">
        <li>Open the <strong>Field team</strong> tab.</li>
        <li>Type the person's <strong>email</strong> and click <strong>Generate code</strong>.</li>
        <li>The store creates a one-time code (looks like <code>FIELD-XXXXX</code>), <strong>emails it to them</strong> with instructions, and adds them to the list below. Nothing else to do.</li>
      </ol>
      <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">What the member does</p>
      <ol className="list-decimal pl-5 space-y-2 mb-4">
        <li>Goes to the product page and adds a <strong>single bottle</strong> to the cart.</li>
        <li>Enters their code at checkout. The total drops to <strong>$0</strong> and the order completes (no card needed).</li>
        <li>It then arrives in <strong>To ship</strong> like any order. You post it and mark it shipped the same way. Free bottles still come out of stock.</li>
      </ol>
      <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">Managing members</p>
      <ul className="space-y-2 mb-4">
        <li><strong>Status</strong> shows <em>Issued</em> (code sent, not used yet), <em>Redeemed</em> (they've ordered), or <em>Revoked</em>.</li>
        <li><strong>Resend</strong> re-emails someone their code if they lost it.</li>
        <li><strong>Revoke</strong> turns a code off so it can no longer be used and removes the person. <strong>Always revoke here</strong> — never delete the row in Supabase by hand, as that leaves a live code floating.</li>
      </ul>
      <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">Rules to know</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Each code works <strong>once</strong> and covers <strong>one bottle</strong>. Codes are personal, don't post them publicly.</li>
        <li>If a member adds the 4-bottle bundle instead, the code only takes <strong>$78 off</strong> (they pay the rest) — a field-team code can never give away a whole bundle.</li>
        <li>Free bottles record as <strong>$0 revenue but count as one unit</strong>, so the Plan and Pipeline numbers stay honest.</li>
      </ul>
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
