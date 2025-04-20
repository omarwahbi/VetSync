# Environment Variables Update Instructions

Please update your `.env` file with the following settings for JWT and refresh token configuration:

## Update Existing Settings

Update the JWT expiration time:

```
JWT_EXPIRATION_TIME="15m"
```

## Add New Settings

Add these new refresh token settings:

```
REFRESH_TOKEN_SECRET="your-DIFFERENT-refresh-token-secret" # Must be different from JWT_SECRET
REFRESH_TOKEN_EXPIRATION_TIME="7d"
REFRESH_TOKEN_COOKIE_NAME="jid"

# Frontend URL
FRONTEND_URL="http://localhost:3001" # Update with your actual frontend URL
```

**Important Notes:**

1. Make sure `REFRESH_TOKEN_SECRET` is different from `JWT_SECRET` for security reasons.
2. Generate a strong random string for `REFRESH_TOKEN_SECRET`.
3. The expiration times use formats like "15m" (15 minutes), "7d" (7 days), etc.
