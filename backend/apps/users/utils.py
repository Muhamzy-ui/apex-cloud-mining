"""
Apex Mining - Email Utilities using Resend
"""
import resend
from django.conf import settings

def _configure_resend():
    if settings.RESEND_API_KEY:
        resend.api_key = settings.RESEND_API_KEY
    return bool(settings.RESEND_API_KEY)

def send_verification_email(email, code):
    """Send a 6-digit verification code to the user"""
    if not _configure_resend():
        print(f"⚠️ [MOCK EMAIL] Verification Code for {email}: {code}")
        return True
        
    try:
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
            "to": email,
            "subject": f"Apex Mining - Verification Code: {code}",
            "html": html_content
        })
        print(f"✅ Verification email sent to {email}: {r}")
        return True
    except Exception as e:
        print(f"❌ Failed to send verification email to {email}: {str(e)}")
        return False

def send_password_reset_email(email, code):
    """Send a 6-digit password reset code to the user"""
    if not _configure_resend():
        print(f"⚠️ [MOCK EMAIL] Password Reset Code for {email}: {code}")
        return True
        
    try:
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
            "to": email,
            "subject": f"Apex Mining - Password Reset Code",
            "html": html_content
        })
        print(f"✅ Password reset email sent to {email}: {r}")
        return True
    except Exception as e:
        print(f"❌ Failed to send password reset email to {email}: {str(e)}")
        return False
