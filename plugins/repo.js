import axios from "axios";
import config from '../config.cjs';

const repo = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";
  const args = m.body.slice(prefix.length).trim().split(/ +/).slice(1);

  if (["repo", "sc", "script", "info"].includes(cmd)) {
    const githubRepoURL = "https://github.com/legend30-web/GALAXY-MD";
    const channelURL = "https://whatsapp.com/channel/0029VbAve6TFnSzF6VkEce2S";
    const supportURL = "https://chat.whatsapp.com/DIpnxyUiHkr3aZ92A16zT5?mode=ems_copy_t";

    try {
      const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
      const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}`);

      if (!response.data) {
        throw new Error("GitHub API request failed.");
      }

      const repoData = response.data;
      const formattedInfo = `*BOT NAME:*\n> ${repoData.name}\n\n*OWNER NAME:*\n> ${repoData.owner.login}\n\n*STARS:*\n> ${repoData.stargazers_count}\n\n*FORKS:*\n> ${repoData.forks_count}\n\n*GITHUB LINK:*\n> ${repoData.html_url}\n\n*DESCRIPTION:*\n> ${repoData.description || "No description"}\n\n*Don't Forget To Star and Fork Repository*\n\n> *© GALAXY-MD 🖤*`;

      // Create buttons
      const buttons = [
        {
          buttonId: `${prefix}sendaudio`,
          buttonText: { displayText: "🔊 Send Audio" },
          type: 1
        },
        {
          buttonId: `${prefix}joinchannel`,
          buttonText: { displayText: "📢 Join Channel" },
          type: 1
        },
        {
          buttonId: `${prefix}support`,
          buttonText: { displayText: "Join Group 🚀" },
          type: 1
        }
      ];

      // Send message with buttons
      await gss.sendMessage(
        m.from,
        {
          image: { url: "https://files.catbox.moe/k07bn6.jpg" },
          caption: formattedInfo,
          buttons: buttons,
          headerType: 1
        },
        { quoted: m }
      );

    } catch (error) {
      console.error("Error in repo command:", error);
      m.reply("Sorry, something went wrong while fetching the repository information. Please try again later.");
    }
  }

  // Handle button responses - This should be outside the command check
  if (m.message?.buttonsResponseMessage) {
    const selectedButtonId = m.message.buttonsResponseMessage.selectedButtonId;
    
    if (selectedButtonId === `${prefix}sendaudio`) {
      try {
        await gss.sendMessage(
          m.from,
          {
            audio: { url: "https://files.catbox.moe/ooqm90.mp3" },
            mimetype: "audio/mp4",
            ptt: true
          },
          { quoted: m }
        );
      } catch (error) {
        console.error("Error sending audio:", error);
        m.reply("Failed to send audio. Please try again.");
      }
    }
    else if (selectedButtonId === `${prefix}joinchannel`) {
      // Send channel link
      m.reply("Join our channel: https://whatsapp.com/channel/0029VbAve6TFnSzF6VkEce2S");
    }
    else if (selectedButtonId === `${prefix}support`) {
      // Send support group link
      m.reply("Join our support group: https://chat.whatsapp.com/DIpnxyUiHkr3aZ92A16zT5?mode=ems_copy_t");
    }
  }
};

export default repo;
