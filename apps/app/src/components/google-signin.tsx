"use client";

import { createClient } from "@v1/supabase/client";
import { Button } from "@v1/ui/button";
import { getWindow } from '@/getWindow'

let window = getWindow()

export function GoogleSignin() {
  const supabase = createClient();
  let window = getWindow()
console.log("redirect locaiton",  `${window?.location?.origin}/dashboard/screen-play/new`)
  const handleSignin = () => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window?.location?.origin}/dashboard/screen-play/new`,
        // redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <Button onClick={handleSignin} variant="outline" className="font-mono">
      Sign in with Google
    </Button>
  );
}


