import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import 'react-firebase-hooks/firestore';
import { useCollection } from "react-firebase-hooks/firestore";
import GameRoom from "./GameRoom";

jest.mock('react-firebase-hooks/firestore', () => ({
  useCollection: jest.fn()
}));

mockRandomSeed();

let messagesSnapshot = []
let charactersSnapshot = []
const dungeonMasterUid = "78OjG96RrtZi5J3vqUChlmIdL503";

window.HTMLElement.prototype.scrollIntoView = function() {};

const firebase = {
  firestore: {
    FieldValue: {
      serverTimestamp: () => "timestamp"
    }
  }
}

const firestore = {

  collection: (collectionName) => ({
    _collectionName: collectionName,
    orderBy: () => ({
      limit: () => ({
        _collectionName: collectionName
      })
    }),
    add: (doc) => {
      addMessage(doc);
      return Promise.resolve();
    },
    where: () => ({
      get: () => {
        const objectsToDelete = messagesSnapshot.filter(doc => doc.data().type === "chat");
        for (const objToDelete of objectsToDelete) {
          objToDelete.ref = {
            delete: () => {
              messagesSnapshot = messagesSnapshot.filter(doc => doc !== objToDelete);
            }
          }
        }
        return Promise.resolve(objectsToDelete);
      }
    }),
    doc: (id) => ({
      update: (propsToUpdate) => {
        const snapshot = (collectionName === "messages") ? messagesSnapshot : charactersSnapshot;
        const doc = snapshot.find(d => d.id === id);
        const data = { ...doc.data(), ...propsToUpdate }; 
        doc.data = () => data;
      }
    })
  })
};

const user = {
  uid: dungeonMasterUid
};

const testif = (condition) => condition ? test : () => {};

beforeEach(() => {
  initFirestore();  
  rerender();
});

describe("Basic game loop", () => {

  test.each([
    ["DM"], 
    ["player1"]
  ])("The %p can't send empty messages", async (player) => {
    await sudo(player);
    await sendChat(" ");
    await sendAction(" ");

    const messages = screen.queryAllByTestId("message")
    expect(messages).toEqual([]);
  });
  
  test.each([
    ["DM"], 
    ["player1"]
  ])('if there are no messages the %p should be able to write a Chat', async (player) => {
    await sudo(player);
    await sendChat("A message!");
  
    let messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(1);
    expect(messagesSnapshot[0].data().type).toBe("chat");
  });
  
  test('if there are no messages the DM should be able to declare an Action', async () => {
    await sudo("DM");
    await sendAction("An action!");
  
    let messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(1);
    expect(messagesSnapshot[0].data().type).toBe("action");
  });
  
  test('if there are no messages the player should NOT be able to declare an Action', async () => {
    await sudo("player1");
    await sendAction("An action!");
  
    const messages = screen.queryAllByTestId("message")
    expect(messages).toEqual([]);
  });
  
  test.each([
    ["DM"], 
    ["player1"]
  ])('after an Action is sent by the %p, all Chats are deleted', async (player) => {
    await sudo("DM");
    await sendAction("Incipit!");
    await sudo(player);
    await sendChat("Here's a message");
    await sendChat("Here's another");
    await sendAction("And an action");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(messagesSnapshot[0].data().type).toBe("action");
    expect(messagesSnapshot[1].data().type).toBe("action");
  });
  
  test("A player should NOT be able to declare an Action without a previous Action from the DM", async () => {
    await sudo("player1");
    await sendChat("Here's a message from player");
    await sudo("DM");
    await sendChat("Here's a message from DM");
    await sudo("player1");
    await sendAction("Here's an Action from the player");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(messagesSnapshot[0].data().type).toBe("chat");
    expect(messagesSnapshot[1].data().type).toBe("chat");
  });
  
  test("A player should be able to declare an Action after an Action from the DM", async () => {
    await sudo("DM");
    await sendAction("Incipit!");
    await sudo("player1");
    await sendAction("Here's an Action from the player");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(messagesSnapshot[0].data().type).toBe("action");
    expect(messagesSnapshot[1].data().type).toBe("action");
  });
  
  test("A player should NOT be able to declare an Action after another player's Action", async () => {
    await sudo("DM");
    await sendAction("Incipit");
    await sudo("player1");
    await sendAction("Action!");
    await sudo("player1");
    await sendAction("Another action!");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(messagesSnapshot[0].data().type).toBe("action");
    expect(messagesSnapshot[1].data().type).toBe("action");
    expect(messagesSnapshot[1].data().text).toBe("Action!");
  });

  test("Private messages should be visible only by the receiver", async () => {
    await sudo("DM");
    await sendAction("/randomstuff");

    let messages = screen.queryAllByTestId("message");    
    expect(messages.length).toBe(1);
    expect(messagesSnapshot[0].data().type).toBe("chat");
    expect(messagesSnapshot[0].data().text).toBe("!!! Unknown command: randomstuff !!!");

    await sudo("player1");

    messages = screen.queryAllByTestId("message");    
    expect(messages.length).toBe(0);
  });

});

describe("Death", () => {

  test("When a player loses all her hit points, she die", async () => {
    await sudo("DM");
    await sendAction("/hit player1 30");
    await sudo("player1");
    await rerender();

    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(messagesSnapshot[1].data().type).toBe("chat");
    expect(messagesSnapshot[1].data().text).toBe("PLAYER1, you are dead.");
  });

  test("A dead player can't send Actions", async () => {
    await sudo("DM");
    await sendAction("Boom, dragon");
    await sendAction("/hit player1 30");
    await sudo("player1");
    await rerender();
    await sendAction("I'm undead!");

    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(3);
    expect(messagesSnapshot[2].data().type).toBe("chat");
    expect(messagesSnapshot[2].data().text).toBe("PLAYER1, you are dead.");
  });

});

describe("Commands", () => {

  test("A DM should be able to send an unknown command and receive an error message", async () => {
    await sudo("DM");
    await sendAction("/someWrongCommand");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(1);
    expect(messagesSnapshot[0].data().type).toBe("chat");
    expect(messagesSnapshot[0].data().private).toBe(true);
    expect(messagesSnapshot[0].data().text).toBe("!!! Unknown command: someWrongCommand !!!");
  });
  
  test("A wrong command from the DM should not delete chats", async () => {
    await sudo("DM");
    await sendChat("A chat");
    await sendChat("Another chat");
    await sendAction("/someWrongCommand");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(3);
  });
  
  test("A player should NOT be able to send commands", async () => {
    await sudo("DM");
    await sendAction("Incipit!");
    await sudo("player1");
    await sendAction("/someCommand");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(messagesSnapshot[1].data().type).toBe("action");
    expect(messagesSnapshot[1].data().text).toBe("/someCommand");
  });

  describe.each([
    [
      "skillcheck", 
      "player1 str 20", 
      "nonexisting str 20", 
      ["player2 str 20", "PLAYER2, make a STR skill check! (DC 20)"], 
    ], 
    [
      "hit", 
      "player1 30", 
      "nonexisting 3", 
      ["player2 30", "PLAYER2, you lost 30 hit points!"], 
    ],
    [
      "heal", 
      "player1 5", 
      "nonexisting 5", 
      ["player2 2", "PLAYER2, you gained 2 hit points!"], 
    ], 
    [
      "askroll", 
      "player1 1d20", 
      "nonexisting 1d20", 
      ["player2 1d20", "PLAYER2, roll 1d20!"], 
    ], 
  ])("/%p common Request tests", (
    command, 
    correctArgs, 
    nonExistingPlayerArgs,
    anotherPlayerArgs, 
  ) => {

    test("The DM can't target a dead player", async () => {
      await sudo("DM");
      await sendAction("/hit player1 30");
      await sudo("player1");
      await rerender();
      await sudo("DM");
      await sendAction(`/${command} ${correctArgs}`);
  
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(3);
      expect(messagesSnapshot[2].data().type).toBe("chat");
      expect(messagesSnapshot[2].data().private).toBe(true);
      expect(messagesSnapshot[2].data().text).toBe("!!! Invalid target: player1 !!!");
    });

    test("When a DM targets a non existing player, he should receive an error message", async () => {
      await sudo("DM");
      await sendAction(`/${command} ${nonExistingPlayerArgs}`);
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(messagesSnapshot[0].data().type).toBe("chat");
      expect(messagesSnapshot[0].data().private).toBe(true);
      expect(messagesSnapshot[0].data().text).toBe("!!! Invalid target: nonexisting !!!");
    });
    
    test("If there is a request pending for a player, the DM should NOT be able to target him", async () => {
      await sudo("DM");
      await sendAction("/skillcheck player1 dex 20");
      await sendAction(`/${command} ${correctArgs}`);

      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(2);
      expect(messagesSnapshot[1].data().type).toBe("chat");
      expect(messagesSnapshot[1].data().private).toBe(true);
      expect(messagesSnapshot[1].data().text).toBe("!!! player1 has another request pending !!!");
    });

    test("If there is a request pending, the DM should be able to target another player", async () => {
      await sudo("DM");
      await sendAction(`/${command} ${correctArgs}`);
      await sendAction(`/${command} ${anotherPlayerArgs[0]}`);

      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(2);
      expect(messagesSnapshot[1].data().type).toBe("chat");
      expect(messagesSnapshot[1].data().text).toBe(anotherPlayerArgs[1]);
      expect(messagesSnapshot[1].data().target).toBe("def");
    });

  });

  describe.each([
    [
      "skillcheck",
      "player1 str 20"
    ],
    [
      "askroll",
      "player1 3d8"
    ]
  ])("/%p common Roll Request tests", (
    command,
    correctArgs
  ) => {

    test("A player asked for a roll should be able to see the roll button", async () => {
      await sudo("DM");
      await sendAction(`/${command} ${correctArgs}`);
      await sudo("player1");      

      const rollButton = screen.queryByTestId("roll");
      expect(rollButton).toBeTruthy();
    });

    test("ONLY the player asked for a roll should be able to see the roll button", async () => {
      await sudo("DM");
      await sendAction(`/${command} ${correctArgs}`);
      await sudo("player2");    

      const rollButton = screen.queryByTestId("roll");
      expect(rollButton).toBeFalsy();
    });

    test("Rolling the dice should resolve the pending roll request", async () => {
      await sudo("DM");
      await sendAction(`/${command} ${correctArgs}`);
      await sudo("player1");
      await roll();

      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(2);
      expect(messagesSnapshot[0].data().resolved).toBe(true);
    });

    test("The player should not see the roll button if the last roll request is resolved", async () => {
      await sudo("DM");
      await sendAction(`/${command} ${correctArgs}`);
      await sudo("player1");
      await roll();

      expect(screen.queryByTestId("roll")).toBeNull();
    });

  });

  describe.each([
    [
      "skillcheck", 
      ["player1 str xx", "DC"], 
      "<player_name> <stat> <DC>",
      "player1 xxx 20",
      null
    ], 
    [
      "hit", 
      ["player1 xx", "Hit Points"], 
      "<player_name> <hp>",
      null,
      null
    ],
    [
      "heal", 
      ["player1 xx", "Hit Points"], 
      "<player_name> <hp>",
      null,
      null
    ], 
    [
      "askroll", 
      null, 
      "<player_name> <die>",
      null,
      "player1 xx"
    ], 
    [
      "roll", 
      null, 
      "<die>",
      null,
      "xx"
    ], 
  ])("/%p common Arguments tests", (
    command, 
    wrongNumericArgs, 
    argsHelpText,
    wrongStatArgs,
    wrongDiceArgs
  ) => {

    test("The command should have the correct number of arguments or it throws an error message", async () => {
      await sudo("DM");
      await sendAction(`/${command}`);
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(messagesSnapshot[0].data().type).toBe("chat");
      expect(messagesSnapshot[0].data().private).toBe(true);
      expect(messagesSnapshot[0].data().text).toBe(`!!! Wrong number of arguments. Correct syntax: /${command} ${argsHelpText} !!!`);
    });

    testif(wrongNumericArgs)("If numeric arguments are not numbers the DM should receive an error message", async () => {
      await sudo("DM");
      await sendAction(`/${command} ${wrongNumericArgs[0]}`);
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(messagesSnapshot[0].data().type).toBe("chat");
      expect(messagesSnapshot[0].data().private).toBe(true);
      expect(messagesSnapshot[0].data().text).toBe(`!!! ${wrongNumericArgs[1]} must be a number. Provided: xx !!!`);
    });

    testif(wrongStatArgs)("When a DM asks a player to make a skill check on a wrong stat, he should receive an error message", async () => {
      await sudo("DM");
      await sendAction(`/${command} ${wrongStatArgs}`);
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(messagesSnapshot[0].data().type).toBe("chat");
      expect(messagesSnapshot[0].data().private).toBe(true);
      expect(messagesSnapshot[0].data().text).toBe("!!! Unknown stat: xxx !!!");
    });

    testif(wrongDiceArgs)("When a DM asks a player to roll some wrong dice, he should receive an error message", async () => {
      await sudo("DM");
      await sendAction(`/${command} ${wrongDiceArgs}`);

      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(messagesSnapshot[0].data().type).toBe("chat");
      expect(messagesSnapshot[0].data().private).toBe(true);
      expect(messagesSnapshot[0].data().text).toBe("!!! Unknown dice: xx !!!");
    });

  });

  describe("/skillcheck", () => {

    test("A DM should be able to ask for a skill check", async () => {
      await sudo("DM");
      await sendAction("/skillcheck player1 str 20");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(messagesSnapshot[0].data().type).toBe("chat");
      expect(messagesSnapshot[0].data().text).toBe("PLAYER1, make a STR skill check! (DC 20)");
      expect(messagesSnapshot[0].data().target).toBe("abc");
      expect(messagesSnapshot[0].data().command).toEqual({
        args: ["player1", "str", "20"], 
        name: "skillcheck"
      });
    });
  
    test.each([
      [19, "success", 0.9], 
      [2, "failure", 0.05]
    ])("A player should be able to roll a %p and make a %p skill check", async (die, outcome, seed) => {
      await sudo("DM");
      await sendAction("/skillcheck player1 str 20");
      await sudo("player1");
      mockRandomSeed(seed);
      await roll();
      
      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(2);
      expect(messagesSnapshot[1].data().type).toBe("chat");
      expect(messagesSnapshot[1].data().text).toBe(
        `PLAYER1 rolled a ${die}!\n` +
        `${die} + 4 = ${die + 4}\n` +
        `It's a ${outcome}!`
      );
      mockRandomSeed();
    });

    test("If there is a resolved skill check, the DM should be able to ask another one to the same player", async () => {
      await sudo("DM");
      await sendAction("/skillcheck player1 dex 15");
      await sudo("player1");
      await roll();
      await sudo("DM");
      await sendAction("/skillcheck player1 str 20");

      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(3);
      expect(messagesSnapshot[2].data().type).toBe("chat");
      expect(messagesSnapshot[2].data().text).toBe("PLAYER1, make a STR skill check! (DC 20)");
    });

  });  

  describe("/hit", () => {

    test("A DM should be able to hit a player", async () => {
      await sudo("DM");
      await sendAction("/hit player1 6");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(messagesSnapshot[0].data().type).toBe("chat");
      expect(messagesSnapshot[0].data().text).toBe("PLAYER1, you lost 6 hit points!");
      expect(messagesSnapshot[0].data().target).toBe("abc");
      expect(messagesSnapshot[0].data().command).toEqual({
        args: ["player1", "6"], 
        name: "hit"
      });
    });

    test("The player should not see the roll button if the last request is a hit command", async () => {
      await sudo("DM");
      await sendAction("/hit player1 5");
      await sudo("player1");

      expect(screen.queryByTestId("roll")).toBeNull();      
    });

    test("A player targeted with a hit command should lose hit points", async () => {
      await sudo("DM");
      await sendAction("/hit player1 6");
      await sudo("player1");

      const character = charactersSnapshot.find(p => p.data().name === "player1");
      expect(character.data().hp).toBe(9);
      character.hp = character.maxhp;
    });
  
  });

  describe("/heal", () => {

    test("A DM should be able to heal a player", async () => {
      await sudo("DM");
      await sendAction("/heal player1 6");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(messagesSnapshot[0].data().type).toBe("chat");
      expect(messagesSnapshot[0].data().text).toBe("PLAYER1, you gained 6 hit points!");
      expect(messagesSnapshot[0].data().target).toBe("abc");
      expect(messagesSnapshot[0].data().command).toEqual({
        args: ["player1", "6"], 
        name: "heal"
      });
    });

    test("The player should not see the roll button if the last request is a heal command", async () => {
      await sudo("DM");
      await sendAction("/heal player1 5");
      await sudo("player1");

      expect(screen.queryByTestId("roll")).toBeNull();      
    });

    test("A player targeted with a heal command should gain hit points", async () => {
      const character = charactersSnapshot.find(p => p.data().name === "player1");
      const newData = character.data();
      newData.hp = 5;
      character.data = () => newData;
      await sudo("DM");
      await sendAction("/heal player1 6");
      await sudo("player1");

      expect(character.data().hp).toBe(11);
      character.hp = character.maxhp;
    });

    test("A player targeted with a heal command should not gain more hit points than his max hp", async () => {
      const character = charactersSnapshot.find(p => p.data().name === "player1");
      const newData = character.data();
      newData.hp = 13;
      character.data = () => newData;
      await sudo("DM");
      await sendAction("/heal player1 100");
      await sudo("player1");

      expect(character.data().hp).toBe(15);
      character.hp = character.maxhp;
    });

  });

  describe("/askroll", () => {
  
    test("A DM should be able to ask for a roll", async () => {
      await sudo("DM");
      await sendAction("/askroll player1 2d6");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(messagesSnapshot[0].data().type).toBe("chat");
      expect(messagesSnapshot[0].data().text).toBe("PLAYER1, roll 2d6!");
      expect(messagesSnapshot[0].data().target).toBe("abc");
      expect(messagesSnapshot[0].data().command).toEqual({
        args: ["player1", "2d6"], 
        name: "askroll"
      });
    });

    test("A player should be able to roll the dice", async () => {
      await sudo("DM");
      await sendAction("/askroll player1 5d6");
      await sudo("player1");
      await roll();
      
      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(2);
      expect(messagesSnapshot[1].data().type).toBe("chat");
      expect(messagesSnapshot[1].data().text).toBe(
        `PLAYER1 rolled 5d6!\n` +
        `3 + 3 + 3 + 3 + 3 = 15`
      );
    });

    test("If there is a resolved dice roll, the DM should be able to ask another one to the same player", async () => {
      await sudo("DM");
      await sendAction("/askroll player1 3d12");
      await sudo("player1");
      await roll();
      await sudo("DM");
      await sendAction("/askroll player1 1d20");

      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(3);
      expect(messagesSnapshot[2].data().type).toBe("chat");
      expect(messagesSnapshot[2].data().text).toBe("PLAYER1, roll 1d20!");
    });

  });

  describe("/roll", () => {

    test("The DM should be able to roll some dice", async () => {
      await sudo("DM");
      await sendAction("/roll 3d6");

      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(messagesSnapshot[0].data().type).toBe("chat");
      expect(messagesSnapshot[0].data().text).toBe(
        "DUNGEON MASTER rolled 3d6!\n" +
        "3 + 3 + 3 = 9"
      );
    });

  });

});

const rerender = async () => act(async () => { 
  cleanup();
  render(
    <GameRoom 
      firebase={firebase} 
      firestore={firestore} 
      user={user}
    />
  )
});

function initFirestore() {
  messagesSnapshot = [];
  charactersSnapshot = [
    {
      data: () => ({
        name: "player1",
        uid: "abc",
        str: 18,
        dex: 8,
        con: 6,
        int: 24,
        wis: 12,
        cha: 10,
        hp: 15,
        maxhp: 15
      })
    },
    {
      data: () => (
        { name: "player2", uid: "def" }
      )
    },
    {
      data: () => (
        { name: "player3", uid: "def" }
      )
    },
    {
      data: () => (
        { name: "player4", uid: "def" }
      )
    },
  ]  
  updateUseCollectionMock();
}

function addMessage(message) {
  messagesSnapshot.push({
    id: Date.now(),
    data: () => ({
      ...message
    })
  });
  updateUseCollectionMock();
}

function updateUseCollectionMock() {
  useCollection.mockImplementation((query) => [{
    docs: query._collectionName === "messages" ? messagesSnapshot : charactersSnapshot
  }]);
}

function mockRandomSeed(n = 0.4) {
  global.Math.random = () => n;
}

async function sudo(name) {
  if (name == "DM") {
    user.uid = dungeonMasterUid;
  } else {
    user.uid = charactersSnapshot.find(p => p.data().name === name).data().uid;
  }
  await rerender();
}

const sendChat = async (text) => act(async () => { 
  userEvent.type(screen.getByTestId("text"), text);
  userEvent.click(screen.getByTestId("send"));
});

const sendAction = async (text) => act(async () => { 
  userEvent.type(screen.getByTestId("text"), text);
  userEvent.click(screen.getByTestId("send-action"));
});

const roll = async (n = 10) => act(async () => { 
  userEvent.click(screen.getByTestId("roll"));
  await rerender(); // click doesn't trigger rerender for some reason
});