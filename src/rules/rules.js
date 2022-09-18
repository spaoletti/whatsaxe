const Phases = {
    Dm: 0,
    Players: 1
}

const MessageTypes = {
    Prompt: 0,
    Chat: 1,
    Action: 2
}

export class GameRoom {

    messages;
    gamePhase = Phases.Dm;

    constructor(messages) {
        this.messages = messages;
    }

    send(message) {
        switch (this.gamePhase) {
            case Phases.Dm:
                if (message.type == MessageTypes.Prompt) {
                    this.messages.push(message);
                    this.gamePhase = Phases.Players;        
                }
                break;
            case Phases.Players:
                if (message.type == MessageTypes.Action) {
                    this.#removeChats();
                    this.gamePhase = Phases.Dm;
                }
                this.messages.push(message);
                break;
        }
    }

    #removeChats() {
        this.messages = this.messages.filter(m => m.type != MessageTypes.Chat);
    }

}

export class Message {

    type;
    text;

    constructor(type, text) {
        this.type = type;
        this.text = text;
    }

}

class Player {

    gameRoom;

    constructor(gameRoom) {
        this.gameRoom = gameRoom;
    }

    postMessage(message) {
        this.gameRoom.send(new Message(MessageTypes.Chat, message));
    }

    isDM() {
        return false;
    }

}

export class PlayerCharacter extends Player {

    postAction(message) {
        this.gameRoom.send(new Message(MessageTypes.Action, message));
    }

}

export class DungeonMaster extends Player {

    postPrompt(message) {
        this.gameRoom.send(new Message(MessageTypes.Prompt, message));
    }

    isDM() {
        return true;
    }

}

