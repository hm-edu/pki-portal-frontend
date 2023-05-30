import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function AutoLogout() {

    const [authState, setAuthState] = useState("loading");
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        console.log("AutoLogout: status: " + status);
        if (authState === "authenticated" && status === "unauthenticated") {
            void router.push("/logout").catch((err) => console.error(err));
        }
        setAuthState(status);
    }, [session, status]);

    return <></>;
}