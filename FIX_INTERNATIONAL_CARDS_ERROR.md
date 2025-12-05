# 🔧 Fix: "International cards are not supported" Error

## The Problem

You're seeing: **"International cards are not supported. Please contact our support team for help"**

This happens because Razorpay is detecting the test card as an international card and rejecting it.

## ✅ Quick Solution: Use UPI Instead

**The easiest fix is to use UPI for testing instead of cards:**

1. In the Razorpay checkout popup, you'll see multiple payment options
2. **Click on "UPI"** (don't use cards)
3. Enter any test UPI ID: `test@razorpay` or `success@razorpay`
4. Complete payment - it will work!

**Why UPI is better for testing:**
- ✅ Always works in test mode
- ✅ No card detection issues
- ✅ Tests the same payment flow
- ✅ Faster testing

---

## 🔄 Alternative: Try Different Test Cards

If you must test with cards, try these Indian cards:

### Mastercard (Most Reliable):
- **Card:** `5267 3181 8797 5449`
- **CVV:** `123`
- **Expiry:** `12/25` (or any future date)
- **Name:** Any name

### Visa (If Mastercard doesn't work):
- **Card:** `4111 1111 1111 1111`
- **CVV:** `123`
- **Expiry:** `12/25`
- **Name:** Any name

---

## ⚙️ Check Razorpay Dashboard Settings

1. Go to https://dashboard.razorpay.com
2. **Settings** → **Configuration** → **Payment Methods**
3. Ensure **Cards** are enabled
4. Check for any international card restrictions

---

## 🎯 Recommended Testing Flow

1. **Use UPI for testing** (most reliable)
2. If cards are required, use: `5267 3181 8797 5449` (Mastercard)
3. Test UPI ID: `test@razorpay`

---

## 📝 Notes

- The error message shows UPI as an option - use that!
- Card testing can be finicky in test mode
- UPI testing is more reliable and faster
- Your payment integration works - it's just a card restriction

---

**TL;DR: Switch to UPI payment method for testing instead of cards!**










