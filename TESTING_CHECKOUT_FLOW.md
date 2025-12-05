# ✅ How to Test Checkout Flow (Step by Step)

## 🎯 Recommended: Use UPI for Testing

**This is the easiest and most reliable method:**

1. **Add items to cart** and go to checkout
2. **Select "Online Payment (Razorpay)"** as payment method
3. **Fill in customer details** and click "Pay Now"
4. **Razorpay payment popup opens**
5. **Don't enter card details** - instead:
   - **Click on "UPI" tab** (you'll see Cards, UPI, Net Banking, etc.)
   - **Enter UPI ID:** `test@razorpay` or `success@razorpay`
   - **Click "Verify & Pay"** or "Pay"
6. **Payment succeeds automatically!** ✅

---

## 🃏 Alternative: Test with Cards (If Needed)

If you must test with cards:

### Mastercard (Most Reliable):
- **Card Number:** `5267 3181 8797 5449`
- **CVV:** `123`
- **Expiry:** `12/25` (or any future date)
- **Name:** Any name

### If You See "International Cards Not Supported":
1. **Switch to UPI** (recommended solution)
2. Or try the Mastercard above
3. Or check Razorpay dashboard → Settings → Payment Methods

---

## 📋 Complete Testing Steps

1. ✅ **Keys are set** (run `node check-razorpay-keys.js`)
2. ✅ **Backend server restarted** (important!)
3. ✅ **Go to checkout** in your frontend
4. ✅ **Select Razorpay payment**
5. ✅ **Use UPI** with `test@razorpay`
6. ✅ **Payment succeeds** and order is created

---

## 🆘 Troubleshooting

### "International cards are not supported"
→ **Use UPI instead!** It always works.

### Payment popup doesn't open
→ Check browser console for errors
→ Verify backend is running and receiving requests

### Authentication errors
→ Verify keys are correct (`node test-razorpay-config.js`)
→ Restart backend server

---

## 💡 Pro Tip

**For fastest testing, always use UPI:**
- UPI ID: `test@razorpay`
- Works every time
- Tests the same payment flow
- No card-related errors







