import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";

export const client1 = new ApolloClient({
    link: new HttpLink({
        uri: import.meta.env.VITE_API_URL,
    }),
    cache: new InMemoryCache(),
});

const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoyODYsImZpcnN0TmFtZSI6IlBhZW5nIiwibGFzdE5hbWUiOiJTYWxheW9nIiwidXNlcm5hbWUiOiJybHNhbGF5b2dAZmluZG1lLmNvbS5waCIsInN0YXR1cyI6ImFjdGl2ZSIsImVtYWlsIjoicmxzYWxheW9nQGZpbmRtZS5jb20ucGgiLCJjbGllbnRfaWQiOjEsInVzZXJfbGV2ZWxfaWQiOjQ3LCJoYXNfYWN0aXZlX3Nlc3Npb24iOjF9LCJpYXQiOjE3NjA4ODAxMjUsImV4cCI6MTc2MDkxMjUyNX0.5yKIoge0o4h0l0dzeTi9u5xWrkl3edbeiiygVqm-l2Y";

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
