import { User } from './User';
import { Users } from './Users';
import { renderActiveReceipient } from './Helpers';

let localUser: User;
let activeRecipient: User | null = null;
let usersCollection: Users = new Users();


function setLocalUser(user: User): void {
    localUser = user;
}

function getLocalUser(): User {
    return localUser;
}

function addUser(user: User): void {
    usersCollection.add(user);
}

function getUserCollection() : Users {
    return usersCollection 
}

function setUserCollection(users : Users) : void {
    usersCollection = users
}

function setActiveRecipient(user : User | null) : void  {
    activeRecipient = user 
}

function getActiveRecipient() : User | null  {
    return activeRecipient
}

function renderDomFromUser(user: User): HTMLElement {
    const temp = document.querySelector("#user-template") as HTMLTemplateElement;
    if (!temp) throw new Error("User template missing.");

    const node = temp.content.cloneNode(true) as HTMLElement;

    const isLocalUser = user.getId() === getLocalUser().getId();

    // Attach user ID for click handling
    const listItem = node.querySelector("li");
    if (listItem) {
        listItem.setAttribute('data-user-id', user.getId());
    }

    (node.querySelector(".username") as HTMLElement).innerText = user.getName();
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


function renderUser(): void {
    const userWrapper = document.querySelector("#users");
    if (!userWrapper) return;
    userWrapper.innerHTML = ''; 
    getUserCollection().getAll().forEach(user => {
        const userDom = renderDomFromUser(user);
        userDom.querySelector('li')?.addEventListener('click', selectUserForChat)
        userWrapper.appendChild(userDom);
    });
}


function selectUserForChat(event: any) {
    let selectedUserDom = event.currentTarget; 
    let selectUserId = selectedUserDom.dataset.userId;
    let user: User  = getUserCollection().get(selectUserId)!
    setActiveRecipient(user)
    renderActiveReceipient()
}

export { renderUser, addUser, setLocalUser, getLocalUser, getUserCollection, setUserCollection, setActiveRecipient, getActiveRecipient };