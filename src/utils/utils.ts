export const humanizeDate = (date: string) => {
    return new Date(date).toLocaleString();
};

export const fitText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};