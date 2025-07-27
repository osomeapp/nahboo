import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create a guest user session for testing
    const guestUser = {
      id: `guest_${Date.now()}`,
      email: `guest_${Date.now()}@demo.app`,
      name: 'Guest User',
      subject: 'mathematics',
      level: 'beginner',
      age_group: 'adult',
      created_at: new Date().toISOString(),
      is_guest: true
    }

    return NextResponse.json({
      success: true,
      user: guestUser,
      session: {
        access_token: `guest_token_${Date.now()}`,
        user: guestUser,
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      },
      message: 'Guest session created! You can explore all features.'
    })

  } catch (error) {
    console.error('Guest login error:', error)
    return NextResponse.json(
      { error: 'Failed to create guest session' },
      { status: 500 }
    )
  }
}