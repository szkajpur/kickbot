export const invisChars = new RegExp(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D\uDC00\uDB40]/gu)
export const accents = new RegExp(/[\u0300-\u036f]/g)
export const punctuation = new RegExp(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g)
export const ytPattern = new RegExp(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gm)
export const seAPI = "https://api.streamelements.com/kappa/v2"