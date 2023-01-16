/* eslint-disable react/display-name */
import { useSession } from "next-auth/react";
import { AuthProps } from "./config";

const withSession = (Component: React.ComponentType<{ session: AuthProps | null; status: string }>) => (props: JSX.IntrinsicAttributes) => {
    const { data: session, status } = useSession();

    // if the component has a render property, we are good
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return <Component session={session} status={status} {...props} />;
};

export default withSession;