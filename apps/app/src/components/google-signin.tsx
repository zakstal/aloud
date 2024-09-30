"use client";

import { createClient } from "@v1/supabase/client";
import { Button } from "@v1/ui/button";

let windoww = {}
if (typeof window !== "undefined")  {
  windoww = window
}

export function GoogleSignin() {
  const supabase = createClient();
console.log("redirect locaiton",  `${windoww?.location?.origin}/dashboard/screen-play/new`)
  const handleSignin = () => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${windoww?.location?.origin}/dashboard/screen-play/new`,
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
