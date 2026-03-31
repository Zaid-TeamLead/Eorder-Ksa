import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/loader/page-loader";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const OTP_BYPASS_USER_ID = "104006";
const OTP_BYPASS_CODE = "00000";

export default function SignInForm() {
  const router = useRouter();
  const { isPending } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const onLogin = async () => {
    setIsLoading(true);
    try {
      await authClient.verifyOtp(OTP_BYPASS_USER_ID, OTP_BYPASS_CODE);
      toast.success("Signed in successfully");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to login"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return <PageLoader />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-[420px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">
            Direct login enabled for user ID <span className="font-mono">{OTP_BYPASS_USER_ID}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            className="h-11 w-full"
            onClick={onLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
