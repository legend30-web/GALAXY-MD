import fs from 'fs';
import config from '../config.cjs';

const handleGreeting = async (m, gss) => {
  try {
    const textLower = m.body?.toLowerCase() || '';

    const triggerWords = [
      'send', 'statusdown', 'take', 'sent', 'giv', 'gib', 'upload',
      'send me', 'sent me', 'znt', 'snt', 'ayak', 'do', 'mee'
    ];

    // Check if message contains any trigger word
    const hasTriggerWord = triggerWords.some(word => textLower.includes(word));
    
    if (hasTriggerWord) {
      if (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo) {
        const quotedMessage = m.message.extendedTextMessage.contextInfo.quotedMessage;

        if (quotedMessage) {
          let mediaUrl;
          let caption = '';

          // Check if it's an image
          if (quotedMessage.imageMessage) {
            caption = quotedMessage.imageMessage.caption || '';
            mediaUrl = await gss.downloadAndSaveMediaMessage(quotedMessage.imageMessage);
            
            await gss.sendMessage(m.from, {
              image: { url: mediaUrl },
              caption: caption,
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 9999,
                isForwarded: true,
              },
            });
          }
          // Check if it's a video
          else if (quotedMessage.videoMessage) {
            caption = quotedMessage.videoMessage.caption || '';
            mediaUrl = await gss.downloadAndSaveMediaMessage(quotedMessage.videoMessage);
            
            await gss.sendMessage(m.from, {
              video: { url: mediaUrl },
              caption: caption,
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 9999,
                isForwarded: true,
              },
            });
          }
          // Clean up the temporary file
          if (mediaUrl && fs.existsSync(mediaUrl)) {
            fs.unlinkSync(mediaUrl);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

export default handleGreeting;
