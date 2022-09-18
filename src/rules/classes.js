const GamePhases = {
    DmTurn: 0,
    PlayersTurn: 1
}

const MessageTypes = {
    DmPrompt: 0,
    PlayerChat: 1,
    PlayerAction: 2
}

export class GameRoom {

    messages;
    gamePhase = GamePhases.DmTurn;

    constructor(messages) {
        this.messages = messages;
    }

    send(message) {
        switch (this.gamePhase) {
            case GamePhases.DmTurn:
                if (message.type == MessageTypes.DmPrompt) {
                    this.messages.push(message);
                    this.gamePhase = GamePhases.PlayersTurn;        
                }
                break;
            case GamePhases.PlayersTurn:
                if (message.type == MessageTypes.PlayerAction) {
                    this.gamePhase = GamePhases.DmTurn;
                }
                this.messages.push(message);
                break;
        }
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
        this.gameRoom.send(new Message(MessageTypes.PlayerChat, message));
    }

    isDM() {
        return false;
    }

}

export class PlayerCharacter extends Player {

    postAction(message) {
        this.gameRoom.send(new Message(MessageTypes.PlayerAction, message));
    }

}

export class DungeonMaster extends Player {

    postPrompt(message) {
        this.gameRoom.send(new Message(MessageTypes.DmPrompt, message));
    }

    isDM() {
        return true;
    }

}

