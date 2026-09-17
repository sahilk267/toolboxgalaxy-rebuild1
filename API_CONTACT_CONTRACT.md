# Contact and API Contract for Shared Hostinger Hosting

The Vite frontend is prepared to send feedback to one same-origin endpoint: `POST /api/v1/contact`. The PHP endpoint is intentionally **not included** in this static project; it should be implemented and deployed inside the Hostinger document root by the hosting-side developer. Building the frontend with `VITE_CONTACT_ENDPOINT=/api/v1/contact` enables the form.

## Request and response shape

The browser sends JSON with a `Content-Type: application/json` header. The endpoint should accept only this shape and reject all unexpected fields.

```json
{
  "name": "Ada Example",
  "email": "ada@example.com",
  "subject": "Tool feedback",
  "message": "The QR generator was useful."
}
```

On successful acceptance, return HTTP `202` with:

```json
{ "ok": true, "requestId": "opaque-log-id" }
```

Validation or rate-limit failures should use an appropriate `4xx` status and this non-sensitive response shape:

```json
{ "ok": false, "error": { "code": "validation_error", "message": "Please check the highlighted fields." } }
```

## Server-side controls to implement

| Control | Required behavior |
|---|---|
| Origin | Accept only the production domain and its HTTPS origin; do not send wildcard CORS headers. |
| Input validation | Trim values; set server-side maximum lengths; require a valid email; reject unexpected keys. |
| Rate limiting | Limit by IP and by email address, returning a generic `429` response. |
| Abuse mitigation | Include a honeypot field or comparable server-verified anti-automation measure. |
| Mail handling | Keep recipient addresses and SMTP credentials outside the public document root; never return mail transport errors to the browser. |
| Logging | Record an opaque request ID and outcome only; do not write full message text or raw IP addresses to public logs. |
| HTTPS | Force HTTPS before accepting a request. |

> The contact endpoint should be configured and tested on Hostinger before the frontend form is enabled. Until that point, the UI clearly exposes email fallback rather than pretending to submit a request.

## Future `/api/v1/` tools

Only tools that require server processing should use this namespace. Each endpoint should follow the same JSON error envelope, validate inputs server-side, use strict file-type and file-size checks for uploads, remove temporary files, and avoid exposing stack traces or implementation details.
