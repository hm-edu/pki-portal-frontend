"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

import { Config } from "@/components/config";

export default function NextAuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    return <SessionProvider refetchInBackground={Config.RefetchInBackground} refetchInterval={60} >{children}</SessionProvider>;
}
