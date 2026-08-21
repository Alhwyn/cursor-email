import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const DEFAULT_CTA = "https://luma.com/cursorvictoria";

/** 1×1 transparent GIF */
const PIXEL_GIF = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33,
  249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59,
]);

const http = httpRouter();

http.route({
  path: "/track/open",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("t") ?? "";
    if (token) {
      try {
        await ctx.runMutation(internal.guests.markOpenedByToken, { token });
      } catch (error) {
        console.error("track/open failed:", error);
      }
    }

    return new Response(PIXEL_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    });
  }),
});

http.route({
  path: "/track/read",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("t") ?? "";
    let destination = DEFAULT_CTA;

    if (token) {
      try {
        const result = await ctx.runMutation(internal.guests.markReadByToken, {
          token,
        });
        if (result?.passportUrl) {
          destination = result.passportUrl;
        }
      } catch (error) {
        console.error("track/read failed:", error);
      }
    }

    return Response.redirect(destination, 302);
  }),
});

export default http;
