// notificationsService.js  (أنشئ ملفًا جديدًا أو عدّل الموجود)
const axios = require('axios');

/**
 * إرسال إشعارات عبر Expo Push API
 * - tokens: array of Expo push tokens (ExponentPushToken[...])
 * - title, message: نص الإشعار
 *
 * ملاحظة: Expo يسمح بإرسال حتى 100 رسالة لكل طلب إلى /push/send
 */

const CHUNK_SIZE = 100; // Expo limit per request

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const buildMessages = (tokens, title, message, data = {}) =>
  tokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body: message,
    data
  }));

const sendPushNotification = async (tokens, title, message, data = {}) => {
  if (!tokens || !tokens.length) {
    console.log('⚠️ لا يوجد أي Expo Push Tokens للإرسال');
    return { success: [], failures: [] };
  }

  console.log('📲 عدد الأجهزة المستهدفة:', tokens.length);

  const chunks = chunkArray(tokens, CHUNK_SIZE);
  const allResults = {
    success: [],
    failures: []
  };

  for (const chunk of chunks) {
    const messages = buildMessages(chunk, title, message, data);

    try {
      const response = await axios.post(
        'https://exp.host/--/api/v2/push/send',
        messages,
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );

      // response.data قد يحتوي على array من النتائج أو حقل data
      // عادة يحصل body.data حيث يوجد كل نتيجة لكل رسالة
      const resData = response.data;
      console.log('✅ Expo response chunk:', JSON.stringify(resData).slice(0, 1000)); // منع طباعة ضخمة

      // إذا كان resData.errors أو similar، سجّلها. لكن عادةً resData عبارة عن array من receipts
      // سنتفح resData لمعرفة الأخطاء الشائعة
      if (Array.isArray(resData)) {
        // خذ كل نتيجة مرتبطة بالتوكن في نفس الترتيب
        resData.forEach((r, idx) => {
          const token = chunk[idx];
          if (r.status === 'ok' || r.ok) {
            allResults.success.push({ token, result: r });
          } else {
            allResults.failures.push({ token, result: r });
          }
        });
      } else if (resData.data && Array.isArray(resData.data)) {
        resData.data.forEach((r, idx) => {
          const token = chunk[idx];
          if (r.status === 'ok') {
            allResults.success.push({ token, result: r });
          } else {
            allResults.failures.push({ token, result: r });
          }
        });
      } else {
        // fallback: سجّل الرد الكامل
        console.log('⚠️ رد Expo غير متوقع الشكل:', JSON.stringify(resData).slice(0, 1000));
      }

    } catch (err) {
      console.error('❌ خطأ أثناء إرسال دفعة إلى Expo:', err?.response?.data || err.message);
      // في حالة فشل الشبكة، اعتبر جميع التوكنات في تلك chunk كفشل مؤقت
      chunk.forEach((token) => allResults.failures.push({ token, result: { error: err?.message || 'Network error' } }));
    }
  }

  console.log(`🔔 إرسال: نجاح ${allResults.success.length} — فشل ${allResults.failures.length}`);
  return allResults;
};

module.exports = { sendPushNotification };
