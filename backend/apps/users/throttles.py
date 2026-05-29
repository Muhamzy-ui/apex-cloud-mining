from rest_framework.throttling import SimpleRateThrottle

class AuthAttemptThrottle(SimpleRateThrottle):
    """
    Limits authentication attempts (login, register, reset, OTP) to prevent brute-force attacks.
    Throttles by IP address.
    """
    scope = 'auth_attempt'

    def get_cache_key(self, request, view):
        # Always throttle auth requests by IP address
        return self.get_ident(request)

class AccountVerificationThrottle(SimpleRateThrottle):
    """
    Limits bank account name verification calls to prevent API abuse or data harvesting.
    Throttles authenticated users by their user ID, and anonymous users by their IP address.
    """
    scope = 'account_verification'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"user_{request.user.id}"
        return self.get_ident(request)
