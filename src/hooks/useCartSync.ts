import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';

export function useCartSync() {
  const syncCart = useCartStore(state => state.syncCart);
  const updateBuyerIdentity = useCartStore(state => state.updateBuyerIdentity);

  useEffect(() => {
    syncCart();

    // When user logs in, update the cart's buyer identity so checkout is pre-filled
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        updateBuyerIdentity();
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncCart();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, [syncCart, updateBuyerIdentity]);
}
