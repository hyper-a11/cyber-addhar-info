const express = require('express');
const axios = require('axios');
const { DateTime } = require('luxon');

const app = express();
const PORT = process.env.PORT || 3000;
const OWNER_NAME = "ZEXX_OWNER";

// 🔑 Multiple Keys Database
const KEYS_DB = {
  "ZEXX@_VIP": { expiry: "2027-12-31", status: "Premium" },
  "OWNER_TEST": { expiry: "2035-12-30", status: "Trial" },
  "ZEXX_@TRY": { expiry: "2026-06-15", status: "Basic" },
  "ZEXX_P@ID": { expiry: "2026-04-01", status: "Premium" }
};

app.use(express.json());

// 🔎 Aadhaar Search Endpoint
app.get('/search', async (req, res) => {
  const { aadharNumber, key } = req.query;

  // 1️⃣ Key Validation
  if (!key || !KEYS_DB[key]) {
    return res.status(401).json({
      success: false,
      message: 'Invalid Key!',
      owner: OWNER_NAME
    });
  }

  // 2️⃣ Expiry Check
  const today = DateTime.local();
  const expiryDate = DateTime.fromISO(KEYS_DB[key].expiry);
  const daysLeft = Math.ceil(expiryDate.diff(today, 'days').days || 0);

  if (today > expiryDate) {
    return res.status(403).json({
      success: false,
      message: 'Key Expired!',
      expiry_date: KEYS_DB[key].expiry,
      owner: OWNER_NAME
    });
  }

  // 3️⃣ Aadhaar Validation (basic 12-digit check)
  if (!aadharNumber || !/^\d{12}$/.test(aadharNumber)) {
    return res.status(400).json({
      success: false,
      message: 'Valid 12-digit Aadhaar number required',
      owner: OWNER_NAME
    });
  }

  try {
    // 🔥 External API Call (Updated format)
    const response = await axios.get(
      'https://akash-addhar-or-phone-info-api.vercel.app/search',
      {
        params: {
          aadharNumber: aadharNumber,
          key: 'AKASH_PAID31DAYS'
        },
        timeout: 10000
      }
    );

    const apiData = response.data || {};

    // 🔁 Replace owner field if exists inside data
    if (apiData?.data?.owner) {
      apiData.data.owner = 'CYBER×CHAT';
    }

    return res.json({
      success: true,
      owner: OWNER_NAME,
      plan: KEYS_DB[key].status,
      days_left: daysLeft,
      data: apiData.data || apiData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'External API Error',
      error: error.message,
      owner: OWNER_NAME
    });
  }
});

// 🏠 Home Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Running Successfully 🚀',
    owner: OWNER_NAME
  });
});

// 🚀 Serverless entry-point (Vercel)
module.exports = app;
