import { ApolloProvider } from "@apollo/client/react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { client1 } from "./api/apolloClient.ts";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <ApolloProvider client={client1}>
                <APIProvider apiKey={import.meta.env.VITE_GOOGLE_API_KEY || ""}>
                    <App />
                </APIProvider>
            </ApolloProvider>
        </BrowserRouter>
    </StrictMode>
);
