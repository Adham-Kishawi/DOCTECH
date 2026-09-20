import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      return NextResponse.json(
        { success: false, error: "Clerk configuration is missing" },
        { status: 500 }
      );
    }

    // 1. Look up user by email in Clerk
    const usersRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email.trim().toLowerCase())}`,
      {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!usersRes.ok) {
      const errText = await usersRes.text();
      console.error("Clerk user lookup error:", errText);
      return NextResponse.json(
        { success: false, error: "Failed to authenticate" },
        { status: 401 }
      );
    }

    const users = await usersRes.json();
    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    // 2. Verify password with Clerk API
    const verifyRes = await fetch(
      `https://api.clerk.com/v1/users/${user.id}/verify_password`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const verifyData = await verifyRes.json();
    if (!verifyData.verified) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 3. Create sign-in token to bypass 2FA / client trust roadblocks
    const tokenRes = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
        expires_in_seconds: 300,
      }),
    });

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text();
      console.error("Clerk sign-in token creation error:", tokenErr);
      return NextResponse.json(
        { success: false, error: "Failed to generate session token" },
        { status: 500 }
      );
    }

    const tokenData = await tokenRes.json();

    return NextResponse.json({
      success: true,
      token: tokenData.token,
    });
  } catch (error: any) {
    console.error("Sign-in-token route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
