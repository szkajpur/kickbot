import axios from "axios";
import { accents } from "../utils/constants";
import logger from "../utils/logger";
import { env } from "../utils/config";

export const banphraseCheck = async function (text: string) {

    let banned = true;

        do {
            try {
                const { data } = await axios.post(env.pajbotApi + "/api/v1/banphrases/test", { message: text });
                banned = data.banned;
                if (banned) {

                    const banphraseData = data.banphrase_data;
                    const phrase = banphraseData.phrase;
                    const caseSensitive = banphraseData.case_sensitive;
                    const operator = banphraseData.operator;
                    const removeAccents = banphraseData.remove_accents;

                    let regex;

                    switch (operator) {
                        case "regex": regex = phrase; break;
                        case "contains": regex = escapeRegex(phrase); break;
                        case "startswith": regex = `^${escapeRegex(phrase)}`; break;
                        case "endswith": regex = `${escapeRegex(phrase)}$`; break;
                        case "exact": regex = `^${escapeRegex(phrase)}$`; break;
                    }

                    let flags = "g";
                    if (!caseSensitive) flags += "i";
                    if (removeAccents) text = text.normalize("NFD").replace(accents, "");

                    const phraseRegex = new RegExp(regex, flags);
                    const censoredText = text.replace(phraseRegex, "***");
                    text = censoredText;
                }
            } catch (e) {
                logger.error("Failed to check banphrase.");
                break;
            } 
        } while (banned);

    return text;
}

function escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}