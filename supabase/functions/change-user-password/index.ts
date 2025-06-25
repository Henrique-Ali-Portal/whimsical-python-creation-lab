
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, newPassword } = await req.json()

    // Get the current user's profile to check permissions
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Get current user's profile
    const { data: currentProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error('Could not fetch user profile')
    }

    // Get target user's profile
    const { data: targetProfile, error: targetError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (targetError) {
      throw new Error('Could not fetch target user profile')
    }

    // Check permissions
    const canChangePassword = (currentRole: string, targetRole: string): boolean => {
      if (currentRole === 'ADMIN') return true
      if (currentRole === 'BOARD') return targetRole === 'MANAGER' || targetRole === 'SALESPERSON'
      return false
    }

    if (!canChangePassword(currentProfile.role, targetProfile.role)) {
      throw new Error('Insufficient permissions')
    }

    // Update password using admin client
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error changing password:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
