// netlify/functions/send-notification.js
//
// This is the backend piece app.js's sendNoticePush() calls (at
// /api/send-notification — Netlify maps that path to this function via the
// redirect below, or you can call /.netlify/functions/send-notification
// directly and skip the redirect).
//
// SETUP:
// 1. Deploy this file as-is in a `netlify/functions/` folder at your repo root.
// 2. In the Netlify dashboard: Site settings -> Environment variables, add:
//      ONESIGNAL_REST_API_KEY = <your REST API Key from OneSignal dashboard
//                                 -> Settings -> Keys & IDs>
//    Never put this key in app.js, index.html, or any file served to the
//    browser — it must only exist here, server-side.
// 3. (Optional but recommended) add a netlify.toml redirect so /api/*
//    routes to /.netlify/functions/*:
//      [[redirects]]
//        from = "/api/*"
//        to = "/.netlify/functions/:splat"
//        status = 200
//
// This function does NOT trust the client for anything beyond title/body/url
// — it always sends to your whole subscribed audience using your App ID,
// so a malicious client can at most spam a push, not target individuals or
// exfiltrate subscriber data.

const ONESIGNAL_APP_ID = "1bcdf8fd-ba5b-466f-847c-f7781d16c814";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!restApiKey) {
    console.error("ONESIGNAL_REST_API_KEY is not set in environment variables.");
    return { statusCode: 500, body: JSON.stringify({ error: "Server not configured for push." }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body." }) };
  }

  const title = String(payload.title || "New Notice Posted").slice(0, 120);
  const body = String(payload.body || "A new notice has been posted.").slice(0, 300);
  const url = typeof payload.url === "string" ? payload.url : "/";

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${restApiKey}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["Subscribed Users"],
        headings: { en: title },
        contents: { en: body },
        url,
        data: payload.data || {}
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("OneSignal API error:", result);
      return { statusCode: response.status, body: JSON.stringify(result) };
    }

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error("Failed to reach OneSignal:", error);
    return { statusCode: 502, body: JSON.stringify({ error: "Failed to reach OneSignal." }) };
  }
};
