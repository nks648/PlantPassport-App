import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

export function getTrpcUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    console.warn("EXPO_PUBLIC_RORK_API_BASE_URL is not set — tRPC calls will fail");
    return null;
  }

  return `${url}/api/trpc`;
}

function createTrpcClient() {
  const trpcUrl = getTrpcUrl();
  if (!trpcUrl) {
    console.warn("[tRPC] No API base URL configured, creating client with placeholder URL");
  }

  return trpc.createClient({
    links: [
      httpLink({
        url: trpcUrl || "http://localhost:3000/api/trpc",
        transformer: superjson,
      }),
    ],
  });
}

export const trpcClient = createTrpcClient();
