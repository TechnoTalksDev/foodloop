import type { Actions } from './$types';

export const actions = {
  create: async ({ request, locals: { supabase } }) => {
    // Retrieve form data
    const data = await request.formData();
    const name = data.get('name') as string;
    const amount = data.get('amount') as string;
    const description = data.get('description') as string;
    const location = data.get('location') as string;
    const price = data.get('price') as string;
    const expiry = data.get('expiry') as string;
    const trash = data.get('trash') as string;
    const image_url = data.get('image_url') as string;
    const tags = data.get('tags') as string;

    


    // Fetch the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      // Handle the case where the user is not authenticated
      console.error('User not authenticated:', userError);
      return { error: 'User not authenticated' };
    }

    // Insert the new record into the 'essays' table
    const { error: insertError } = await supabase.from('essays').insert([
      {
        name,
        amount,
        description,
        location,
        price,
        expiry,
        trash,
        tags,
        image_url,
        owner_id: user.id, // Ensure this matches the foreign key in your RLS policy
      },
    ]);

    if (insertError) {
      // Handle the insertion error
      console.error('Error inserting new:', insertError);
      return { error: 'Error inserting new' };
    }

    // Optionally, return a success message or redirect
  
    return { success: true };


  },
} satisfies Actions;
