const { WebhookClient } = require("discord.js");
const request = require("request-promise");

const config = require("./config.json");

var client = null;

if (config.webhookId && config.webhookToken) {
    client = new WebhookClient({id: config.webhookId, token: config.webhookToken});
}

const publicChannels = new Map();

const checkChannel = (channel) => {
    if (!channel) return null;

    return new Promise(async (resolve, reject)=>{
        try {
            await request.get(`https://clientsettings.roblox.com/v2/client-version/WindowsPlayer/channel/${channel}`);

            if (publicChannels.get(channel)) return null;

            publicChannels.set(channel, "public");
            if (client) client.send(`[${channel}] CHANNEL IS PUBLIC!`);
            console.log(`[${channel}] Channel is public!`);
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
