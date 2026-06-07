"""
Apex Mining - Email Utilities using Resend
"""
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def _configure_resend():
    """Configure resend library and return True if API key is available."""
    api_key = getattr(settings, 'RESEND_API_KEY', None)
    if api_key:
        try:
            import resend
            resend.api_key = api_key
            return True
        except ImportError:
            logger.error("❌ 'resend' package is not installed. Run: pip install resend")
            return False
    else:
        logger.warning(
            "⚠️ RESEND_API_KEY is not set in environment variables. "
            "Emails will NOT be sent. Set RESEND_API_KEY in your Render environment variables."
        )
        return False


def send_verification_email(email, code):
    """Send a 6-digit verification code to the user."""
    if not _configure_resend():
        # No API key — log the code prominently so admin can see it in server logs
        logger.warning(
            f"[NO-EMAIL-API] Verification code for {email} is: {code} "
            f"(RESEND_API_KEY not configured — email NOT sent)"
        )
        print(f"⚠️ [NO-EMAIL-API] Verification Code for {email}: {code}  ← NOT SENT (no RESEND_API_KEY)")
        return False  # Return False so caller knows email wasn't sent

    try:
        import resend
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #1A6FFF;">Welcome to Apex Cloud Mining!</h2>
            <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
            <div style="background: #f4f7f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="margin-bottom: 5px; color: #666;">Your Verification Code:</p>
                <h1 style="letter-spacing: 5px; color: #111; margin: 0;">{code}</h1>
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            <br/>
            <p>Best regards,<br/>The Apex Mining Team</p>
        </div>
        """

        r = resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": f"Apex Mining - Your Verification Code: {code}",
            "html": html_content
        })
        logger.info(f"✅ Verification email sent to {email}. Resend response: {r}")
        print(f"✅ Verification email sent to {email}: {r}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send verification email to {email}: {str(e)}")
        print(f"❌ Failed to send verification email to {email}: {str(e)}")
        return False


def send_password_reset_email(email, code):
    """Send a 6-digit password reset code to the user."""
    if not _configure_resend():
        logger.warning(
            f"[NO-EMAIL-API] Password reset code for {email} is: {code} "
            f"(RESEND_API_KEY not configured — email NOT sent)"
        )
        print(f"⚠️ [NO-EMAIL-API] Password Reset Code for {email}: {code}  ← NOT SENT (no RESEND_API_KEY)")
        return False  # Return False so caller knows email wasn't sent

    try:
        import resend
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #1A6FFF;">Reset Your Password</h2>
            <p>We received a request to reset the password for your Apex Cloud Mining account.</p>
            <div style="background: #f4f7f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="margin-bottom: 5px; color: #666;">Your Password Reset Code:</p>
                <h1 style="letter-spacing: 5px; color: #111; margin: 0;">{code}</h1>
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
            <br/>
            <p>Best regards,<br/>The Apex Mining Team</p>
        </div>
        """

        r = resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": "Apex Mining - Password Reset Code",
            "html": html_content
        })
        logger.info(f"✅ Password reset email sent to {email}. Resend response: {r}")
        print(f"✅ Password reset email sent to {email}: {r}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send password reset email to {email}: {str(e)}")
        print(f"❌ Failed to send password reset email to {email}: {str(e)}")
        return False
