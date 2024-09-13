import { Events } from "kient";
import { client } from "./misc/connections";
import { handle } from "./misc/commands";


client.on(Events.Chatroom.Message, async (msg) => {

    if (msg.chatterIs("broadcaster") || msg.chatterIs("moderator")) {
        await handle(msg, true);
        return;
    }
    await handle(msg, false);
    
});