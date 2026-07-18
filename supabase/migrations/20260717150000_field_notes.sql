-- Field Notes: the editorial journal. Public reads published notes; admins manage.
-- Seeded with three notes in Adam's voice (two published, one draft) — all drawn
-- from the approved About-page story and claims-compliant (cosmetic language only).
CREATE TABLE public.field_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  standfirst text,
  body text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.field_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads published notes" ON public.field_notes
  FOR SELECT USING (published = true);
CREATE POLICY "Admins manage notes" ON public.field_notes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.field_notes (slug, title, standfirst, body, published, published_at) VALUES

('the-long-game', 'The long game',
 'Most skincare waits for the damage, then sells you the rescue. I think that''s backwards.',
 $md$If you train for anything, you already know how this works. You don't service the bike after the chain snaps. You don't rinse the wetsuit once it's gone stiff. You look after the gear while it's still in the fight, so it stays in the fight.

Somehow skincare got built the other way around. Anti-ageing. Repair. A ten-step fix for a problem you didn't have yet, sold at the moment you finally noticed it. The whole category waits at the bottom of the cliff.

I don't think like that, and I'd guess you don't either.

Skin is equipment. It's the layer between you and everything you do outside: sun, wind, salt, sweat, week after week, year after year. And like any equipment, the smart move is the dull one. Small, daily, unglamorous. Look after it while it's working.

That's the whole idea behind Field Oil 001. One dropper a day, on clean damp skin, and get on with your life. No routine to fail at. No shelf of half-used products. Maintenance, done properly, for years.

The long game isn't complicated. It's just consistent.$md$,
 true, '2026-07-10T09:00:00+10:00'),

('marathon-skin', 'What a marathon takes out of your skin',
 'One a year since 2019. The training does more to your skin than the race.',
 $md$The race gets the attention, but it's the training block that wears you down. Sixteen weeks of long runs, and every one of them happens outside.

Sun on the exposed stretches. Wind that dries you out faster than you notice. Sweat, and the salt it leaves behind when it dries on your face somewhere around the back half of a three-hour run. Then you do it again in four days.

And underneath all that, the training itself strips you down. That's the point of it; you break down and rebuild through the phases. But your skin is part of what gets stripped. By peak week mine always feels it: tight, dry, worn thin.

I started running to be a good dad, and it escalated. By 2019 I was running the marathon distance, one a year since. My skin has copped every kilometre of it.

What I've landed on is simple, because on a training week nothing complicated survives. Water, obviously. Sunscreen on the long runs. And a dropper of oil every day after the shower, when skin is still damp and takes it best. It supports the barrier that all that sun, wind and salt keeps wearing down, and it takes less time than lacing shoes.

The oil came out of that routine. Not a lab brief; a training block.$md$,
 true, '2026-07-17T09:00:00+10:00'),

('no-water', 'Why there''s no water in it',
 'No water means no emulsifiers and no preservative system. A shorter list.',
 $md$Pick up most moisturisers and the first ingredient is water. That single choice sets everything else in motion.

Water and oil don't mix, so now you need emulsifiers. Water grows things, so now you need a preservative system. The product needs to survive a warehouse, a shipping container, a shelf and a hot car, so the system has to be industrial-strength. By the time the cream is stable, the ingredient list has become a small chemistry project, and most of it is there to manage the water, not to look after your skin.

Field Oil 001 is anhydrous. No water in the bottle, so none of that machinery has to exist.

What's left is short enough to read in one pass: two active oils (rosehip and hemp), Australian-grown carriers (jojoba and macadamia), and a natural antioxidant system (meadowfoam, vitamin E, sunflower, rosemary extract) that keeps the blend stable without synthetics. Every line has a job. None of the jobs is "manage the water".

It also just feels different. A few drops on damp skin spreads light and even, absorbs clean, and doesn't leave the film a cream leaves. Once you're used to it, going back is hard.

Simple keeps being the answer.$md$,
 false, null);
