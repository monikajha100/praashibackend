# 🧪 Razorpay Test Cards That Work (Updated 2024)

## ❌ Common Issue: "International cards are not supported"

If you're seeing this error, it means the test card you're using is being detected as an international card, which Razorpay test mode may reject.

## ✅ Working Test Cards for Razorpay

### Indian Test Cards (Recommended)

These work reliably in Razorpay test mode:

#### **Success Cards:**

1. **Visa (Indian):**
   - Card Number: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Any future date (e.g., `12/25` or `12/28`)
   - Name: Any name
   - **Note:** If this doesn't work, try the Mastercard below

2. **Mastercard (Indian):**
   - Card Number: `5267 3181 8797 5449`
   - CVV: `123`
   - Expiry: Any future date (e.g., `12/25`)
   - Name: Any name

3. **RuPay Card:**
   - Card Number: `6074 8200 0000 0009`
   - CVV: `123`
   - Expiry: Any future date

### Failure Test Cards (for testing error handling):

1. **Insufficient Funds:**
   - Card Number: `4000 0000 0000 9995`
   - CVV: `123`
   - Expiry: Any future date

2. **Card Declined:**
   - Card Number: `4000 0000 0000 0069`
   - CVV: `123`
   - Expiry: Any future date

3. **Invalid CVV:**
   - Card Number: `4111 1111 1111 1111`
   - CVV: `000` (or any wrong CVV)
   - Expiry: Any future date

---

## 🎯 Recommended Solution: Use UPI Instead

Since card testing can be problematic, **use UPI for testing** which always works:

1. Select **"UPI"** payment method in Razorpay checkout
2. Use any UPI ID like: `test@razorpay` or `success@razorpay`
3. Complete the payment - it will succeed in test mode

**UPI is easier and more reliable for testing!**

---

## ⚙️ Configure Razorpay Dashboard Settings

If cards still don't work, check these settings in your Razorpay dashboard:

### Step 1: Check Payment Methods Settings

1. Go to https://dashboard.razorpay.com
2. Settings → **Configuration** → **Payment Methods**
3. Ensure **"Cards"** is enabled
4. Check if there are any restrictions on international cards

### Step 2: Check Account Settings

1. Settings → **Account & Settings**
2. Look for "International Payments" or "Card Restrictions"
3. In test mode, some restrictions might not apply, but check anyway

### Step 3: Verify Test Mode

1. Make sure you're using **Test Keys** (`rzp_test_...`)
2. Dashboard should show "Test Mode" indicator
3. Test transactions appear in "Test" section, not "Live"

---

## 🔧 Alternative: Test with UPI (Easiest)

Instead of fighting with card issues, **test with UPI**:

1. In Razorpay checkout, select **"UPI"** option
2. Enter any test UPI ID: `test@razorpay`
3. Click "Verify" or "Pay"
4. Payment will succeed automatically in test mode

**UPI testing is recommended because:**
- ✅ Always works in test mode
- ✅ No card number issues
- ✅ Faster testing
- ✅ Tests the same payment flow

---

## 📋 Testing Checklist

- [ ] Using Test Keys (`rzp_test_...`)
- [ ] Backend server restarted after setting keys
- [ ] Razorpay dashboard shows "Test Mode"
- [ ] Try UPI payment method (recommended)
- [ ] If using cards, try Mastercard: `5267 3181 8797 5449`
- [ ] Check Razorpay dashboard for payment method settings

---

## 🆘 Still Getting "International Cards Not Supported"?

### Option 1: Use UPI (Recommended)
Just switch to UPI payment method - it works every time!

### Option 2: Check Card Settings in Dashboard
1. Login to Razorpay Dashboard
2. Settings → Configuration → Payment Methods
3. Check card-related settings
4. Contact Razorpay support if needed

### Option 3: Contact Razorpay Support
If UPI also doesn't work, contact Razorpay support:
- Email: support@razorpay.com
- Dashboard: Settings → Contact Support

---

## ✅ Best Practice: Test with UPI

**For testing checkout flow, use UPI instead of cards:**

1. It's faster
2. It always works
3. It tests the same payment integration
4. No card-related errors

Just select "UPI" in the payment options and use any test UPI ID!







