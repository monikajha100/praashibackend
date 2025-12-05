# 🔑 How to Get Your Razorpay Test Keys

## ⚠️ Important Note

**The Key Secret `thisisasecret` shown in the admin panel is just a PLACEHOLDER.**

You need **YOUR ACTUAL test keys** from **YOUR Razorpay account**. Test keys are unique to each Razorpay account and cannot be shared.

---

## 📋 Step-by-Step: Getting Your Test Keys

### Step 1: Sign Up / Sign In to Razorpay

1. Go to **https://razorpay.com**
2. Click **"Sign Up"** (if you don't have an account) or **"Sign In"**
3. Complete the signup process (it's free for testing)

### Step 2: Access API Keys Section

1. After logging in, you'll see the **Dashboard**
2. Click on **"Settings"** in the left sidebar
3. Click on **"API Keys"** in the settings menu
4. You'll see two sections: **"Test Keys"** and **"Live Keys"**

### Step 3: Get Your Test Keys

**In the "Test Keys" section:**

1. **Key ID** is visible (starts with `rzp_test_`)
   - Example: `rzp_test_1DP5mmOlF5G5ag`
   - **Copy this value**

2. **Key Secret** is hidden by default
   - Click the **"Reveal"** button next to Key Secret
   - A long string will appear (usually 30-40 characters)
   - **Copy the ENTIRE string** - it should look like: `abc123def456ghi789jkl012mno345pqr678`
   - ⚠️ **IMPORTANT:** Copy the FULL secret, no spaces, no quotes

### Step 4: Save Your Test Keys Securely

- **Key ID:** `rzp_test_xxxxxxxxxxxxx` (you can see this anytime)
- **Key Secret:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (copy it NOW - you can regenerate it later if needed)

---

## 🚀 Setting Up Test Keys in Your Application

Once you have your real test keys:

### Option 1: Using the Setup Script (Recommended)

```bash
cd backend
node setup-razorpay-keys.js rzp_test_YOUR_KEY_ID YOUR_KEY_SECRET
```

**Example:**
```bash
node setup-razorpay-keys.js rzp_test_1DP5mmOlF5G5ag abc123def456ghi789jkl012mno345pqr678
```

### Option 2: Using Admin Panel

1. Go to your admin panel: `/admin/payment-settings`
2. Enter your **real** Key ID and Key Secret
3. Click "Save Settings"

### Option 3: Direct Database Update (if needed)

```sql
UPDATE company_settings 
SET setting_value = 'rzp_test_YOUR_KEY_ID' 
WHERE setting_key = 'razorpay_key_id';

UPDATE company_settings 
SET setting_value = 'YOUR_KEY_SECRET' 
WHERE setting_key = 'razorpay_key_secret';
```

---

## ✅ Verify Your Keys

After setting up, verify everything works:

```bash
cd backend
node test-razorpay-config.js
```

You should see:
- ✅ Key ID format is correct
- ✅ Key Secret length looks okay (30+ characters)
- ✅ Razorpay instance created successfully
- ✅ Test order created successfully

---

## 🧪 Testing with Test Keys

Once your real test keys are set up:

1. **Test Cards (Success):**
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Any future date (e.g., `12/25`)

2. **Test Cards (Failure):**
   - Insufficient Funds: `4000 0000 0000 9995`
   - Card Declined: `4000 0000 0000 0069`

---

## ⚠️ Common Mistakes

### ❌ Wrong: Using placeholder text
```
Key Secret: thisisasecret
```
**This is just an example, not a real secret!**

### ✅ Correct: Using your actual secret
```
Key Secret: abc123def456ghi789jkl012mno345pqr678stu901vwx234
```
**This is the real secret from YOUR Razorpay account**

---

## 🆘 Don't Have a Razorpay Account?

1. **Sign up for free** at https://razorpay.com
2. **No credit card required** for test mode
3. **Complete verification** (takes a few minutes)
4. **Get your test keys** from Settings → API Keys

**Note:** You can test payments without any payment! Test keys don't charge real money.

---

## 📞 Still Having Issues?

If you're still getting authentication errors after setting real keys:

1. **Double-check:**
   - Key Secret has NO spaces
   - Key Secret is the FULL string (30+ characters)
   - Both Key ID and Key Secret are from the SAME Razorpay account
   - Both are from "Test Keys" section (not Live Keys)

2. **Restart your backend server** after updating keys

3. **Run the test script:**
   ```bash
   node test-razorpay-config.js
   ```

4. **Check the error message** - it will tell you exactly what's wrong

---

## 🔒 Security Reminders

- ✅ **Test keys are safe** - they don't charge real money
- ✅ **Test keys are free** - no credit card needed
- ⚠️ **Never commit keys** to version control
- ⚠️ **Use test keys** only in development
- ⚠️ **Don't share your keys** publicly

---

## Quick Reference

| What | Where to Find |
|------|---------------|
| Razorpay Dashboard | https://dashboard.razorpay.com |
| API Keys Page | Dashboard → Settings → API Keys |
| Test Key ID | Visible in "Test Keys" section |
| Test Key Secret | Click "Reveal" in "Test Keys" section |

**Remember:** The placeholders (`thisisasecret`) won't work! You need your REAL keys from YOUR Razorpay account.





