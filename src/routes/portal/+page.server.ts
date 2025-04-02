import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {

  // Fetch the essay based on the provided id
  const { data, error: fetchError } = await supabase
    .from('product')
    .select('*')
    .limit(50)


  if (fetchError) {
    // Handle the error appropriately
    throw error(500, 'Error fetching essay data');
  }

  return { products: data };
};