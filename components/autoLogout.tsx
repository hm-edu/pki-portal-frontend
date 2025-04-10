"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AutoLogout() {

    const [authState, setAuthState] = useState("loading");
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (authState === "authenticated" && status === "unauthenticated") {
            void router.push("/logout");
        }
        setAuthState(status);
    }, [session, status]);

    return <></>;
}
