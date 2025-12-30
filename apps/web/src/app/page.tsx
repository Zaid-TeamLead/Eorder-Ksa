"use client";

import { LoadingState } from "@/components/shared/loading-state";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [session, isPending, router]);


      return <LoadingState message="Loading..." />;

}
