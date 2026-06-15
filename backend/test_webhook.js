const payload = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1042445081444877",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15556359781",
              "phone_number_id": "1178261698704607"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Divy🙃"
                },
                "wa_id": "917984643964"
              }
            ],
            "messages": [
              {
                "from": "917984643964",
                "id": "wamid.123",
                "timestamp": "1781532972",
                "text": {
                  "body": "Hi"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
};

fetch('https://whatsapp-bot-zcnl.onrender.com/webhook', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(payload)
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
});
