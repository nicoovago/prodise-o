import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mecszydokfgmjgfxdsoy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lY3N6eWRva2ZnbWpnZnhkc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTA4MDcsImV4cCI6MjA5NjY4NjgwN30.NRmDS-3ydIZmDj6SM7Pk08l4fi5uFWRo5VsMfrPDWt0'

export const supabase = createClientComponentClient()

export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey)
