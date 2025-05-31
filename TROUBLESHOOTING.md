# SafePath Bronx - Troubleshooting Guide

## Google Maps API Issues

If you're seeing **"Legacy API not enabled"** or other API errors, follow these steps:

### 1. Check Your Google Cloud Console Setup

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Select the correct project** (make sure you're in the right project!)
3. **Enable required APIs:**
   - Maps JavaScript API
   - **Places API (New)** ⚠️ **CRITICAL: Use the NEW version, not legacy**
   - Directions API
   - Geocoding API

### 2. Enable Billing

**This is the most common issue!**

1. Go to [Billing](https://console.cloud.google.com/billing) in Google Cloud Console
2. Make sure billing is enabled for your project
3. Add a payment method if you haven't already

### 3. Enable the NEW Places API (CRITICAL)

**🚨 IMPORTANT:** You MUST enable "Places API (New)" not the legacy version:

1. Go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
2. Search for **"Places API (New)"**
3. Click on **"Places API (New)"** (NOT the old "Places API")
4. Click **"Enable"**

**❌ DO NOT enable the legacy "Places API"** - this will cause errors!

### 4. Check API Key Configuration

1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your API key
3. Click on it to edit
4. **Application restrictions:** Set to "None" for testing, or add `localhost:3000` to HTTP referrers
5. **API restrictions:** Either set to "None" or specifically allow the APIs listed above

### 5. Verify Your API Key

Your API key should:
- Start with `AIza`
- Be about 39 characters long
- Be from the same project where you enabled the APIs

### 6. Common Error Messages

- **"Legacy API not enabled"**: Enable **Places API (New)** instead of legacy Places API
- **"REQUEST_DENIED"**: Usually means billing is not enabled
- **"INVALID_REQUEST"**: Check your API key format
- **"OVER_QUERY_LIMIT"**: You've exceeded your quota (check billing)
- **"ApiProjectMapError"**: APIs not enabled or billing issue

### 7. Still Not Working?

1. **Wait 5-10 minutes** after making changes in Google Cloud Console
2. **Clear your browser cache** and refresh the page
3. **Check the browser console** for detailed error messages
4. **Verify you're using the API key from the correct project**
5. **Double-check you enabled "Places API (New)" not the legacy version**

### 8. Free Tier Limits

Google Maps provides $200 of free usage per month, which includes:
- 28,000 map loads
- 100,000 geocoding requests
- 1,000 Places API requests (New)

This should be more than enough for development and testing.

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Verify all steps above are completed
3. Make sure you're using the API key from the project where billing is enabled
4. **🚨 ENSURE you enabled "Places API (New)" not the legacy version** 
5. Wait 10 minutes after enabling APIs for changes to propagate 