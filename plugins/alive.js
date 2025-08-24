import fs from 'fs';
import config from '../config.cjs';

const alive = async (m, Matrix) => {
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  const timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const prefix = config.PREFIX;
  
  // Check if it's a button response
  const isButtonResponse = m.message?.buttonsResponseMessage;
  
  if (isButtonResponse) {
    const selectedButtonId = m.message.buttonsResponseMessage.selectedButtonId;
    
    if (selectedButtonId === `${prefix}audio`) {
      const audioUrls = [
        ',
        'https://files.catbox.moe/ooqm90.mp3'
      ];

      const randomAudioUrl = audioUrls[Math.floor(Math.random() * audioUrls.length)];
      
      // Send audio
      await Matrix.sendMessage(m.from, {
        audio: { url: randomAudioUrl },
        mimetype: 'audio/mp4',
        ptt: true
      }, { quoted: m });
      
      return; // Exit after sending audio
    } else if (selectedButtonId === `${prefix}owner`) {
      // Handle owner button - replace with your owner info
      await Matrix.sendMessage(m.from, { 
        text: "👤 *Owner Information*\n\nName: Your Name\nContact: your@contact.info" 
      }, { quoted: m });
      return;
    }
  }
  
  // Regular command handling
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (!['alive', 'uptime', 'runtime'].includes(cmd)) return;

  const str = `*🤖 Bot Status: Online*\n*⏳ Uptime: ${timeString}*`;

  const buttons = [
    {
      buttonId: `${prefix}owner`,
      buttonText: { displayText: '👤 Owner' },
      type: 1
    },
    {
      buttonId: `${prefix}audio`,
      buttonText: { displayText: '🎵 Random Audio' },
      type: 1
    }
  ];

  const buttonMessage = {
    image: fs.readFileSync('./media/boniphace.jpg'),
    caption: str,
    footer: 'Choose an option',
    buttons: buttons,
    headerType: 4,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363419723191331@newsletter',
        newsletterName: "GALAXY-XMD",
        serverMessageId: 143
      }
    }
  };

  await Matrix.sendMessage(m.from, buttonMessage, {
    quoted: m
  });
};

export default alive;
