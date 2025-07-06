import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hbroimsrczuzwpgzgzad.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhicm9pbXNyY3p1endwZ3pnemFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNzU5NTUsImV4cCI6MjA2NjY1MTk1NX0.SyvkPakjDZ_HtqT_pcU0WiSCC7SHHYd4tggpUjpKC2I"

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
