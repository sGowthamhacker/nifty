import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Sign out from Supabase (this clears the cookies)
  await supabase.auth.signOut()

  // Clear cookies manually just in case
  const response = NextResponse.redirect(`${requestUrl.origin}/login`, {
    status: 302,
  })

  // Optionally set some headers to prevent caching of the redirect
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  
  return response
}
