import "bootstrap/dist/css/bootstrap.min.css";
import "@popperjs/core"; 
import "bootstrap"; 
import "./style.css";
import $ from 'jquery'; 

import { sendBtn, audioCallBtn, videoCallBtn, incomingModalElement, callAcceptButton, callDeclineButton, hangupButton,} from "./DomElements";
import { User } from "./User";
import { renderUser, setLocalUser, getLocalUser, addUser, getUserCollection, getActiveRecipient, userSelectedForChat } from "./RenderUser";
import { showOutgoingCall, simulateIncomingCall, setCallListeners, addHangupButton, handleCookie } from "./Helpers";
import { ChatMessage } from "./ChatMessage";
import { appendMessage } from "./RenderMessages";

(async function() {
    const [userName, email] = await handleCookie();
    let apiKey = "apzkey:b5f0036b112dcb3f6284a490b6361968"; 
    let cloudUrl =  "https://cloud.apizee.com";
    // @ts-ignore
    let userAgent = new apiRTC.UserAgent({
        uri: apiKey
    });


    // @ts-ignore
    const userData = new apiRTC.UserData()
    userData.setProp("name", userName)
    userData.setProp("email", email)
    let sessionId = email.replace(/@/g, '/');

    let connectedSession = await userAgent.register({
        cloudUrl,
        id: sessionId,
        userData: userData 
    })

    
    let localUser = new User((connectedSession.getId() as string), connectedSession.getUserData().name, connectedSession.getUsername(), email)
    setLocalUser(localUser)

    connectedSession.on('contactListUpdate', function() {
        var contactListArray : Array<any> = connectedSession.getOnlineContactsArray()
        contactListArray.forEach(onlineUser => {
            if (getLocalUser().getId() !== onlineUser.getId()) {
                addUser(new User(onlineUser.getId(), onlineUser.getUserData().name, onlineUser.getUsername(), onlineUser.getUserData().email));
            }
        });
        renderUser()
    })
    //for dummy text based simulation
    // let conversation = new Conversation("connecting users");
    // conversation.addMessage(ChatMessage.create("1", "Hello, this is a test message!", new User("atik/gmail.com", "Alice", "Alice", "alice@example.com"), 'text'));
    // conversation.addMessage(ChatMessage.create("2", "Here's an image for you.", new User("rafid/gmail.com", "Bob", "Bob", "bob@example.com"), 'image', { fileName: "image.png", fileSize: 204800, mimeType: "image/png" }));
    // conversation.addMessage(ChatMessage.create("3", "Please find the attached document.", new User("atik/gmail.com", "Alice", "Alice", "alice@example.com"), 'file', { fileName: "document.pdf", fileSize: 512000, mimeType: "application/pdf" }));

    // conversationsMap.set(conversation.getId(), conversation);
    // renderMessages(conversation);
    //end of dummy text based simulation


    connectedSession.on('incomingCall', function (invitation : any) {
        let senderid = invitation.getSender().getId()
        const callerName = getUserCollection().get(senderid)?.getName() || 'Unknown caller';
        simulateIncomingCall(invitation.getCallType(), callerName)
        callAcceptButton.addEventListener('click', () => {
            if (invitation.getCallType()=='audio') { //When receiving an audio call 
                var answerOptions = {
                    mediaTypeForIncomingCall : 'AUDIO' //Answering with audio only.
                }
                invitation.accept(null, answerOptions)
                    .then(function (call : any) {
                        console.log("call got answered");
                        console.log(call);
                        setCallListeners(call)
                        addHangupButton(call.getId());
                    });
            } else { 
                invitation.accept() //Answering with audio and video.
                .then(function (call : any) {
                    setCallListeners(call);
                    addHangupButton(call.getId());
                });
            }
        });

        callDeclineButton.addEventListener('click', () => {
            invitation.decline();
            // @ts-ignore
            $(incomingModalElement).modal('hide');
        })
        
        // Display hangup button
        //document.getElementById('hangup').style.display = 'inline-block';
    })

    connectedSession.on("contactMessage", (e: any)=> {
        let user: User  = getUserCollection().get(e.sender.getId())!
        userSelectedForChat(user, false)
        appendMessage(ChatMessage.create(e.uuid, e.content, user, "text"))
    })


    audioCallBtn.addEventListener('click', () => {
        const contact = connectedSession.getOrCreateContact(getActiveRecipient()?.getId())
        showOutgoingCall('Audio', contact)
    });
    videoCallBtn.addEventListener('click', () => {
        const contact = connectedSession.getOrCreateContact(getActiveRecipient()?.getId())
        showOutgoingCall('Video', contact)
    });

    hangupButton.addEventListener("click", (event) => {
        const callId = (event.currentTarget as HTMLElement).getAttribute('data-callid');
        console.log("hangupCall :", callId);
        var call = connectedSession.getCall(callId);
        call.hangUp();
    })


    sendBtn.addEventListener('submit', (e) => {
        e.preventDefault();
        const msgInput = document.getElementById('msgInput') as HTMLInputElement;
        const message = msgInput.value.trim();
        if (message) {
            msgInput.value = '';
            appendMessage(ChatMessage.create("id", message, getLocalUser(), "text"))
            connectedSession.getOrCreateContact(getActiveRecipient()?.getId()).sendMessage(message)
        }
    });

})();




