# Test Support System Setup
## Backend

You've successfully added a **floating support widget** that appears on all pages. Here's what was implemented:

### 1. **Backend Changes**

✅ **Model:** Added two new URL fields to `PaymentSettings`:
- `support_url` - Primary support link (Telegram, WhatsApp, email, helpdesk, etc.)
- `support_alt_url` - Optional secondary support link

✅ **API:** Updated `/payments/payment-settings/` endpoint to return support links

✅ **Admin:** Updated Django admin interface with "Support & Help" section to configure links

### 2. **Frontend Changes**

✅ **Component:** Created `SupportWidget.jsx` with:
- Floating chat button (bottom-right corner, all pages)
- Click to open support popup menu
- 24/7 support message
- Links to primary/secondary support URLs
- Auto-closing popup

✅ **Integration:** Widget integrated into App.jsx root component (renders on all protected routes)

✅ **API:** Updated `paymentsAPI` to include `getPaymentSettings()` call

### 3. **How to Use**

**For Admin:**
1. Go to Django admin: `http://localhost:8000/admin/payments/paymentsettings/`
2. Edit the "Support & Help" section
3. Add support links:
   - **Primary:** `https://t.me/yourbot` (Telegram), `https://wa.me/xxxx` (WhatsApp), `mailto:support@apex.com` (Email)
   - **Secondary:** Help center, documentation, etc.
4. Save and changes appear instantly on frontend

**For Users:**
1. Click the 💬 chat icon (bottom-right) on any page
2. See support message and links
3. Click link to contact support
4. Popup auto-closes after clicking

### 4. **Features**

- ✅ Icon visible on **ALL pages** (dashboard, upgrade, withdraw, profile, history, etc.)
- ✅ Admin controls links from Django admin
- ✅ Works on mobile & desktop
- ✅ Glassmorphism design (blur effect, modern look)
- ✅ Smooth animations
- ✅ Auto-hides if no links configured
- ✅ No hardcoded URLs

### 5. **Next Steps**

```bash
# 1. Start Django server
cd backend
python manage.py runserver

# 2. In another terminal, start frontend
cd frontend
npm run dev

# 3. Go to http://localhost:5173/dashboard
# 4. Look for 💬 icon in bottom-right corner
```

Then configure support links in Django admin!
