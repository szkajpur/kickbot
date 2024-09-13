import speakeasy from "@levminer/speakeasy";
import { env } from "../utils/config";
import { Events, Kient } from "kient";
import logger from "../utils/logger";
import { Client, MusicClient } from "youtubei";

export const client = await Kient.create();

await client.api.authentication.login({
    email: env.kickEmail,
    password: env.kickPassword,
    otc: speakeasy.totp({
        secret: env.kick2FA,
        encoding: "base32"
    })
});

export const kickAccount = await client.api.authentication.currentUser();
export const connectedChannel = await client.api.channel.getChannel(env.kickChannel);

export const ytClient = new Client();
export const musicClient = new MusicClient();

if (!kickAccount || !connectedChannel) {
    logger.error("Failed to log in to Kick or connect to the channel.");
    process.exit(1);
} else {
    logger.info("KICK | Logged in as " + kickAccount.username);
};

try {
    await client.ws.channel.listen(connectedChannel.data.id);
    await connectedChannel.connectToChatroom();
    logger.info("KICK | Connected to " + connectedChannel.data.slug + " id: " + connectedChannel.data.id);
} catch (e) {
    logger.error("Failed to connect to websocket.");
    process.exit(1);
}

client.on(Events.Core.WebSocketDisconnected || Events.Core.UnknownEvent, async () => {

    logger.error("Websocket disconnected, attempting to reconnect...");
    const reconnectInterval = 10000;
    const reconnect = async () => {
        try {
            await client.ws.channel.listen(connectedChannel.data.id);
            logger.info("Reconnected to channel " + connectedChannel.data.slug + " websocket.");
        } catch (e) {
            logger.error("Failed to reconnect to websocket. Retrying in 10 seconds...");
            setTimeout(reconnect, reconnectInterval);
        }
    };

    reconnect();
});