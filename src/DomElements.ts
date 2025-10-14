import { createAudioPlayer } from "./Helpers";


const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
const msgInput = document.getElementById('msgInput') as HTMLInputElement;
const chatRecipientElement = document.getElementById('chat-recipient') as HTMLElement;
const audioCallBtn = document.getElementById('audioCallBtn') as HTMLButtonElement;
const videoCallBtn = document.getElementById('videoCallBtn') as HTMLButtonElement;
const chatBox = document.getElementById('chat-box') as HTMLDivElement;
const mainchatwrapper = document.getElementById('visible-main-chat-wrapper') as HTMLDivElement;
const defaultChatMessageBox = document.getElementById('defaultChatMessageBox') as HTMLDivElement;
const outgoingModalElement = document.getElementById('outgoingCallModal');
const incomingModalElement = document.getElementById('incomingCallModal') as HTMLDialogElement;

const callAcceptButton = document.getElementById('callAcceptButton') as HTMLButtonElement;
const callDeclineButton = document.getElementById('callDeclineButton') as HTMLButtonElement;


export const incomingRingtone = createAudioPlayer('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm.ogg', true);
export const outgoingRingtone = createAudioPlayer('https://actions.google.com/sounds/v1/alarms/beep_short.ogg', true);

export { sendBtn, msgInput, chatRecipientElement, audioCallBtn, 
    videoCallBtn, chatBox, outgoingModalElement, 
    incomingModalElement, mainchatwrapper, 
    defaultChatMessageBox,callAcceptButton
    ,callDeclineButton
}