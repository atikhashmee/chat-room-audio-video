
import { User } from './User';
import { Conversation } from './Conversation';
import { ChatMessage } from './ChatMessage';
import { renderMessages } from './RenderMessages';
import { conversationsMap } from './RenderMessages';
import {  getActiveRecipient, getLocalUser } from './RenderUser';
import {  msgInput, chatRecipientElement, chatBox, 
    incomingRingtone, outgoingRingtone, mainchatwrapper, defaultChatMessageBox, outgoingModalElement, incomingModalElement } 
    from "./DomElements";
import $ from 'jquery'; 

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
            // setCallListeners(call);
            // addHangupButton(call.getId());
        } else {
            console.warn("Cannot establish call");
        }
    }

    // Simulate call ending after 5 seconds
    // setTimeout(() => {
    //     if (outgoingModalElement && $(outgoingModalElement).is(':visible')) {
    //         $(outgoingModalElement).modal('hide');
    //         console.log(`${callType} call attempt ended. No answer.`);
    //     }
    // }, 5000);
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