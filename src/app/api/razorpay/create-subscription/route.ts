import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_PLAN_ID) {
      return NextResponse.json({ error: "Razorpay is not configured on the server." }, { status: 500 });
    }

    // Create a subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 120, // max 10 years
      notes: {
        userId: user.id, // Store Supabase user ID for the webhook to parse!
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      userEmail: user.email,
    });
  } catch (error: unknown) {
    console.error("Razorpay Sub Error:", error);
    const msg = error instanceof Error ? error.message : "Error creating subscription";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
