# Rate Limiting Configuration Instructions

To enable the rate limiting functionality that has been implemented, please add the following environment variables to your `.env` file:

```
# Rate limiting settings
THROTTLE_TTL=60000        # Time window in milliseconds (60 seconds)
THROTTLE_LIMIT=100        # Number of requests allowed per IP in that time window
```

## What These Settings Mean

- `THROTTLE_TTL`: The time window in milliseconds during which requests are counted. Default is 60000 (60 seconds).
- `THROTTLE_LIMIT`: The maximum number of requests allowed per IP address within the TTL window. Default is 100.

## Configured Rate Limits

The application now has rate limiting implemented at two levels:

1. **Global Default Rate Limit**:

   - 100 requests per minute per IP address (configurable via the above env variables)
   - Applied to all endpoints by default

2. **Endpoint-Specific Rate Limits**:
   - Login: 5 attempts per minute per IP
   - Token Refresh: 10 attempts per minute per IP
   - Registration: 3 attempts per 5 minutes per IP
   - Change Password: 5 attempts per 5 minutes per IP

## Customizing Rate Limits

You can adjust the rate limits by:

1. Changing the global defaults in your `.env` file
2. Modifying the `@Throttle()` decorators on specific controller methods

## Testing

To verify rate limiting is working:

1. Make rapid requests to sensitive endpoints like `/auth/login`
2. After exceeding the rate limit, you should receive a 429 (Too Many Requests) response

## Implementation Details

- Rate limiting is implemented using the `@nestjs/throttler` package
- The `ThrottlerGuard` is applied globally in the `AppModule`
- Specific endpoints have custom rate limits applied via the `@Throttle()` decorator
