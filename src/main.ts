import "bootstrap/dist/css/bootstrap.min.css";
import "@popperjs/core"; 
import "bootstrap"; 
import "./style.css";
import $ from 'jquery'; 

import { sendBtn, msgInput, chatRecipientElement, audioCallBtn, videoCallBtn,
     chatBox, incomingRingtone, outgoingRingtone, incomingModalElement, outgoingModalElement,
    
    callAcceptButton,
    callDeclineButton,
    userNameInput,
    emailInput,
    saveCookieBtn
    } from "./DomElements";

import { Conversation } from "./Conversation";
import { Users } from "./Users";
import { User } from "./User";
import { renderUser, setUserCollection, setLocalUser, getLocalUser, addUser, getUserCollection, getActiveRecipient } from "./RenderUser";
import { showOutgoingCall, simulateIncomingCall } from "./Helpers";
import { ChatMessage } from "./ChatMessage";
import { renderMessages } from "./RenderMessages";
import ManageCookies from "./ManageCookies";


(async function() {
    const [userName, email] = await handleCookie();
    let apiKey = "apzkey:b5f0036b112dcb3f6284a490b6361968"; 
    let cloudUrl =  "https://cloud.apizee.com";
    let userAgent = new apiRTC.UserAgent({
        uri: apiKey
    });


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

    connectedSession.on('contactListUpdate', function(newJoineed : any) {
        var contactListArray : Array<any> = connectedSession.getOnlineContactsArray()
        contactListArray.forEach(onlineUser => {
            if (getLocalUser().getId() !== onlineUser.getId()) {
                addUser(new User(onlineUser.getId(), onlineUser.getUserData().name, onlineUser.getUsername(), onlineUser.getUserData().email));
            }
        });
        renderUser()
    })
    let conversation = new Conversation("connecting users");
    conversation.addMessage(ChatMessage.create("1", "Hello, this is a test message!", new User("u1", "Alice", "Alice", "alice@example.com"), 'text'));
    conversation.addMessage(ChatMessage.create("2", "Here's an image for you.", new User("u2", "Bob", "Bob", "bob@example.com"), 'image', { fileName: "image.png", fileSize: 204800, mimeType: "image/png" }));
    conversation.addMessage(ChatMessage.create("3", "Please find the attached document.", new User("u1", "Alice", "Alice", "alice@example.com"), 'file', { fileName: "document.pdf", fileSize: 512000, mimeType: "application/pdf" }));

    renderMessages(conversation);


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
                        // addHangupButton(call.getId());
                    });
            } else { 
                invitation.accept() //Answering with audio and video.
                .then(function (call : any) {
                    setCallListeners(call);
                    // addHangupButton(call.getId());
                });
            }
        });

        callDeclineButton.addEventListener('click', () => {
            invitation.decline();
            $(incomingModalElement).modal('hide');
        })
        
        // Display hangup button
        //document.getElementById('hangup').style.display = 'inline-block';
    })


    audioCallBtn.addEventListener('click', () => {
        const contact = connectedSession.getOrCreateContact(getActiveRecipient()?.getId())
        showOutgoingCall('Audio', contact)
    });
    videoCallBtn.addEventListener('click', () => {
        const contact = connectedSession.getOrCreateContact(getActiveRecipient()?.getId())
        showOutgoingCall('Video', contact)
    });


    sendBtn.addEventListener('submit', (e) => {
        e.preventDefault();
        const msgInput = document.getElementById('msgInput') as HTMLInputElement;
        const message = msgInput.value.trim();
        if (message) {
            console.log(message);
            msgInput.value = '';
        }
    });

// === ApiRTC Call Event Listener Setup ===
function setCallListeners(call: any): void {
    console.log('Setting call listeners for call:', call.getId());

    call
        // When local stream (camera/mic) is ready
        .on("localStreamAvailable", (stream: any) => {
            console.log('🟢 Local stream available:', stream.getId());
            ensureModalVisible('#incomingCallModal');

            addStreamInDiv(
                stream,
                'local-container',
                `local-media-${stream.getId()}`,
                { width: "160px", height: "120px" },
                true // muted for local
            );
        })

        // When remote stream (the other user) arrives
        .on("streamAdded", (stream: any) => {
            console.log('🟢 Remote stream added:', stream.getId());
            ensureModalVisible('#incomingCallModal');

            addStreamInDiv(
                stream,
                'remote-container',
                `remote-media-${stream.getId()}`,
                { width: "640px", height: "480px" },
                false // not muted for remote
            );
        })

        // When a remote stream stops (user hangs up)
        .on("streamRemoved", (stream: any) => {
            console.log('🔴 Remote stream removed:', stream.getId());
            const el = document.getElementById(`remote-media-${stream.getId()}`);
            if (el) el.remove();
        })

        // Media permission or device error
        .on("userMediaError", (e: any) => {
            console.error('⚠️ userMediaError:', e.error || e);
        })

        // When the call ends
        .on("hangup", () => {
            console.log('📞 Call ended:', call.getId());
            clearContainers();
        });
}



// === Stream Renderer (Audio/Video) ===
function addStreamInDiv(
    stream: any,
    divId: string,
    mediaEltId: string,
    style: { width: string; height: string },
    muted: boolean
): void {
    const hasVideo: boolean = stream.hasVideo();
    const mediaType: "audio" | "video" = hasVideo ? "video" : "audio";

    console.log(`🎥 Attaching ${mediaType} stream (${stream.getId()}) to #${divId}`);

    const mediaElt: HTMLMediaElement = document.createElement(mediaType);
    mediaElt.id = mediaEltId;
    mediaElt.autoplay = true;
    mediaElt.muted = muted;
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



// === Utility: Ensure modal visible before attaching streams ===
function ensureModalVisible(modalId: string): void {
    const modalEl = document.querySelector(modalId);
    if (!modalEl) return;

    const isHidden = !$(modalEl).hasClass('show');
    if (isHidden) {
        $(modalEl).modal('show');
        console.log(`📺 Showing modal ${modalId} before attaching stream`);
    }
}



// === Utility: Cleanup after hangup ===
function clearContainers(): void {
    const containers = ['local-container', 'remote-container'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    console.log('🧹 Cleared all media containers');
}

    async function handleCookie() : Promise<[string, string]> {
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
                        $("#useridentity").modal("hide");
                        resolve([userName, email]);
                    } else {
                        alert("Please enter both a username and an email.");
                    }
                }, 2000);
            });
        });
    }



})();








// Safety check for critical elements 
// if (!sendBtn || !msgInput || !chatRecipientElement || !audioCallBtn || !videoCallBtn || !chatBox) {
//     console.error('CRITICAL ERROR: One or more required DOM elements are missing. Check IDs.');
//     throw new Error('Initialization failed due to missing UI elements.');
// }





function _setCallListeners(call :any) :void {
        call.on("localStreamAvailable", function (stream :any) {
            console.log('localStreamAvailable');
            console.log(stream);
            
            //document.getElementById('local-media').remove();
            addStreamInDiv(stream, 'local-container', 'local-media-' + stream.getId(), {width : "160px", height : "120px"}, true);
            stream
                .on("stopped", function () { //When client receives an screenSharing call from another user
                    console.error("Stream stopped");
                    // $('#local-media-' + stream.getId()).remove();
                });
        })
        .on("streamAdded", function (stream : any) {
            console.log('stream :', stream);
            addStreamInDiv(stream, 'remote-container', 'remote-media-' + stream.getId(), {width : "640px", height : "480px"}, false);
        })
        .on('streamRemoved', function (stream : any) {
            // Remove media element
            (document.getElementById('remote-media-' + stream.getId()) as HTMLMediaElement).remove();
        })
        .on('userMediaError', function (e:any) {
            console.log('userMediaError detected : ', e);
            console.log('userMediaError detected with error : ', e.error);

            //Checking if tryAudioCallActivated
            if (e.tryAudioCallActivated === false) {
                $('#hangup-' + call.getId()).remove();
            }
        })
        .on('desktopCapture', function (e : any ) {
            console.log('desktopCapture event : ', e);
            // $('#hangup-' + call.getId()).remove();
        })
        .on('hangup', function () {
            // $('#hangup-' + call.getId()).remove();
        });
}


 function _addStreamInDiv(stream : any, divId : string, mediaEltId : string, style : object, muted : boolean) : void {
        let mediaElt = null,
            divElement = null,
            funcFixIoS : any = null,
            promise = null;

          let mediaEltType = stream.hasVideo() ? "video" : "audio";
            mediaElt = document.createElement(mediaEltType) as HTMLMediaElement;
            

        mediaElt.id = mediaEltId;
        mediaElt.autoplay = true;
        mediaElt.muted = muted;
        mediaElt.style.width = style.width;
        mediaElt.style.height = style.height;

        funcFixIoS = function () {
            var promise = mediaElt.play();
            console.log('funcFixIoS');
            if (promise !== undefined) {
                promise.then(function () {
                    // Autoplay started!
                    console.log('Autoplay started');
                    console.error('Audio is now activated');
                    document.removeEventListener('touchstart', funcFixIoS);

                    $('#status').empty().append('iOS / Safari : Audio is now activated');

                }).catch(function (error : any) {
                    // Autoplay was prevented.
                    console.log("catche from a promise ", error);
                    
                    console.error('Autoplay was prevented');
                });
            }
            document.removeEventListener('touchstart', funcFixIoS);
        };

        stream.attachToElement(mediaElt);
        divElement = document.getElementById(divId) as HTMLDivElement;
        divElement.appendChild(mediaElt);
        promise = mediaElt.play();

        if (promise !== undefined) {
            promise.then(function () {
                // Autoplay started!
                console.log('Autoplay started');
            }).catch(function (error) {
                // Autoplay was prevented.
                if (apiRTC.osName === "iOS") {
                    console.info('iOS : Autoplay was prevented, activating touch event to start media play');
                    //Show a UI element to let the user manually start playback

                    //In our sample, we display a modal to inform user and use touchstart event to launch "play()"
                    document.addEventListener('touchstart',  funcFixIoS);
                    console.error('WARNING : Audio autoplay was prevented by iOS, touch screen to activate audio');
                    $('#status').empty().append('WARNING : iOS / Safari : Audio autoplay was prevented by iOS, touch screen to activate audio');
                } else {
                    console.error('Autoplay was prevented');
                }
            });
        }
    }



