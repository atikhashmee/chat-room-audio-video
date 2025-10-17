// ManageCookies.ts
// Simple, well-typed cookie utilities for browser environments.

export type CookieAttributes = Partial<{
    path: string;
    domain: string;
    expires: Date | string; // Date object or UTC string
    maxAge: number; // in seconds
    secure: boolean;
    sameSite: 'Lax' | 'Strict' | 'None';
}>;

export interface CookieProperties {
    [key: string]: string | number | boolean | null | undefined;
}

export default class ManageCookies {
    /**
     * Build a cookie key=value string from an object. Skips null/undefined values.
     * Encodes both names and values. No trailing semicolon is added.
     */
    public static makeCookieString(cookieProperties: CookieProperties): string {
        const parts: string[] = [];
        for (const [k, v] of Object.entries(cookieProperties)) {
            if (v === undefined || v === null) continue;
            parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
        }
        return parts.join('; ');
    }

    public static makeAttributesString(attrs?: CookieAttributes): string {
        if (!attrs) return '';
        const parts: string[] = [];
        if (attrs.path) parts.push(`Path=${attrs.path}`);
        if (attrs.domain) parts.push(`Domain=${attrs.domain}`);
        if (attrs.expires) {
            const exp = attrs.expires instanceof Date ? attrs.expires.toUTCString() : String(attrs.expires);
            parts.push(`Expires=${exp}`);
        }
        if (typeof attrs.maxAge === 'number') parts.push(`Max-Age=${Math.floor(attrs.maxAge)}`);
        if (attrs.secure) parts.push('Secure');
        if (attrs.sameSite) parts.push(`SameSite=${attrs.sameSite}`);
        return parts.join('; ');
    }

    public static setCookie(name: string, value: string, attrs?: CookieAttributes): void {
        if (typeof document === 'undefined') return;
        const encoded = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        const attrsStr = this.makeAttributesString(attrs);
        document.cookie = attrsStr ? `${encoded}; ${attrsStr}` : encoded;
    }

    /**
     * Set multiple cookies (one per property) using provided attributes.
     */
    public static setCookies(properties: CookieProperties, attrs?: CookieAttributes): void {
        if (typeof document === 'undefined') return;
        for (const [k, v] of Object.entries(properties)) {
            if (v === undefined || v === null) continue;
            this.setCookie(k, String(v), attrs);
        }
    }

    public static hasCookie(name: string): boolean {
        if (typeof document === 'undefined') return false;
        const encodedName = encodeURIComponent(name) + '=';
        return document.cookie.split(';').some(c => c.trim().startsWith(encodedName));
    }

    public static getCookie(name: string): string | null {
        if (typeof document === 'undefined') return null;
        const encodedName = encodeURIComponent(name) + '=';
        const parts = document.cookie.split(';');
        for (const part of parts) {
            const p = part.trim();
            if (p.startsWith(encodedName)) return decodeURIComponent(p.substring(encodedName.length));
        }
        return null;
    }

    public static deleteCookie(name: string, attrs?: CookieAttributes): void {
        if (typeof document === 'undefined') return;
        const deleteAttrs: CookieAttributes = {
            ...(attrs || {}),
            expires: new Date(0)
        };
        this.setCookie(name, '', deleteAttrs);
    }
}
