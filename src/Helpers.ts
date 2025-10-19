
import { User } from './User';
import { Conversation } from './Conversation';
import { ChatMessage } from './ChatMessage';
import { renderMessages } from './RenderMessages';
import { conversationsMap } from './RenderMessages';
import {  getActiveRecipient, getLocalUser } from './RenderUser';
import {  msgInput, chatRecipientElement, chatBox, 
    incomingRingtone, outgoingRingtone, mainchatwrapper, defaultChatMessageBox, outgoingModalElement, incomingModalElement, hangupButton, 
     userNameInput,
    emailInput,
    saveCookieBtn,
    activeModalElement} 
    from "./DomElements";
import $ from 'jquery'; 
import ManageCookies from "./ManageCookies";

type CallType = 'Audio' | 'Video';


export function renderActiveReceipient(): void {
    const activeRecipient = getActiveRecipient();
    if (activeRecipient === null) {
        defaultChatMessageBox.classList.remove('d-none')
        return
    }

    defaultChatMessageBox.classList.add('d-none')
    mainchatwrapper.classList.remove('d-none')

    let newRecipient = activeRecipient
    chatBox.innerHTML = `
        <div class="d-flex flex-column justify-content-center align-items-center h-100 p-5">
            <div class="text-center">
                <div class="spinner-border text-indigo" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading conversation with ${newRecipient.getName()}...</p>
            </div>
        </div>
    `;
    // Introduce a short delay (200ms) to simulate loading
    setTimeout(() => {
        const conversation = conversationsMap.get(newRecipient.getId());
        updateChatHeader(activeRecipient);
        if (conversation) {
            renderMessages(conversation);
        } else {
            renderMessages(new Conversation(""));
        }
    }, 200);
}

export function simulateIncomingCall(callType: CallType, callerName: string): void {
    const callTypeIncoming = document.getElementById('callTypeIncoming') as HTMLElement;
    const callerNameIncoming = document.getElementById('callerNameIncoming') as HTMLElement;
    const callerAvatarIncoming = document.getElementById('callerAvatarIncoming') as HTMLImageElement;

    callTypeIncoming.textContent = callType;
    callerNameIncoming.textContent = callerName;
    
    callerAvatarIncoming.src = "https://placehold.co/100x100/EF4444/ffffff?text=U2";
    if (incomingModalElement) {
        // START AUDIO: Play incoming ringtone 
        // incomingRingtone.play().catch(e => console.error("Could not play incoming ringtone:", e));
        //@ts-ignore
        $(incomingModalElement).modal('show');
    }
}

export function showOutgoingCall(callType: CallType, contact : any): void {
    let activeRecipient = getActiveRecipient()
    // if (!activeRecipient) {
    //     console.error("Cannot initiate call: No active recipient selected.");
    //     return;
    // }
    const recipientName = activeRecipient?.getName() ?? "John Smith";
    
    const callTypeOutgoing = document.getElementById('callTypeOutgoing') as HTMLElement;
    const recipientNameOutgoing = document.getElementById('recipientNameOutgoing') as HTMLElement;
    const callStatusOutgoing = document.getElementById('callStatusOutgoing') as HTMLElement;
    const callerAvatarOutgoing = document.getElementById('callerAvatarOutgoing') as HTMLImageElement;

    callTypeOutgoing.textContent = callType;
    recipientNameOutgoing.textContent = recipientName;
    callStatusOutgoing.textContent = `Calling ${recipientName}...`;
    
    // Get the avatar from the header, which should reflect the active recipient
    const recipientAvatar = document.querySelector('.d-flex.align-items-center.gap-3 img') as HTMLImageElement;
    if (recipientAvatar) {
        callerAvatarOutgoing.src = recipientAvatar.src;
    }

    if (outgoingModalElement) {
        // outgoingRingtone.play().catch(e => console.error("Could not play outgoing ringtone:", e));
        var callOptions = {
            mediaTypeForOutgoingCall :  callType == "Audio" ? 'AUDIO' : 'VIDEO'
        };

        var call = contact.call(null, callOptions);
        if (call !== null) {
            // @ts-ignore
            $(outgoingModalElement).modal('show');
            setCallListeners(call);
            addHangupButton(call.getId());
        } else {
            console.warn("Cannot establish call");
        }
    }
}

export const stopRingtones = (): void => {
    incomingRingtone.pause();
    incomingRingtone.currentTime = 0;
    outgoingRingtone.pause();
    outgoingRingtone.currentTime = 0;
};


export const handleKeypress = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && !msgInput.disabled) {
        e.preventDefault();
        console.log("Enter key pressed, sending message...");
        const activeRecipient = getActiveRecipient();
        sendMessage(activeRecipient, msgInput);
    }
};

export const sendMessage = (activeRecipient: User | null, msgInput : HTMLInputElement): void => {
    const messageText = msgInput.value.trim();
    if (messageText && activeRecipient) {
        console.log(`Sending message to ${activeRecipient.getName()}: ${messageText}`);
        
        const conversation = conversationsMap.get(activeRecipient.getId());

        if (conversation) {
            const newMessage = ChatMessage.create(
                (conversation.getMessages().length + 1).toString(), 
                messageText, 
                getLocalUser()!,
                "text"
            );
            conversation.addMessage(newMessage);
            renderMessages(conversation);
            msgInput.value = ''; 
        } else {
            console.error("Conversation map missing for active recipient.");
        }
    }
};


export const updateChatHeader = (recipient: User ): void => {
    chatRecipientElement.textContent = recipient.getName();
    chatRecipientElement.dataset.userId = recipient.getId();
    const headerAvatar = document.querySelector('.d-flex.align-items-center.gap-3 img') as HTMLImageElement;
    if (headerAvatar) {
            headerAvatar.src = recipient.getId() === "2" 
            ? `https://placehold.co/40x40/EF4444/ffffff?text=U2`
            : recipient.getAvatarUrl();
    }
};


export const createAudioPlayer = (src: string, loop: boolean = false): HTMLAudioElement => {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = 0.5; // Keep the volume moderate
    return audio;
};


export function setCallListeners(call: any): void {
    console.log('Setting call listeners for call:', call.getId());

    call
        .on("localStreamAvailable", (stream: any) => {
            console.log('🟢 Local stream available:', stream.getId());
            ensureModalVisible('#activeCallModal');

            addStreamInDiv(
                stream,
                'local-container',
                `local-media-${stream.getId()}`,
                { width: "160px", height: "120px" },
                true // muted for local
            );
        })
        .on("streamAdded", (stream: any) => {
            console.log('🟢 Remote stream added:', stream.getId());
            ensureModalVisible('#activeCallModal');

            addStreamInDiv(
                stream,
                'remote-container',
                `remote-media-${stream.getId()}`,
                { width: "640px", height: "480px" },
                false // not muted for remote
            );
        })
        .on("accepted", () => {
            console.log("call accepted", call.getId());
            
            // @ts-ignore
            $('#outgoingCallModal').modal("hide")
            // @ts-ignore
            $('#incomingCallModal').modal("hide")
            // @ts-ignore
            $('#activeCallModal').modal("show")
        })
        .on("streamRemoved", (stream: any) => {
            console.log('🔴 Remote stream removed:', stream.getId());
            const el = document.getElementById(`remote-media-${stream.getId()}`);
            if (el) el.remove();
        })
        .on("userMediaError", (e: any) => {
            console.error('⚠️ userMediaError:', e.error || e);
        })
        .on("hangup", () => {
            console.log('📞 Call ended:', call.getId());
            clearContainers();
            // @ts-ignore
            $('#outgoingCallModal').modal("hide")
            // @ts-ignore
            $('#incomingCallModal').modal("hide")
            // @ts-ignore
            $('#activeCallModal').modal("hide")
        })
        .on("declined", (reason: any) => {
            clearContainers();
            console.log("decline call id", call.getId());
            console.log("call was decline", reason);
        })

}


export function addStreamInDiv(stream: any, divId: string, mediaEltId: string, style: { width: string; height: string }, muted: boolean): void {
    const hasVideo: boolean = stream.hasVideo();
    const mediaType: "audio" | "video" = hasVideo ? "video" : "audio";

    console.log(`🎥 Attaching ${mediaType} stream (${stream.getId()}) to #${divId}`);

    const mediaElt: HTMLMediaElement = document.createElement(mediaType);
    mediaElt.id = mediaEltId;
    mediaElt.autoplay = true;
    mediaElt.muted = muted;
    //@ts-ignore
    mediaElt.playsInline = true;
    mediaElt.style.width = style.width;
    mediaElt.style.height = style.height;
    mediaElt.style.borderRadius = "8px";
    mediaElt.style.objectFit = "cover";
    mediaElt.style.background = "#000";

    const divElement = document.getElementById(divId) as HTMLDivElement | null;
    if (!divElement) {
        console.error(`❌ Container #${divId} not found. Skipping stream attachment.`);
        return;
    }

    // If a media element with the same ID exists, remove it before adding new one
    const existing = document.getElementById(mediaEltId);
    if (existing) existing.remove();

    // Attach stream
    stream.attachToElement(mediaElt);
    divElement.appendChild(mediaElt);

    // Attempt to autoplay
    const playPromise = mediaElt.play();
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                console.log(`✅ Autoplay started for ${mediaType} (${stream.getId()})`);
            })
            .catch((err: any) => {
                console.warn(`⚠️ Autoplay prevented for ${mediaType}:`, err);
                if ((window as any).apiRTC?.osName === "iOS") {
                    console.info("ℹ️ Enabling touch-to-start for iOS Safari");
                    document.addEventListener(
                        "touchstart",
                        () => mediaElt.play(),
                        { once: true }
                    );
                }
            });
    }
}

export function ensureModalVisible(modalId: string): void {
    const modalEl = document.querySelector(modalId);
    if (!modalEl) return;

    const isHidden = !$(modalEl).hasClass('show');
    if (isHidden) {
        // @ts-ignore
        $(modalEl).modal('show');
        console.log(`📺 Showing modal ${modalId} before attaching stream`);
    }
}


export function clearContainers(): void {
    const containers = ['local-container', 'remote-container'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    console.log('🧹 Cleared all media containers');
}

export function addHangupButton(callid: string): void {
    console.log("adding hangup button", callid);
    
    if ($(activeModalElement).hasClass('show') && hangupButton) {
        hangupButton.setAttribute('data-callid', callid);
    }
}


 export async function handleCookie() : Promise<[string, string]> {
        const userNameCookieName = "userName";
        const emailCookieName = "email";

        if (ManageCookies.hasCookie(userNameCookieName) && 
            ManageCookies.hasCookie(emailCookieName)) {
            const userName = ManageCookies.getCookie(userNameCookieName)!;
            const email = ManageCookies.getCookie(emailCookieName)!;
            return [userName, email];
        }

        // If no cookies, return a new Promise
        return new Promise((resolve) => {
            // @ts-ignore
            $("#useridentity").modal("show");
            
            saveCookieBtn.addEventListener('click', () => {
                saveCookieBtn.querySelector('.spinner-border')?.classList.remove('d-none');
                saveCookieBtn.setAttribute('disabled', 'true');
                
                setTimeout(() => {
                    const userName = userNameInput.value.trim();
                    const email = emailInput.value.trim();
                    
                    if (userName && email) {
                        ManageCookies.setCookie('userName', userName, {
                            path: '/',
                            maxAge: 3600,
                            secure: true,
                            sameSite: 'Lax'
                        });
                        ManageCookies.setCookie('email', email, {
                            path: '/',
                            maxAge: 3600,
                            secure: true,
                            sameSite: 'Lax'
                        });
                        // @ts-ignore
                        $("#useridentity").modal("hide");
                        resolve([userName, email]);
                    } else {
                        alert("Please enter both a username and an email.");
                    }
                }, 2000);
            });
        });
    }