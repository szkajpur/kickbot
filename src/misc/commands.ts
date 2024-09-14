import logger from "../utils/logger";
import { kickAccount } from "./connections";
import { invisChars, ytPattern, seAPI } from "../utils/constants";
import getVideoId from 'get-video-id';
import { ytClient, musicClient } from "./connections";
import axios from "axios";
import { env } from "../utils/config";
import { sendMsg } from "./send";
import { performance } from "perf_hooks";
import { client } from "./connections";

const cooldowns = new Map<string, number>();

axios.defaults.headers.common["Authorization"] = `Bearer ${env.seJWToken}`;

export const handle = async function (msg: { data: { id: any; sender: { id: any; username: any; identity: { color: any; }; }; chatroom_id: any; content: any; type: any; created_at: any; }; }, admin: boolean) {

    const received = performance.now();

    const liveStatus = await client.api.channel.getLivestream(env.kickChannel);

    const msgData = {
        id: parseInt(msg.data.id),
        sender: {
            id: parseInt(msg.data.sender.id),
            username: msg.data.sender.username,
            color: msg.data.sender.identity.color
            
        },
        chatroom_id: parseInt(msg.data.chatroom_id),
        content: msg.data.content,
        type: msg.data.type,
        created_at: msg.data.created_at, received
    };

    if (msgData.sender.id === kickAccount.id) return;

    msgData.content = msgData.content.replace(invisChars, "");
    const args = msgData.content.split(/\s+/);
    
    if (msgData.content.startsWith("!") && msgData.type === "message") {
        switch (args[0].toLowerCase()) {
            case "!ping":
                const rtt = (performance.now() - received).toFixed(3);
                await sendMsg(msgData.chatroom_id, `🤖 Pong! RTT: ${rtt}ms`);
                break;
            case "!sr":
                if (liveStatus.data === undefined) {
                    await sendMsg(msgData.chatroom_id, `🎵 Cannot queue songs while stream is offline.`);
                    return;
                }
                if (args.length < 2) {
                    await sendMsg(msgData.chatroom_id, `🎵 Usage: !sr <YouTube link>`);
                    return;
                };
                const query = args[1];
                if (!ytPattern.test(query)){
                    const search = args.slice(1).join(" ");
                    const results = await musicClient.search(search, "song",);
                    if (!results.items.length) {
                        await sendMsg(msgData.chatroom_id, `🎵 Failed to fetch search results.`);
                        return;
                    }
                    const video = results.items[0];
                    try {
                        await axios.post(seAPI + "/songrequest/" + env.seChannelId + "/queue", { video: video.id })
                        await sendMsg(msgData.chatroom_id, `🎵 Queued video: ${video.title} by ${video.artists[0].name} `);
                    } catch (e) {
                        await sendMsg(msgData.chatroom_id, `🎵 Failed to queue video.`);
                        return;
                    }
                    break;
                }
                try {
                    const { id } = getVideoId(query);
                    if (!id || id === undefined) {
                        await sendMsg(msgData.chatroom_id, `🎵 Invalid YouTube link provided.`);
                        return;
                    }
                    const video = await ytClient.getVideo(id);
                    if (!video || video === undefined) {
                        await sendMsg(msgData.chatroom_id, `🎵 Failed to fetch video.`);
                        return;
                    }
                    await axios.post(seAPI + "/songrequest/" + env.seChannelId + "/queue", { video: video.id })
                    await sendMsg(msgData.chatroom_id, `🎵 Queued video: ${video.title} by ${video.channel.name}`);
                } catch (e) {
                    await sendMsg(msgData.chatroom_id, `🎵 Failed to queue video.`);
                    return;
                }
                break;
            case "!song":
                try {
                    const song = await axios.get(seAPI + "/songrequest/" + env.seChannelId + "/playing");
                    if (!song.data.title) {
                        await sendMsg(msgData.chatroom_id, `🎵 No song currently playing.`);
                        return;
                    }
                    await sendMsg(msgData.chatroom_id, `🎵 Currently playing: ${song.data.title} by ${song.data.channel}`);
                } catch (e) {
                    await sendMsg(msgData.chatroom_id, `🎵 Failed to fetch current song.`);
                    return;
                }
                break;
            case "!next": 
                try {
                    const song = await axios.get(seAPI + "/songrequest/" + env.seChannelId + "/next");
                    if (!song.data.song.title) {
                        await sendMsg(msgData.chatroom_id, `🎵 No song currently queued.`);
                        return;
                    }
                    await sendMsg(msgData.chatroom_id, `🎵 Next song: ${song.data.song.title} by ${song.data.song.channel}`)
                } catch (e) {
                    await sendMsg(msgData.chatroom_id, `🎵 Failed to fetch next song.`);
                    return;
                }
                break;
            case "!pause":
            case "!play":
                if (!admin) return;
                const action = args[0].toLowerCase() === "!play" ? "play" : "pause";
                try {
                    await axios.post(seAPI + "/songrequest/" + env.seChannelId + "/player/" + action);
                    await sendMsg(msgData.chatroom_id, `🎵 ${action.charAt(0).toUpperCase() + action.slice(1)}ed song.`);
                } catch (e) {
                    await sendMsg(msgData.chatroom_id, `🎵 Failed to ${action} song.`);
                    return;
                }
                break;
            case "!#playsound":
                if (args.length < 2) {
                    await sendMsg(msgData.chatroom_id, `🔊 Usage: !#playsound <sound>`);
                    return;
                }
                const sound = args[1];
                const cooldownKey = `playsound`;
                const lastUsed = cooldowns.get(cooldownKey);
                const now = Date.now();
                const cooldownTime = 3 * 60 * 1000; // 3 minutes in milliseconds

                if (lastUsed && now - lastUsed < cooldownTime) {
                    const remainingTime = ((cooldownTime - (now - lastUsed)) / 1000).toFixed(0);
                    await sendMsg(msgData.chatroom_id, `🔊 Please wait ${remainingTime} seconds before using this command again.`);
                    return;
                }

                try {
                    const response = await axios.post(env.pajbotApi + "/api/v1/playsound/" + sound + "/play", {}, {
                        headers: {
                            "x-csrftoken": env.pajbotCsrfToken,
                            "x-requested-with": "XMLHttpRequest",
                            "cookie": `session=${env.pajbotSession}`,
                            "Referer": env.pajbotApi + "/admin/playsounds",
                            "Referrer-Policy": "strict-origin-when-cross-origin"
                        }
                    });
                    cooldowns.set(cooldownKey, now);
                    await sendMsg(msgData.chatroom_id, `🔊 Playing sound: ${sound}`);
                } catch (e) {
                    await sendMsg(msgData.chatroom_id, `🔊 Failed to play ${sound} sound.`);
                    return;
                }
                break;
            default:
                break;
        }
        logger.info(`Command ${args[0].toLowerCase()} executed by ${msgData.sender.username}`);
    }

};
