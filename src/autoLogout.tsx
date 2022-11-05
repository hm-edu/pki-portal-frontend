import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function AutoLogout() {

    const [authState, setAuthState] = useState("loading");
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (authState === "authenticated" && status === "unauthenticated") {
            void router.push("/loggedOut").catch((err) => console.error(err));
        }
        setAuthState(status);
    }, [session, status]);

    return <></>;
}