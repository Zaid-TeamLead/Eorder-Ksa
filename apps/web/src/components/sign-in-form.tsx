import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/loader/page-loader";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react"

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const userIdSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(5, "OTP must be 5 digits")
    .max(5, "OTP must be 5 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

export default function SignInForm() {
  const router = useRouter();
  const { isPending } = useSession();
  const [step, setStep] = useState<"userId" | "otp">("userId");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const userIdForm = useForm({
    resolver: zodResolver(userIdSchema),
    defaultValues: {
      userId: "",
    },
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onUserIdSubmit = async (values: z.infer<typeof userIdSchema>) => {
    setIsLoading(true);
    try {
      await authClient.generateOtp(values.userId);
      setUserId(values.userId);
      setStep("otp");
      toast.success("OTP sent successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    setIsLoading(true);
    try {
      await authClient.verifyOtp(userId, values.otp);
      toast.success("Signed in successfully");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to verify OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep("userId");
    otpForm.reset();
  };

  if (isPending) {
    return <PageLoader />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-[420px] h-[520px] flex flex-col">
        <CardHeader className="space-y-1 flex-shrink-0">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardTitle className="text-2xl font-bold text-center">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center">
              {step === "userId"
                ? "Enter your User ID to receive an OTP"
                : "Enter the OTP sent to your account"}
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {step === "userId" ? (
              <Form {...userIdForm} key="userId-form">
                <form
                  onSubmit={userIdForm.handleSubmit(onUserIdSubmit)}
                  className="flex flex-col flex-1 space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormField
                      control={userIdForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your User ID"
                              {...field}
                              disabled={isLoading}
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            ) : (
              <motion.div
                key="otp-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-4 flex-1 flex flex-col"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="rounded-lg bg-muted/50 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">OTP Generated Successfully</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    An OTP has been sent to your account. Please check and enter
                    the 5-digit code below.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    User ID: <span className="font-mono font-medium">{userId}</span>
                  </div>
                </motion.div>

                <Form {...otpForm}>
                  <form
                    onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                    className="space-y-4 flex-1 flex flex-col"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      <FormField
                        control={otpForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enter OTP</FormLabel>
                            <FormControl>
                              <InputOTP
                                maxLength={5}
                                {...field}
                                disabled={isLoading}
                              >
                                <InputOTPGroup>
                                  <InputOTPSlot index={0} />
                                  <InputOTPSlot index={1} />
                                  <InputOTPSlot index={2} />
                                  <InputOTPSlot index={3} />
                                  <InputOTPSlot index={4} />
                                </InputOTPGroup>
                              </InputOTP>
                            </FormControl>
                            <FormDescription>
                              Enter the 5-digit code sent to your account
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                      className="flex gap-2 mt-auto"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify OTP"
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
