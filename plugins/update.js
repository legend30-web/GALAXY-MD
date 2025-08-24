import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import AdmZip from "adm-zip";

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import config
const configPath = path.join(__dirname, '../config.cjs');
const config = await import(configPath).then(m => m.default || m).catch(() => ({}));

const update = async (m, Matrix) => {
    const prefix = config.PREFIX || '.'; // Default prefix if not in config
    const body = m.body || "";
    const cmd = body.startsWith(prefix)
        ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase()
        : "";

    if (cmd === "update") {
        // Only allow the bot itself to use this command
        const botNumber = await Matrix.decodeJid(Matrix.user.id);
        const sender = m.sender || "";
        if (sender !== botNumber) {
            return Matrix.sendMessage(m.from, { text: "❌ *Only the bot itself can use this command!*" }, { quoted: m });
        }

        try {
            // Add reaction if available
            if (m.React) await m.React("⏳");
            
            console.log("🔄 Checking for updates...");
            const msg = await Matrix.sendMessage(m.from, { text: "```🔍 Checking for updates...```" }, { quoted: m });

            const editMessage = async (newText) => {
                try {
                    await Matrix.sendMessage(m.from, { text: newText, edit: msg.key });
                } catch (error) {
                    console.error("Message edit failed:", error);
                    // Fallback to sending a new message if edit fails
                    await Matrix.sendMessage(m.from, { text: newText }, { quoted: m });
                }
            };

            // Fetch latest commit hash
            const { data: commitData } = await axios.get(
                "https://api.github.com/repos/caseyweb/Caseyrhodes-AI/commits/main"
            );
            const latestCommitHash = commitData.sha;

            // Load package.json
            const packageJsonPath = path.join(process.cwd(), "package.json");
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            const currentHash = packageJson.commitHash || "unknown";

            if (latestCommitHash === currentHash) {
                if (m.React) await m.React("✅");
                await editMessage("```✅ Bot is already up to date! Restarting...```");
                setTimeout(() => process.exit(0), 2000);
                return;
            }

            await editMessage("```🚀 New update found! Downloading...```");

            // Download latest ZIP
            const zipPath = path.join(process.cwd(), "latest.zip");
            const writer = fs.createWriteStream(zipPath);
            
            const response = await axios({
                method: 'get',
                url: "https://github.com/caseyweb/Caseyrhodes-AI/archive/main.zip",
                responseType: 'stream'
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            await editMessage("```📦 Extracting the latest code...```");

            // Extract ZIP
            const extractPath = path.join(process.cwd(), "latest");
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(extractPath, true);

            await editMessage("```🔄 Replacing files...```");

            // Replace files while skipping important configs
            const sourcePath = path.join(extractPath, "Caseyrhodes-AI-main");
            await copyFolderSync(sourcePath, process.cwd(), ['package.json', 'config.cjs', '.env']);

            // Update package.json with new commit hash
            packageJson.commitHash = latestCommitHash;
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

            // Cleanup
            fs.unlinkSync(zipPath);
            fs.rmSync(extractPath, { recursive: true, force: true });

            await editMessage("```♻️ Update complete! Restarting to apply changes...```");
            setTimeout(() => process.exit(0), 2000);

        } catch (error) {
            console.error("❌ Update error:", error);
            if (m.React) await m.React("❌");
            await Matrix.sendMessage(m.from, 
                { text: `❌ Update failed:\n${error.message}` }, 
                { quoted: m }
            );
        }
    }
};

async function copyFolderSync(source, target, filesToSkip = []) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        if (filesToSkip.includes(item)) continue;

        const stat = fs.lstatSync(srcPath);
        if (stat.isDirectory()) {
            await copyFolderSync(srcPath, destPath, filesToSkip);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

export default update;
