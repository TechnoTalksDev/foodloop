import type { Actions } from './$types';

export const actions = {
  create: async ({ request, locals: { supabase } }) => {
    try {
      // Retrieve form data
      const formData = await request.formData();
      
      // Debug - log all form keys to see what's being received
      console.log("Form data keys:", Array.from(formData.keys()));
      
      // Extract form values
      const name = formData.get('name') as string;
      const amount = parseInt(formData.get('amount') as string);
      const description = formData.get('description') as string;
      const location = formData.get('location') as string;
      const price = parseFloat(formData.get('price') as string);
      const expiry = formData.get('expiry') as string;
      const trash = formData.get('trash') as string;
      const tagsString = formData.get('tags') as string;
      
      // Parse tags from JSON string
      let tags;
      try {
        tags = JSON.parse(tagsString);
      } catch (e) {
        console.error('Error parsing tags:', e);
        tags = [];
      }
      
      // Handle file upload - this assumes you're using Supabase storage
      const imageFile = formData.get('image') as File;
      console.log(imageFile)
      let image_url = '';
      
      if (imageFile && imageFile instanceof File) {
        console.log("File received:", imageFile.name, imageFile.size, imageFile.type);
        
        // Upload the file to Supabase Storage
        const { data: fileData, error: uploadError } = await supabase
          .storage
          .from('products')
          .upload(`-${Date.now()}/${imageFile.name}`, imageFile);
        

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          return { error: 'Error uploading file' };
        }
        
        // Get the public URL for the uploaded file
        const { data: urlData } = supabase
          .storage
          .from('products')
          .getPublicUrl(fileData.path);
          
        image_url = urlData.publicUrl;
      } else {
        console.log("No file received in form data");
      }
      
      // Fetch the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return { error: 'User not authenticated' };
      }

      // Insert the new record into the 'essays' table
      const { data: insertData, error: insertError } = await supabase.from('product').insert([
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
          user_id: user.id,
        },
      ]).select();

      if (insertError) {
        console.error('Error inserting new record:', insertError);
        return { error: 'Error inserting new record' };
      }

      return { success: true, data: insertData };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { error: 'An unexpected error occurred' };
    }
  },
} satisfies Actions;