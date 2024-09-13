import { client } from "./connections";
import { invisChars } from "../utils/constants";
import { banphraseCheck } from "./pajbot";
import logger from "../utils/logger";
import { fitText } from "../utils/utils";

export const sendMsg = async function ( chatroom_id: number, content: string ) {

    try {
        content = content.replace(invisChars, "");
        content = fitText(content, 400);
        content = await banphraseCheck(content);

        await client.api.chat.sendMessage(chatroom_id, content);
    } catch (e) {
        logger.error("Failed to send message." + e);
    }

} 