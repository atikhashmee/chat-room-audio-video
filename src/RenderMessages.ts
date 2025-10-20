import { ChatMessage } from "./ChatMessage";
import { Conversation } from "./Conversation";

import { getLocalUser } from "./RenderUser"
import {messagesContainer as messageWrapper} from "./DomElements"


const conversationsMap = new Map<string, Conversation>();

function renderDomFromMessage(message: ChatMessage): HTMLElement {
    const temp = document.querySelector("#message-template") as HTMLTemplateElement;
    if (!temp) throw new Error("Message template missing.");
    
    const isSent = message.sender.getId() === getLocalUser().getId(); 

    // Determine classes and content based on sender
    const justifyClass = isSent ? 'justify-content-end' : 'justify-content-start';
    const messageBg = isSent ? 'bg-indigo text-white' : 'bg-white';
    const roundedClass = isSent ? 'rounded-b-0' : 'rounded-t-0';
    const nameAlignment = isSent ? 'text-right' : 'text-left';
    const timeColor = isSent ? '#E0E7FF' : '#6c757d';

    // 1. Clone the content of the template tag
    const node = temp.content.cloneNode(true) as DocumentFragment;
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
    messageWrapper.innerHTML = ''; 
    conversation.getMessages().forEach(message => {
        messageWrapper.appendChild(renderDomFromMessage(message));
    });
    messageWrapper.scrollTop = messageWrapper.scrollHeight;
}

function appendMessage(message: ChatMessage): void {
    messageWrapper.appendChild(renderDomFromMessage(message));
    messageWrapper.scrollTop = messageWrapper.scrollHeight;
}

export { renderMessages, conversationsMap, appendMessage };