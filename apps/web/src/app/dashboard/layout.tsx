"use client";
import PageLoader from "@/components/loader/page-loader";
import { useSession } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import React, { useEffect } from "react";

const layout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      redirect("/login");
    }
  }, [session, isPending]);

  if (isPending) {
    return <PageLoader />;
  }

  if (!session) {
    return null;
  }

  return <div>{children}</div>;
};

export default layout;
