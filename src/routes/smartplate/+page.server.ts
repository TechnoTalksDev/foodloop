import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
  const { id } = params;

  // Fetch the essay based on the provided id
  const { data, error: fetchError } = await supabase
    .from('product')
    .select('*')
    .eq('id', id)
    .single();
  console.log(data.user_id)
  const { data: owner } = await supabase
  .from('users')
  .select(`*`)
  .eq('id', data.user_id)
  .single()

  console.log(owner)
  if (fetchError) {
    // Handle the error appropriately
    throw error(500, 'Error fetching essay data');
  }

  return { product: data, owner };
};

export const actions: Actions = {
  update: async ({ request, locals: { supabase }, params }) => {
    const { id } = params;
    const data = await request.formData();
    const title = data.get('title') as string;
    const content = data.get('content') as string;
    const tags = data.get('tags') as string;
    const prompt = data.get('prompt') as string;

    // Fetch the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      // Handle the case where the user is not authenticated
      console.error('User not authenticated:', userError);
      return { error: 'User not authenticated' };
    }

    // Update the existing essay record
    const { error: updateError } = await supabase
      .from('essays')
      .update({
        title,
        content,
        tags,
        prompt,
        user_id: user.id, // Ensure this matches the foreign key in your RLS policy
      })
      .eq('id', id);

    if (updateError) {
      // Handle the update error
      console.error('Error updating essay:', updateError);
      return { error: 'Error updating essay' };
    }

    // Optionally, return a success message or redirect
    return { success: true };
  },
};
