import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Connect to the Database using Node.js variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 3. Grab the data the React frontend sent us
  const { name, email, message } = req.body;

  // 4. Securely insert it into the database
  const { error } = await supabase
    .from('submissions')
    .insert([{ name, email, message }]);

  // 5. Tell the frontend if it worked or failed
  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.status(200).json({ message: 'Form Submitted Successfully' });
}