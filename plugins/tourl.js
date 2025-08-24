import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

const MAX_FILE_SIZE_MB = 200;

async function uploadMedia(buffer) {
  try {
    const { ext } = await fileTypeFromBuffer(buffer);
    const bodyForm = new FormData();
    bodyForm.append("fileToUpload", buffer, "file." + ext);
    bodyForm.append("reqtype", "fileupload");

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: bodyForm,
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}: ${res.statusText}`);
    }

    const data = await res.text();
    return data;
  } catch (error) {
    console.error("Error during media upload:", error);
    throw new Error('Failed to upload media');
  }
}

const tourl = async (m, bot) => {
  const prefixMatch = m.body.match(/^[\\/!#.]/);
  const prefix = prefixMatch ? prefixMatch[0] : '/';
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const validCommands = ['tourl', 'geturl', 'upload', 'url'];

  if (validCommands.includes(cmd)) {
    if (!m.quoted || !['imageMessage', 'videoMessage', 'audioMessage'].includes(m.quoted.mtype)) {
      return m.reply(`Send/Reply/Quote an image, video, or audio to upload \n*${prefix + cmd}*`);
    }

    try {
      const media = await m.quoted.download();
      if (!media) throw new Error('Failed to download media.');

      const fileSizeMB = media.length / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        return m.reply(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
      }
      
      const mediaUrl = await uploadMedia(media);

      const mediaType = getMediaType(m.quoted.mtype);
      const contextInfo = {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363302677217436@newsletter',
          newsletterName: 'CASEYRHODES-XMD',
          serverMessageId: 143
        }
      };

      // Create buttons with copy functionality
      const buttons = [
        {
          buttonId: `id-copy-${Date.now()}`,
          buttonText: { displayText: '📋 Copy URL' },
          type: 2  // Type 2 is for URL buttons which can copy to clipboard
        },
        {
          buttonId: `${prefix}download`,
          buttonText: { displayText: '⬇️ Download' },
          type: 1
        }
      ];

      // For the copy button, we need to use a URL button with the copy action
      const buttonMessage = {
        text: `*Hey ${m.pushName} Here Is Your Media URL*\n\n*URL:* ${mediaUrl}`,
        footer: 'Click the buttons below to interact',
        buttons: buttons,
        headerType: 1,
        contextInfo: contextInfo
      };

      if (mediaType === 'audio') {
        await bot.sendMessage(m.from, buttonMessage, { quoted: m });
      } else {
        const message = {
          [mediaType]: { url: mediaUrl },
          caption: `*Hey ${m.pushName} Here Is Your Media*\n*URL:* ${mediaUrl}`,
          footer: 'Click the buttons below to interact',
          buttons: buttons,
          headerType: 4,
          contextInfo: contextInfo
        };
        await bot.sendMessage(m.from, message, { quoted: m });
      }

    } catch (error) {
      console.error('Error processing media:', error);
      m.reply('Error processing media.');
    }
  }
};

// Handle the copy button callback
export const handleCopyButton = async (m, bot) => {
  if (m.type === 'buttonsResponseMessage' && m.body.startsWith('id-copy-')) {
    try {
      // Extract the URL from the message text
      const urlMatch = m.message.conversation.match(/\*URL:\* (\S+)/) || 
                       m.message.extendedTextMessage?.text.match(/\*URL:\* (\S+)/);
      
      if (urlMatch && urlMatch[1]) {
        const mediaUrl = urlMatch[1];
        
        // Create a message with the URL that can be easily copied
        await bot.sendMessage(m.from, {
          text: `Here's your URL to copy:\n${mediaUrl}\n\nLong press to copy the text.`,
          mentions: [m.sender]
        }, { quoted: m });
      }
    } catch (error) {
      console.error('Error handling copy button:', error);
    }
  }
};

const getMediaType = (mtype) => {
  switch (mtype) {
    case 'imageMessage':
      return 'image';
    case 'videoMessage':
      return 'video';
    case 'audioMessage':
      return 'audio';
    default:
      return null;
  }
};

export default tourl;
