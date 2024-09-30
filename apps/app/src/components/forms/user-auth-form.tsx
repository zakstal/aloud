'use client';
// import { signIn } from 'next-auth/react';

// import GithubSignInButton from '../github-auth-button';
import { GoogleSignin } from "@/components/google-signin";


// const formSchema = z.object({
//   email: z.string().email({ message: 'Enter a valid email address' })
// });

// type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  // const searchParams = useSearchParams();


  return (
    <>
      {/* <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-2"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email..."
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={loading} className="ml-auto w-full" type="submit">
            Continue With Email
          </Button>
        </form>
      </Form> */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        {/* <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div> */}
      </div>
      {/* <GithubSignInButton /> */}

      <GoogleSignin />
    </>
  );
}
