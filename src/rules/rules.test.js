import { DungeonMaster, GameRoom, PlayerCharacter } from "./rules";

let gameRoom;
let dm;
let player1;
let player2;

beforeEach(() => {
    gameRoom = new GameRoom([]);
    dm = new DungeonMaster(gameRoom);
    player1 = new PlayerCharacter(gameRoom);
    player2 = new PlayerCharacter(gameRoom);
});

test('at the beginning of the game, only the DM should be able to write a Prompt', () => {
    player1.postMessage("message1");
    player2.postMessage("message2");
    player1.postAction("action!");
    dm.postPrompt("message3");

    let messages = gameRoom.messages;
    expect(messages.length).toBe(1);
    expect(messages[0].text).toBe("message3");
})

test('after a Prompt, players can post chat messages', () => {
    dm.postPrompt("prompt");
    player1.postMessage("message1");
    player2.postMessage("message2");

    let messages = gameRoom.messages;
    expect(messages.length).toBe(3);
    expect(messages[0].text).toBe("prompt");
    expect(messages[1].text).toBe("message1");
    expect(messages[2].text).toBe("message2");
})

test('during player\'s turn, a player can post an action', () => {
    dm.postPrompt("prompt");
    player1.postAction("action!");

    let messages = gameRoom.messages;
    expect(messages.length).toBe(2);
    expect(messages[0].text).toBe("prompt");
    expect(messages[1].text).toBe("action!");
});

test('after a player\'s action, only the DM can post a Prompt', () => {
    dm.postPrompt("prompt");
    player1.postAction("action!");
    player2.postAction("action 2!");
    player2.postMessage("message");
    dm.postPrompt("prompt 2");

    let messages = gameRoom.messages;
    expect(messages.length).toBe(3);
    expect(messages[0].text).toBe("prompt");
    expect(messages[1].text).toBe("action!");
    expect(messages[2].text).toBe("prompt 2");
});

test('after a player\'s action, chat messages are deleted', () => {
    dm.postPrompt("prompt");
    player2.postMessage("message");
    player2.postMessage("message");
    player1.postAction("action!");

    let messages = gameRoom.messages;
    expect(messages.length).toBe(2);
    expect(messages[0].text).toBe("prompt");
    expect(messages[1].text).toBe("action!");
});