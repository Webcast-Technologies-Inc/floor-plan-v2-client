import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";

export const client1 = new ApolloClient({
    link: new HttpLink({
        uri: import.meta.env.VITE_API_URL,
    }),
    cache: new InMemoryCache(),
});

const token = import.meta.env.VITE_CLIENT2_TOKEN;

const httpLink2 = new HttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URL,
});

const authLink2 = new SetContextLink((prevContext, operation) => {
    return {
        headers: {
            ...prevContext.headers,
            Authorization: `Bearer ${token}`,
        },
    };
});

export const client2 = new ApolloClient({
    link: authLink2.concat(httpLink2),
    cache: new InMemoryCache(),
});
