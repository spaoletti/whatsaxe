import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import 'react-firebase-hooks/firestore';
import { useCollection } from "react-firebase-hooks/firestore";
import * as utils from "../utils";
import GameRoom from "./GameRoom";

jest.mock('react-firebase-hooks/firestore', () => ({
  useCollection: jest.fn()
}));

let mockedFirestore = []

window.HTMLElement.prototype.scrollIntoView = function() {};

const firebase = {
  firestore: {
    FieldValue: {
      serverTimestamp: () => "timestamp"
    }
  }
}

const firestore = {
  collection: () => ({
    orderBy: () => ({
      limit: () => ({})
    }),
    add: (doc) => {
      addMessage(doc);
      return Promise.resolve();
    },
    where: () => ({
      get: () => {
        const objectsToDelete = mockedFirestore.filter(doc => doc.data().type === "chat");
        for (const objToDelete of objectsToDelete) {
          objToDelete.ref = {
            delete: () => {
              mockedFirestore = mockedFirestore.filter(doc => doc !== objToDelete);
            }
          }
        }
        return Promise.resolve(objectsToDelete);
      }
    }),
    doc: (id) => ({
      update: () => {
        const doc = mockedFirestore.find(d => d.id === id);
        const data = doc.data();
        data.resolved = true;
        doc.data = () => data
      }
    })
  })
};

const user = {
  uid: ""
};

const players = [
  { 
    name: "player1", 
    uid: "abc",
    str: 18,
    dex: 8,
    con: 6,
    int: 24,
    wis: 12,
    cha: 10
  }, 
  { name: "player2", uid: "def" },
  { name: "player3", uid: "ghi" },
  { name: "player4", uid: "jkl" }
];

beforeEach(() => {
  clearFirestore();
  rerender();
});

describe("Basic game loop", () => {

  test.each([
    ["DM"], 
    ["player1"]
  ])("The %p can't send empty messages", async (player) => {
    sudo(player);
    await sendChat(" ");
    await sendAction(" ");

    const messages = screen.queryAllByTestId("message")
    expect(messages).toEqual([]);
  });
  
  test.each([
    ["DM"], 
    ["player1"]
  ])('if there are no messages the %p should be able to write a Chat', async (player) => {
    sudo(player);
    await sendChat("A message!");
  
    let messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(1);
    expect(mockedFirestore[0].data().type).toBe("chat");
  });
  
  test('if there are no messages the DM should be able to declare an Action', async () => {
    sudo("DM");
    await sendAction("An action!");
  
    let messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(1);
    expect(mockedFirestore[0].data().type).toBe("action");
  });
  
  test('if there are no messages the player should NOT be able to declare an Action', async () => {
    sudo("player1");
    await sendAction("An action!");
  
    const messages = screen.queryAllByTestId("message")
    expect(messages).toEqual([]);
  });
  
  test.each([
    ["DM"], 
    ["player1"]
  ])('after an Action is sent by the %p, all Chats are deleted', async (player) => {
    sudo("DM");
    await sendAction("Incipit!");
    sudo(player);
    await sendChat("Here's a message");
    await sendChat("Here's another");
    await sendAction("And an action");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(mockedFirestore[0].data().type).toBe("action");
    expect(mockedFirestore[1].data().type).toBe("action");
  });
  
  test("A player should NOT be able to declare an Action without a previous Action from the DM", async () => {
    sudo("player1");
    await sendChat("Here's a message from player");
    sudo("DM");
    await sendChat("Here's a message from DM");
    sudo("player1");
    await sendAction("Here's an Action from the player");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(mockedFirestore[0].data().type).toBe("chat");
    expect(mockedFirestore[1].data().type).toBe("chat");
  });
  
  test("A player should be able to declare an Action after an Action from the DM", async () => {
    sudo("DM");
    await sendAction("Incipit!");
    sudo("player1");
    await sendAction("Here's an Action from the player");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(mockedFirestore[0].data().type).toBe("action");
    expect(mockedFirestore[1].data().type).toBe("action");
  });
  
  test("A player should NOT be able to declare an Action after another player's Action", async () => {
    sudo("DM");
    await sendAction("Incipit");
    sudo("player1");
    await sendAction("Action!");
    sudo("player1");
    await sendAction("Another action!");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(mockedFirestore[0].data().type).toBe("action");
    expect(mockedFirestore[1].data().type).toBe("action");
    expect(mockedFirestore[1].data().text).toBe("Action!");
  });

  test("Private messages should be visible only by the receiver", async () => {
    sudo("DM");
    await sendAction("/randomstuff");

    let messages = screen.queryAllByTestId("message");    
    expect(messages.length).toBe(1);
    expect(mockedFirestore[0].data().type).toBe("chat");
    expect(mockedFirestore[0].data().text).toBe("!!! Unknown command: randomstuff !!!");

    sudo("player1");

    messages = screen.queryAllByTestId("message");    
    expect(messages.length).toBe(0);
  });

});

describe("Commands", () => {

  test("A DM should be able to send an unknown command and receive an error message", async () => {
    sudo("DM");
    await sendAction("/someWrongCommand");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(1);
    expect(mockedFirestore[0].data().type).toBe("chat");
    expect(mockedFirestore[0].data().private).toBe(true);
    expect(mockedFirestore[0].data().text).toBe("!!! Unknown command: someWrongCommand !!!");
  });
  
  test("A wrong command from the DM should not delete chats", async () => {
    sudo("DM");
    await sendChat("A chat");
    await sendChat("Another chat");
    await sendAction("/someWrongCommand");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(3);
  });
  
  test("A player should NOT be able to send commands", async () => {
    sudo("DM");
    await sendAction("Incipit!");
    sudo("player1");
    await sendAction("/someCommand");
  
    const messages = screen.queryAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(mockedFirestore[1].data().type).toBe("action");
    expect(mockedFirestore[1].data().text).toBe("/someCommand");
  });

  describe("/skillcheck", () => {

    test("When a DM asks a non existing player to make a skill check, he should receive an error message", async () => {
      sudo("DM");
      await sendAction("/skillcheck nonexisting str 20");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].data().type).toBe("chat");
      expect(mockedFirestore[0].data().private).toBe(true);
      expect(mockedFirestore[0].data().text).toBe("!!! Unknown player: nonexisting !!!");
    });
    
    test("When a DM asks a player to make a skill check on a wrong stat, he should receive an error message", async () => {
      sudo("DM");
      await sendAction("/skillcheck player1 xxx 20");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].data().type).toBe("chat");
      expect(mockedFirestore[0].data().private).toBe(true);
      expect(mockedFirestore[0].data().text).toBe("!!! Unknown stat: xxx !!!");
    });
    
    test("When a DM asks a player to make a skill check on a DC that's not a number, he should receive an error message", async () => {
      sudo("DM");
      await sendAction("/skillcheck player1 str xx");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].data().type).toBe("chat");
      expect(mockedFirestore[0].data().private).toBe(true);
      expect(mockedFirestore[0].data().text).toBe("!!! DC must be a number. Provided: xx !!!");
    });
    
    test("A skill check command should have 3 arguments, or it throws an error message", async () => {
      sudo("DM");
      await sendAction("/skillcheck");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].data().type).toBe("chat");
      expect(mockedFirestore[0].data().private).toBe(true);
      expect(mockedFirestore[0].data().text).toBe("!!! Wrong number of arguments. Correct syntax: /skillcheck <player_name> <stat> <DC> !!!");
    });
    
    test("A DM should be able to ask for a skill check", async () => {
      sudo("DM");
      await sendAction("/skillcheck player1 str 20");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].data().type).toBe("chat");
      expect(mockedFirestore[0].data().text).toBe("PLAYER1, make a STR skill check! (DC 20)");
      expect(mockedFirestore[0].data().target).toBe("abc");
      expect(mockedFirestore[0].data().command).toEqual({
        args: ["player1", "str", "20"], 
        name: "skillcheck"
      });
    });
  
    test("A player asked for a skill check should be able to see the roll button", async () => {
      sudo("DM");
      await sendAction("/skillcheck player1 str 20");
      sudo("player1");      

      const rollButton = screen.queryByTestId("roll");
      expect(rollButton).toBeTruthy();
    });

    test("ONLY the player asked for a skill check should be able to see the roll button", async () => {
      sudo("DM");
      await sendAction("/skillcheck player1 str 20");
      sudo("player2");    

      const rollButton = screen.queryByTestId("roll");
      expect(rollButton).toBeFalsy();
    });

    test("If there is a skill check pending, the DM should NOT be able to ask another one to the same player", async () => {
      sudo("DM");
      await sendAction("/skillcheck player1 str 20");
      await sendAction("/skillcheck player1 dex 20");

      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(2);
      expect(mockedFirestore[1].data().type).toBe("chat");
      expect(mockedFirestore[1].data().private).toBe(true);
      expect(mockedFirestore[1].data().text).toBe("!!! player1 has a skill check pending !!!");
    });

    test("If there is a skill check pending, the DM should be able to ask another one to another player", async () => {
      sudo("DM");
      await sendAction("/skillcheck player1 str 20");
      await sendAction("/skillcheck player2 dex 20");

      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(2);
      expect(mockedFirestore[1].data().type).toBe("chat");
      expect(mockedFirestore[1].data().text).toBe("PLAYER2, make a DEX skill check! (DC 20)");
      expect(mockedFirestore[1].data().target).toBe("def");
    });

    test.each([
      [19, "success"], 
      [2, "failure"]
    ])("A player should be able to roll a %p and make a %p skill check", async (die, outcome) => {
      sudo("DM");
      await sendAction("/skillcheck player1 str 20");
      sudo("player1");
      await roll(die);
      
      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(2);
      expect(mockedFirestore[1].data().type).toBe("chat");
      expect(mockedFirestore[1].data().text).toBe(
        `PLAYER1 rolled a ${die}!\n` +
        `${die} + 4 = ${die + 4}\n` +
        `It's a ${outcome}!`
      );
    });

    test("Rolling the dice should resolve the pending skill check", async () => {
      sudo("DM");
      await sendAction("/skillcheck player1 str 20");
      sudo("player1");
      await roll();

      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(2);
      expect(mockedFirestore[0].data().resolved).toBe(true);
    });

    test("The player should not see the roll button if the last skill check is resolved", async () => {
      sudo("DM");
      await sendAction("/skillcheck player1 str 20");
      sudo("player1");
      await roll();

      expect(screen.queryByTestId("roll")).toBeNull();
    });

    test("If there is a resolved skill check, the DM should be able to ask another one to the same player", async () => {
      sudo("DM");
      await sendAction("/skillcheck player1 dex 15");
      sudo("player1");
      await roll();
      sudo("DM");
      await sendAction("/skillcheck player1 str 20");

      const messages = screen.queryAllByTestId("message");    
      expect(messages.length).toBe(3);
      expect(mockedFirestore[2].data().type).toBe("chat");
      expect(mockedFirestore[2].data().text).toBe("PLAYER1, make a STR skill check! (DC 20)");
    });

  });  

  describe("/hit", () => {

    test("When a DM hit a non existing player, he should receive an error message", async () => {
      sudo("DM");
      await sendAction("/hit nonexisting 1d8");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].data().type).toBe("chat");
      expect(mockedFirestore[0].data().private).toBe(true);
      expect(mockedFirestore[0].data().text).toBe("!!! Unknown player: nonexisting !!!");
    });

    test("A hit command should have 2 arguments, or it throws an error message", async () => {
      sudo("DM");
      await sendAction("/hit");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].data().type).toBe("chat");
      expect(mockedFirestore[0].data().private).toBe(true);
      expect(mockedFirestore[0].data().text).toBe("!!! Wrong number of arguments. Correct syntax: /hit <player_name> <hp> !!!");
    });

    test("A hit command should have a numerical hit points argument", async () => {
      sudo("DM");
      await sendAction("/hit player1 xx");
    
      const messages = screen.queryAllByTestId("message");
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].data().type).toBe("chat");
      expect(mockedFirestore[0].data().private).toBe(true);
      expect(mockedFirestore[0].data().text).toBe("!!! Hit Points must be a number. Provided: xx !!!");
    });

  });

});

const rerender = () => {
  cleanup();
  render(
    <GameRoom 
      firebase={firebase} 
      firestore={firestore} 
      user={user}
      characters={utils.buildCharacters(players)}
    />
  )
};

function clearFirestore() {
  mockedFirestore = [];
  updateUseCollectionMock();
}

function addMessage(message) {
  mockedFirestore.push({
    id: Date.now(),
    data: () => ({
      ...message
    })
  });
  updateUseCollectionMock();
}

function updateUseCollectionMock() {
  useCollection.mockImplementation(() => [{
    docs: mockedFirestore
  }]);
}

function sudo(name) {
  if (name == "DM") {
    user.uid = "78OjG96RrtZi5J3vqUChlmIdL503";
  } else {
    user.uid = players.find(p => p.name === name).uid;
  }
  rerender();
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
  utils.d20 = () => n;
  userEvent.click(screen.getByTestId("roll"));
  rerender(); // click doesn't trigger rerender for some reason
});