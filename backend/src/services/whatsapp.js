const axios = require('axios');

const META_API_URL = 'https://graph.facebook.com/v19.0';

const Settings = require('../models/Settings');

/**
 * Check if we're in test mode (console.log instead of sending to Meta)
 */
function isTestMode() {
  return process.env.TEST_MODE === 'true';
}

/**
 * Get WhatsApp API config from env or settings
 */
async function getConfig() {
  const settings = await Settings.getSettings();
  return {
    accessToken: settings.metaAccessToken || process.env.META_ACCESS_TOKEN,
    phoneNumberId: settings.metaPhoneNumberId || process.env.META_PHONE_NUMBER_ID,
  };
}

/**
 * Send a plain text message via WhatsApp
 */
async function sendTextMessage(phone, text) {
  if (isTestMode()) {
    console.log(`\n📤 [TEST] Text Message To: ${phone}`);
    console.log(`────────────────────────────`);
    console.log(text);
    console.log(`────────────────────────────\n`);
    return { success: true, test: true };
  }

  const { accessToken, phoneNumberId } = await getConfig();

  if (!accessToken || !phoneNumberId || accessToken.startsWith('your_')) {
    console.log(`[WhatsApp Mock] To: ${phone}\n${text}\n`);
    return { success: true, mock: true };
  }

  try {
    const response = await axios.post(
      `${META_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[WhatsApp] Message sent to ${phone}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[WhatsApp] Error sending text:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Send an interactive List Message (for vegetable selection)
 * Meta Cloud API list message format
 */
async function sendListMessage(phone, headerText, bodyText, buttonText, sections) {
  if (isTestMode()) {
    console.log(`\n📤 [TEST] List Message To: ${phone}`);
    console.log(`────────────────────────────`);
    console.log(`📋 ${headerText}`);
    console.log(bodyText);
    console.log(`Button: [${buttonText}]`);
    sections.forEach(s => {
      console.log(`\n  Section: ${s.title}`);
      s.rows.forEach(r => console.log(`    • ${r.title} — ${r.description}`));
    });
    console.log(`────────────────────────────\n`);
    return { success: true, test: true };
  }

  const { accessToken, phoneNumberId } = await getConfig();

  if (!accessToken || !phoneNumberId || accessToken.startsWith('your_')) {
    console.log(`[WhatsApp Mock] List Message To: ${phone}`);
    console.log(`Header: ${headerText}`);
    console.log(`Body: ${bodyText}`);
    console.log(`Sections:`, JSON.stringify(sections, null, 2));
    return { success: true, mock: true };
  }

  try {
    const response = await axios.post(
      `${META_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'interactive',
        interactive: {
          type: 'list',
          header: {
            type: 'text',
            text: headerText,
          },
          body: {
            text: bodyText,
          },
          action: {
            button: buttonText,
            sections: sections,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[WhatsApp] List message sent to ${phone}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[WhatsApp] Error sending list:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Send an interactive Button Message (for confirm/cancel)
 */
async function sendButtonMessage(phone, bodyText, buttons) {
  if (isTestMode()) {
    console.log(`\n📤 [TEST] Button Message To: ${phone}`);
    console.log(`────────────────────────────`);
    console.log(bodyText);
    console.log(`\n  Buttons: ${buttons.map(b => `[${b.title}]`).join('  ')}`);
    console.log(`────────────────────────────\n`);
    return { success: true, test: true };
  }

  const { accessToken, phoneNumberId } = await getConfig();

  // buttons should be array of { id: string, title: string } — max 3
  const formattedButtons = buttons.map(btn => ({
    type: 'reply',
    reply: { id: btn.id, title: btn.title },
  }));

  if (!accessToken || !phoneNumberId || accessToken.startsWith('your_')) {
    console.log(`[WhatsApp Mock] Button Message To: ${phone}`);
    console.log(`Body: ${bodyText}`);
    console.log(`Buttons:`, buttons);
    return { success: true, mock: true };
  }

  try {
    const response = await axios.post(
      `${META_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: { buttons: formattedButtons },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[WhatsApp] Button message sent to ${phone}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[WhatsApp] Error sending buttons:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Mark incoming message as read
 */
async function markAsRead(messageId) {
  if (isTestMode()) return;

  const { accessToken, phoneNumberId } = await getConfig();

  if (!accessToken || !phoneNumberId || accessToken.startsWith('your_')) return;

  try {
    await axios.post(
      `${META_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[WhatsApp] Error marking read:', error.message);
  }
}

/**
 * Fetch media buffer from Meta API
 */
async function getMediaBuffer(mediaId) {
  // Test mode mock for fake media IDs generated by our test scripts
  if (mediaId.startsWith('media_')) {
    // Returns a simple 1x1 placeholder image for testing UI
    const dummyImage = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return { buffer: dummyImage, mimeType: 'image/gif' };
  }

  const { accessToken } = await getConfig();
  if (!accessToken) throw new Error('No Meta access token');

  // Step 1: Get the media URL
  const metaResponse = await axios.get(
    `${META_API_URL}/${mediaId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const mediaUrl = metaResponse.data.url;
  if (!mediaUrl) throw new Error('Failed to get media URL');

  // Step 2: Download the binary data
  const downloadResponse = await axios.get(mediaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    responseType: 'arraybuffer',
  });

  return {
    buffer: Buffer.from(downloadResponse.data, 'binary'),
    mimeType: downloadResponse.headers['content-type'],
  };
}

module.exports = {
  sendTextMessage,
  sendListMessage,
  sendButtonMessage,
  markAsRead,
  getMediaBuffer,
};
