const { WebhookClient } = require("discord.js");
const request = require("request-promise");

const config = require("./config.json");

var client = null;

if (config.webhookId && config.webhookToken) {
    client = new WebhookClient({id: config.webhookId, token: config.webhookToken});
}

const binaryTypes = ["WindowsPlayer", "WindowsStudio", "WindowsStudio64", "MacPlayer", "MacStudio", "AndroidPlayer", "iOSPlayer"];
const publicChannels = new Map();

const checkChannel = (channel) => {
    if (!channel) return null;

    return new Promise(async (resolve, reject)=>{
        try {
            await request.get(`https://clientsettings.roblox.com/v2/client-version/WindowsPlayer/channel/${channel}`);

            if (publicChannels.get(channel)) return null;

            var versionsDetails = "";

            for (let binaryType of binaryTypes) {
                try {
                    const binaryReleaseInfo = await request.get(`https://clientsettings.roblox.com/v2/client-version/${binaryType}/channel/${channel}`, {
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                        },
                        json: true
                    });

                    versionsDetails += `\n- ${binaryType}: ${binaryReleaseInfo.clientVersionUpload} (${binaryReleaseInfo.version})`;
                } catch (err) {
                    versionsDetails += `\n- ${binaryType}: unavailable.`;
                }
            }

            if (client) client.send(`[${channel}] CHANNEL IS PUBLIC!${versionsDetails}`);
            console.log(`[${channel}] Channel is public!${versionsDetails}`);

            publicChannels.set(channel, "public");
        } catch (err) {
            if (err.response.statusCode == 401 && publicChannels.get(channel)) {
                publicChannels.delete(channel);
                if (client) client.send(`||@everyone|| [${channel}] CHANNEL IS NOW PRIVATE!`);
                console.log(`[${channel}] CHANNEL IS NOW PRIVATE!`);
            }
        } finally {
            resolve();
        }
    });
};

(async ()=>{
    console.log("RbxChannelPrivacyHunter.js\n.:Developer: @Mast3rGamers:.\n");

    while (true) {
        let channelList = await request.get("https://raw.githubusercontent.com/bluepilledgreat/Roblox-DeployHistory-Tracker/main/ChannelsAll.json", { json: true });
        let checkPromises = []
        
        for (let channel of channelList) {
            const resultPromise = await checkChannel(channel.toLocaleLowerCase());
            checkPromises.push(resultPromise);
        }
        
        await Promise.all(checkPromises);
        await new Promise((resolve, reject) => { setTimeout(resolve, 11000) });
    }
})();
