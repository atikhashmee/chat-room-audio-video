export default class ManageCookies {
    constructor() {
        this.cookieProperties = {
            userName: null,
            expires: new Date(Date.now() + 20 * 60 * 1000).toUTCString(), 
        };
    }
    makeCookieString(cookieProperties) {
        const entries = Object.entries(cookieProperties);
        return entries.map(([key, value]) => `${key}=${value}`).join("; ");
    }

    checkCookieExists(cookieName) {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split("=");
            if (name === cookieName) {
                return true;
            }
        }
        return false;
    }

    getCookieValue(cookieName) {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split("=");
            if (name === cookieName) {
                return value;
            }
        }
        return null;
    }
}
