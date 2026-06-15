const express = require('express');
const botController = require('../controllers/botController');

const router = express.Router();

/**
 * GET /webhook — Meta webhook verification
 * Meta sends a GET request with hub.mode, hub.verify_token, and hub.challenge
 */
router.get('/', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const Settings = require('../models/Settings');
  const settings = await Settings.getSettings();
  const verifyToken = settings.metaWebhookVerifyToken || process.env.META_WEBHOOK_VERIFY_TOKEN || 'vegbot123';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook] Verification successful');
    return res.status(200).send(challenge);
  }

  console.error('[Webhook] Verification failed');
  return res.sendStatus(403);
});

/**
 * POST /webhook — Receive incoming WhatsApp messages from Meta
 */
router.post('/', async (req, res) => {
  try {
    const isTestMode = process.env.TEST_MODE === 'true';
    console.log(`[Webhook] isTestMode=${isTestMode}, env.TEST_MODE='${process.env.TEST_MODE}'`);
    if (!isTestMode) res.sendStatus(200);

    const body = req.body;

    // Validate this is a WhatsApp message event
    if (body.object !== 'whatsapp_business_account') {
      if (isTestMode && !res.headersSent) res.sendStatus(200);
      return;
    }

    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const messages = value.messages || [];
        const contacts = value.contacts || [];

        for (const message of messages) {
          const senderPhone = message.from;
          const messageId = message.id;
          const profileName = contacts.find(c => c.wa_id === senderPhone)?.profile?.name || '';

          let messageBody = '';
          let messageType = message.type;

          switch (message.type) {
            case 'text':
              messageBody = message.text?.body || '';
              break;
            case 'image':
              messageBody = message.image?.id || '';
              messageType = 'image';
              break;
            case 'interactive':
              if (message.interactive?.type === 'list_reply') {
                messageBody = message.interactive.list_reply.id;
                messageType = 'interactive';
              } else if (message.interactive?.type === 'button_reply') {
                messageBody = message.interactive.button_reply.id;
                messageType = 'interactive';
              }
              break;
            case 'button':
              messageBody = message.button?.text || message.button?.payload || '';
              break;
            default:
              messageBody = '';
              messageType = 'unsupported';
          }

          if (messageBody || messageType !== 'unsupported') {
            console.log(`[Webhook] Message from ${senderPhone} (${profileName}): ${messageBody} [${messageType}]`);

            if (isTestMode) {
              await botController.handleIncomingMessage(senderPhone, messageBody, messageType, messageId, profileName);
            } else {
              botController.handleIncomingMessage(senderPhone, messageBody, messageType, messageId, profileName)
                .catch(err => console.error('[Webhook] Bot processing error:', err));
            }
          }
        }
      }
    }
    
    if (isTestMode && !res.headersSent) res.sendStatus(200);
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
  }
});

module.exports = router;
