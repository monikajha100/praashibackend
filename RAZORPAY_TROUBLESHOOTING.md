# Razorpay Payment Integration Troubleshooting Guide

## 🔍 Issue: Payment Error 500 - Request failed with status code 500

### Common Causes and Solutions

#### 1. **Razorpay Keys Not Configured**

**Symptom:** Error message about missing credentials

**Solution:**
1. Get your Razorpay test keys from https://dashboard.razorpay.com
   - Go to Settings → API Keys
   - Copy Test Key ID (starts with `rzp_test_`)
   - Copy Test Key Secret

2. Set keys in database using the setup script:
```bash
cd backend
node setup-razorpay-keys.js rzp_test_YOUR_KEY_ID YOUR_KEY_SECRET
```

3. Or manually update the database:
```sql
INSERT INTO company_settings (setting_key, setting_value)
VALUES 
  ('razorpay_key_id', 'rzp_test_YOUR_KEY_ID'),
  ('razorpay_key_secret', 'YOUR_KEY_SECRET'),
  ('razorpay_enabled', 'true')
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  updated_at = CURRENT_TIMESTAMP;
```

#### 2. **Invalid Razorpay Keys**

**Symptom:** Authentication errors (401 status code)

**Solution:**
1. Verify your keys are correct:
   ```bash
   node test-razorpay-config.js
   ```

2. Make sure you're using TEST keys for testing:
   - Test Key ID starts with `rzp_test_`
   - Test Key Secret should be the full secret from dashboard

3. Check that keys are correctly saved in database:
   ```sql
   SELECT setting_key, setting_value 
   FROM company_settings 
   WHERE setting_key IN ('razorpay_key_id', 'razorpay_key_secret');
   ```

#### 3. **Amount Issues**

**Symptom:** Invalid payment request errors

**Solution:**
- Minimum amount is ₹1.00 (100 paise)
- Amount must be a valid positive number
- Check that amount is being sent correctly from frontend

#### 4. **Server Not Restarted**

**Symptom:** Changes to keys not taking effect

**Solution:**
After updating Razorpay keys:
1. Restart your backend server
2. The Razorpay instance is cached, so restart is required

#### 5. **Database Connection Issues**

**Symptom:** Cannot fetch settings from database

**Solution:**
1. Check database connection:
   ```bash
   node test-razorpay-config.js
   ```

2. Verify database credentials in `backend/env.local` or environment variables

## 🔧 Diagnostic Tools

### Test Razorpay Configuration
```bash
cd backend
node test-razorpay-config.js
```

This script will:
- ✅ Check if keys exist in database
- ✅ Validate key format
- ✅ Test Razorpay instance creation
- ✅ Test creating a test order
- ✅ Provide detailed error messages if something fails

### Set Up Razorpay Keys
```bash
cd backend
node setup-razorpay-keys.js rzp_test_YOUR_KEY_ID YOUR_KEY_SECRET
```

### Check Backend Logs
Look for these log messages in your backend console:
- `=== RAZORPAY CREATE ORDER REQUEST ===`
- `Razorpay settings from DB:`
- `Razorpay config:`
- `=== RAZORPAY ERROR ===`

## 📋 Testing Checklist

- [ ] Razorpay test keys are set in database
- [ ] Keys are in correct format (rzp_test_...)
- [ ] Backend server has been restarted after setting keys
- [ ] Test configuration script passes: `node test-razorpay-config.js`
- [ ] Amount is at least ₹1.00
- [ ] Using correct test cards (see below)

## 🧪 Test Card Details

### Success Cards
- **Visa:** `4111 1111 1111 1111`
- **Mastercard:** `5555 5555 5555 4444`
- **CVV:** Any 3 digits (e.g., `123`)
- **Expiry:** Any future date (e.g., `12/25`)

### Failure Cards (for testing error handling)
- **Insufficient Funds:** `4000 0000 0000 9995`
- **Card Declined:** `4000 0000 0000 0069`

## 🚀 Getting Your Razorpay Test Keys

1. Sign up/Login at https://razorpay.com
2. Go to Dashboard → Settings → API Keys
3. Under "Test Keys" section, you'll see:
   - **Key ID:** `rzp_test_xxxxxxxxxxxxx`
   - **Key Secret:** Click "Reveal" to see it
4. Copy both and use the setup script above

## 🔒 Security Notes

- ⚠️ **Never commit keys to version control**
- ⚠️ **Use test keys only in development**
- ⚠️ **Keep production keys secure**
- ✅ Test keys work only in test mode
- ✅ No real money is charged with test keys

## 📞 Still Having Issues?

1. Check backend console for detailed error logs
2. Run diagnostic script: `node test-razorpay-config.js`
3. Verify keys in database using SQL query above
4. Ensure backend server is restarted after key changes
5. Check Razorpay dashboard for any account issues

## Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Razorpay credentials not configured" | Keys missing from DB | Run setup script |
| "Invalid Razorpay Key ID format" | Wrong key format | Check key starts with `rzp_test_` |
| "Payment gateway error" | Razorpay API error | Check error details in logs |
| "Authentication failed" | Invalid keys | Verify keys in Razorpay dashboard |







