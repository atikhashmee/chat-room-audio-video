// main.ts
import "bootstrap/dist/css/bootstrap.min.css";
import "@popperjs/core"; // Import Popper.js dependency
import "bootstrap"; // Import Bootstrap's main JS bundle, which handles modal, dropdown, etc.
import "./style.css";
import $ from 'jquery'; 
import { User } from './User';
import { Users } from './Users';
import { Conversation } from "./Conversation";
import { ChatMessage } from "./ChatMessage";

// Utility type for Call Modals
type CallType = 'Audio' | 'Video';

// --- Global State ---
let activeRecipient: User | null = null;
const conversationsMap = new Map<string, Conversation>(); // Key: recipient user ID

// --- Global Audio Players ---
/**
 * Creates an Audio element for sound playback.
 * @param {string} src - The source URL for the audio file (must be accessible).
 * @param {boolean} loop - Whether the sound should loop.
 * @returns {HTMLAudioElement}
 */
const createAudioPlayer = (src: string, loop: boolean = false): HTMLAudioElement => {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = 0.5; // Keep the volume moderate
    return audio;
};

// Placeholder URLs for demonstration.
const incomingRingtone = createAudioPlayer('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm.ogg', true);
const outgoingRingtone = createAudioPlayer('https://actions.google.com/sounds/v1/alarms/beep_short.ogg', true);


// --- APIRT C/WEBRTC INTEGRATION (COMMENTED OUT) ---
/*
    // let apiKey = "apzkey:b5f0036b112dcb3f6284a490b6361968"; 
    // // let apiKey = "apzkey:xyz"; 
    // let cloudUrl =  "https://cloud.apizee.com";
    // let activeContact = null
    // let userAgent = new apiRTC.UserAgent({
    //     uri: apiKey
    // });
    // let LOCAL_USER_ID;
    // let onlineUsers = []

    // let connectedSession = await userAgent.register({cloudUrl})
    // console.log(connectedSession);
*/


// --- Data Initialization ---

const usersCollection = new Users();
for (let i = 1; i <= 4; i++) {
    const user = new User(
        i.toString(),
        i === 1 ? "You (Local User)" : `Contact Name ${i}`,
        `username${i}`
    );
    usersCollection.add(user);
}

// Ensure localUser is defined for message rendering logic
const localUser = usersCollection.get("1")!; 

/**
 * Initializes the conversation map with dummy data for each non-local user.
 */
const initializeConversations = () => {
    const localUserId = localUser.getId();
    
    // Create dummy conversations for all non-local users
    usersCollection.getAll().forEach(user => {
        if (user.getId() !== localUserId) {
            const convo = new Conversation(`Chat with ${user.getName()}`);
            convo.addParticipant(localUser);
            convo.addParticipant(user);

            // Add placeholder messages
            convo.addMessage(ChatMessage.create("1", `Hello ${user.getName()}!`, localUser, "text"));
            convo.addMessage(ChatMessage.create("2", `Hi ${localUser.getName()}! I'm ${user.getName()}.`, user, "text"));
            convo.addMessage(ChatMessage.create("3", "How are you?!", localUser, "text"));
            convo.addMessage(ChatMessage.create("4", "I am fine thanks!", user, "text"));
            
            conversationsMap.set(user.getId(), convo);
        }
    });
};
initializeConversations();


function renderDomFromUser(user: User): HTMLElement {
    const temp = document.querySelector("#user-template") as HTMLTemplateElement;
    if (!temp) throw new Error("User template missing.");

    const node = temp.content.cloneNode(true) as HTMLElement;
    
    const isLocalUser = user.getId() === localUser.getId();

    // Attach user ID for click handling
    const listItem = node.querySelector("li");
    if (listItem) {
        listItem.setAttribute('data-user-id', user.getId());
    }

    (node.querySelector(".username") as HTMLElement).innerText = user.getUsername();
    (node.querySelector(".userid") as HTMLElement).innerHTML = user.getId();
    
    const statusDot = node.querySelector(".badge-dot") as HTMLSpanElement;
    const avatar = node.querySelector("img") as HTMLImageElement;
    
    if (isLocalUser) {
        node.querySelector("li")?.classList.add('active-user');
    }

    if (user.getId() === "2") {
        statusDot?.classList.remove('badge-success');
        statusDot?.classList.add('badge-danger');
        avatar.src = `https://placehold.co/40x40/EF4444/ffffff?text=U2`;
    } else {
        avatar.src = user.getAvatarUrl();
    }

    return node;
}

/**
 * Renders the list of users and attaches the click handlers for activating a conversation.
 * @param {Users} users - The collection of users.
 */
function renderUser(users: Users): void {
    const userWrapper = document.querySelector("#users");
    if (!userWrapper) return;
    
    userWrapper.innerHTML = ''; 
    
    users.getAll().forEach(user => {
        const userDom = renderDomFromUser(user);
        const userId = user.getId();

        // Attach click listener
        userDom.querySelector('li')?.addEventListener('click', () => {
            if (userId !== localUser.getId()) {
                setActiveRecipient(userId);
            } else {
                // Click on local user: show blank chat and disable input
                activeRecipient = null;
                updateChatHeader(localUser); 
                renderMessages(new Conversation(""));
                disableChatInput(true);
            }
        });

        userWrapper.appendChild(userDom);
    });
}

// Initial render of the user list
renderUser(usersCollection);


// --- Message Rendering Logic ---

function renderDomFromMessage(message: ChatMessage): HTMLElement {
    const temp = document.querySelector("#message-template") as HTMLTemplateElement;
    if (!temp) throw new Error("Message template missing.");
    
    const isSent = message.sender.getId() === localUser.getId(); 

    // Determine classes and content based on sender
    const justifyClass = isSent ? 'justify-content-end' : 'justify-content-start';
    const messageBg = isSent ? 'bg-indigo text-white' : 'bg-white';
    const roundedClass = isSent ? 'rounded-b-0' : 'rounded-t-0';
    const nameAlignment = isSent ? 'text-right' : 'text-left';
    const timeColor = isSent ? '#E0E7FF' : '#6c757d';

    // 1. Clone the content of the template tag
    const node = temp.content.cloneNode(true) as HTMLElement;
    const messageContainer = node.firstElementChild as HTMLDivElement;
    
    // 2. Apply justification class to the outer flex container
    messageContainer.classList.add(justifyClass);

    // 3. Select and populate elements
    const senderNameEl = messageContainer.querySelector("p.mb-0") as HTMLElement;
    const contentEl = messageContainer.querySelector(".message-content") as HTMLElement;
    const timestampEl = messageContainer.querySelector(".message-timestamp") as HTMLSpanElement;
    const messageBoxEl = messageContainer.querySelector(".message-box") as HTMLElement; 

    // Set sender name and alignment
    if (senderNameEl) {
        senderNameEl.textContent = isSent ? "You" : message.sender.getName();
        senderNameEl.classList.remove('text-left', 'text-right');
        senderNameEl.classList.add(nameAlignment); 
    }
    
    // Set message content
    if (contentEl) {
        contentEl.textContent = message.content;
    }

    // Set message box styling (background and rounding)
    if (messageBoxEl) {
        messageBoxEl.classList.add(messageBg, roundedClass);
    }
    
    // Set timestamp and style
    if (timestampEl) {
        timestampEl.textContent = message.getFormattedTimestamp();
        timestampEl.style.color = timeColor;
        timestampEl.classList.remove('text-left', 'text-right');
        timestampEl.classList.add('text-right');
    }
    
    return messageContainer;
}

function renderMessages(conversation: Conversation): void {
    const messageWrapper = document.querySelector("#chat-box");
    if (!messageWrapper) return;
    
    messageWrapper.innerHTML = ''; 
    
    conversation.getMessages().forEach(message => {
        messageWrapper.appendChild(renderDomFromMessage(message));
    });

    // Scroll to bottom
    messageWrapper.scrollTop = messageWrapper.scrollHeight;
}

// Initial render of messages is now handled by initialize


// --- Chat UI and Modal Logic ---

// 2. DOM Element Selection
const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
const msgInput = document.getElementById('msgInput') as HTMLInputElement;
const chatRecipientElement = document.getElementById('chat-recipient') as HTMLElement;
const audioCallBtn = document.getElementById('audioCallBtn') as HTMLButtonElement;
const videoCallBtn = document.getElementById('videoCallBtn') as HTMLButtonElement;
const chatBox = document.getElementById('chat-box') as HTMLDivElement;
const outgoingModalElement = document.getElementById('outgoingCallModal');
const incomingModalElement = document.getElementById('incomingCallModal');

// Safety check for critical elements 
if (!sendBtn || !msgInput || !chatRecipientElement || !audioCallBtn || !videoCallBtn || !chatBox) {
    console.error('CRITICAL ERROR: One or more required DOM elements are missing. Check IDs.');
    throw new Error('Initialization failed due to missing UI elements.');
}

// 4. Input and UI Control Functions

/**
 * Updates the chat header with the current recipient's name/status.
 * @param {User | null} recipient - The user who is the current recipient, or null.
 */
const updateChatHeader = (recipient: User | null): void => {
    const defaultRecipient = usersCollection.get("2"); // Use a fixed user for visual consistency if null

    if (recipient && recipient.getId() !== localUser.getId()) {
        chatRecipientElement.textContent = recipient.getName();
        chatRecipientElement.dataset.userId = recipient.getId();
        // Update the header avatar to match the recipient
        const headerAvatar = document.querySelector('.d-flex.align-items-center.gap-3 img') as HTMLImageElement;
        if (headerAvatar) {
             // For user 2, use the specific placeholder, otherwise use the default avatar
             headerAvatar.src = recipient.getId() === "2" 
                ? `https://placehold.co/40x40/EF4444/ffffff?text=U2`
                : recipient.getAvatarUrl();
        }
    } else {
        // Default state when no valid contact is selected
        chatRecipientElement.textContent = 'Select a Contact';
        chatRecipientElement.dataset.userId = '';
        // Reset header avatar to something neutral or the local user
        const headerAvatar = document.querySelector('.d-flex.align-items-center.gap-3 img') as HTMLImageElement;
        if (headerAvatar && defaultRecipient) {
            headerAvatar.src = defaultRecipient.getAvatarUrl();
        }
    }
};

/**
 * Disables or enables chat input and call buttons.
 * @param {boolean} disable - True to disable, False to enable.
 */
const disableChatInput = (disable: boolean): void => {
    msgInput.disabled = disable;
    sendBtn.disabled = disable;
    audioCallBtn.disabled = disable;
    videoCallBtn.disabled = disable;
    
    if (disable) {
        msgInput.placeholder = "Select a contact to begin chatting...";
    } else {
        msgInput.placeholder = "Type a message...";
    }
}

/**
 * Sets the currently active recipient and refreshes the UI.
 * @param {string} userId - The ID of the user to set as the active recipient.
 */
function setActiveRecipient(userId: string): void {
    const newRecipient = usersCollection.get(userId);

    if (!newRecipient || newRecipient.getId() === localUser.getId()) {
        activeRecipient = null;
        updateChatHeader(null);
        renderMessages(new Conversation("")); // Clear messages
        disableChatInput(true);
        console.warn("Attempted to set invalid or local user as recipient.");
        return;
    }
    
    // Highlight the active user in the list immediately
    document.querySelectorAll('#users li').forEach(li => li.classList.remove('active'));
    document.querySelector(`#users li[data-user-id="${userId}"]`)?.classList.add('active');

    // Clear chat box and show a loading indicator
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
        activeRecipient = newRecipient;
        const conversation = conversationsMap.get(userId);
    
        // Update UI components after the "load" time
        updateChatHeader(activeRecipient);
        disableChatInput(false);

        // Render the conversation 
        if (conversation) {
            renderMessages(conversation);
        } else {
            renderMessages(new Conversation(""));
        }
    }, 200);
}


/**
 * Handles sending a message when the Send button is clicked or Enter is pressed.
 */
const sendMessage = (): void => {
    const messageText = msgInput.value.trim();
    if (messageText && activeRecipient) {
        console.log(`Sending message to ${activeRecipient.getName()}: ${messageText}`);
        
        const conversation = conversationsMap.get(activeRecipient.getId());

        if (conversation) {
            const newMessage = ChatMessage.create(
                (conversation.getMessages().length + 1).toString(), 
                messageText, 
                localUser, 
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

/**
 * Handles the keypress event on the input field.
 * @param {KeyboardEvent} e The keyboard event object.
 */
const handleKeypress = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && !msgInput.disabled) {
        e.preventDefault();
        sendMessage();
    }
};


// 5. Call Modal Logic

/**
 * Shows the outgoing call modal and updates its content.
 * @param {CallType} callType - 'Audio' or 'Video'.
 */
function showOutgoingCall(callType: CallType): void {
    if (!activeRecipient) {
        console.error("Cannot initiate call: No active recipient selected.");
        return;
    }
    const recipientName = activeRecipient.getName();
    
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
        // START AUDIO: Play outgoing ringtone (Triggered by user click, so it should play)
        outgoingRingtone.play().catch(e => console.error("Could not play outgoing ringtone:", e));
        
        $(outgoingModalElement).modal('show');
    }

    // Simulate call ending after 5 seconds
    setTimeout(() => {
        if (outgoingModalElement && $(outgoingModalElement).is(':visible')) {
            $(outgoingModalElement).modal('hide');
            console.log(`${callType} call attempt ended. No answer.`);
        }
    }, 5000);
}

/**
 * Simulates an incoming call and shows the incoming call modal.
 * @param {CallType} callType - 'Audio' or 'Video'.
 * @param {string} callerName - The name of the person calling.
 * * NOTE: This function must be called only after a user interaction to avoid 
 * the 'NotAllowedError'.
 */
function simulateIncomingCall(callType: CallType, callerName: string): void {
    const callTypeIncoming = document.getElementById('callTypeIncoming') as HTMLElement;
    const callerNameIncoming = document.getElementById('callerNameIncoming') as HTMLElement;
    const callerAvatarIncoming = document.getElementById('callerAvatarIncoming') as HTMLImageElement;

    callTypeIncoming.textContent = callType;
    callerNameIncoming.textContent = callerName;
    
    callerAvatarIncoming.src = "https://placehold.co/100x100/EF4444/ffffff?text=U2";

    if (incomingModalElement) {
        // START AUDIO: Play incoming ringtone 
        incomingRingtone.play().catch(e => console.error("Could not play incoming ringtone:", e));
        
        $(incomingModalElement).modal('show');
    }
}

/**
 * Stops all currently playing ringtones.
 */
const stopRingtones = (): void => {
    incomingRingtone.pause();
    incomingRingtone.currentTime = 0;
    outgoingRingtone.pause();
    outgoingRingtone.currentTime = 0;
};

// 6. Initialization and Event Binding

/**
 * Initializes all event listeners and the initial chat state.
 */
const initialize = (): void => {
    console.log("TypeScript initialization starting...");
    
    // Bind modal hide events to stop audio
    if (outgoingModalElement) {
        $(outgoingModalElement).on('hidden.bs.modal', stopRingtones);
    }
    if (incomingModalElement) {
        $(incomingModalElement).on('hidden.bs.modal', stopRingtones);
    }
    // Bind the decline/accept buttons to hide the modal and stop ringtones
    document.getElementById('declineBtn')?.addEventListener('click', () => $(incomingModalElement!).modal('hide'));
    document.getElementById('acceptBtn')?.addEventListener('click', () => {
        $(incomingModalElement!).modal('hide');
        console.log("Call accepted!");
    });
    document.getElementById('cancelOutgoingBtn')?.addEventListener('click', () => $(outgoingModalElement!).modal('hide'));
    
    // Bind message handlers
    sendBtn.addEventListener('click', sendMessage);
    msgInput.addEventListener('keypress', handleKeypress);

    // Bind call handlers
    audioCallBtn.addEventListener('click', () => showOutgoingCall('Audio'));
    videoCallBtn.addEventListener('click', () => showOutgoingCall('Video'));

    // --- Initial State Setup ---

    // 1. Remove the old demo button if it exists
    const oldIncomingCallDemoBtn = document.getElementById('incomingCallDemoBtn');
    if (oldIncomingCallDemoBtn) {
        oldIncomingCallDemoBtn.remove();
    }
    
    // 2. Set a default recipient (e.g., user 2) to load the first conversation
    const defaultRecipientId = usersCollection.getAll().find(u => u.getId() !== localUser.getId())?.getId();
    
    if (defaultRecipientId) {
        setActiveRecipient(defaultRecipientId);
    } else {
        // If no contacts exist, ensure the UI is blank/disabled
        activeRecipient = null;
        updateChatHeader(null);
        renderMessages(new Conversation(""));
        disableChatInput(true);
    }

    // 3. Re-add the manual button trigger for the incoming call demo to avoid the error.
    const newIncomingCallDemoBtn = document.createElement('button');
    newIncomingCallDemoBtn.textContent = "Simulate Incoming Call (Demo)";
    newIncomingCallDemoBtn.className = "btn btn-info btn-sm mt-3 w-100";
    newIncomingCallDemoBtn.id = "incomingCallDemoBtn";
    
    const chatControlsContainer = document.querySelector('.input-group');
    if (chatControlsContainer) {
         // Append it right after the input group
        chatControlsContainer.insertAdjacentElement('afterend', newIncomingCallDemoBtn);
    }
    
    const callerName = usersCollection.get("2")?.getName() || 'Jane Smith';
    newIncomingCallDemoBtn.addEventListener('click', () => simulateIncomingCall('Video', callerName));
};

// Start initialization when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', initialize);
