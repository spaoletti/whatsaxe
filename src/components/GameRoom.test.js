import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import 'react-firebase-hooks/firestore';
import { useCollectionData } from "react-firebase-hooks/firestore";
import GameRoom from "./GameRoom";

jest.mock('react-firebase-hooks/firestore', () => ({
  useCollectionData: jest.fn()
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
        const objectsToDelete = mockedFirestore.filter(doc => doc.type === "chat");
        for (const objToDelete of objectsToDelete) {
          objToDelete.ref = {
            delete: () => {
              mockedFirestore = mockedFirestore.filter(doc => doc !== objToDelete);
            }
          }
        }
        return Promise.resolve(objectsToDelete);
      }
    })
  })
};

const user = {
  uid: ""
};

const players = [
  { name: "player1", uid: "abc" }, 
  { name: "player2", uid: "def" },
  { name: "player3", uid: "ghi" },
  { name: "player4", uid: "jkl" }
];

beforeEach(() => {
  setMessages([]);
  renderGameRoom();
});

describe("Basic game loop", () => {

  // TODO should be both by clicking and by hitting enter
  test.each([
    ["DM"], 
    ["player1"]
  ])("The %p can't send empty messages", async (player) => {
    setPlayer(player);
    await sendChat(" ");
    await sendAction(" ");
  
    let noMessages = false;
    try {
      await screen.findAllByTestId("message");
    } catch (e) {
      noMessages = true;
    }  
    expect(noMessages).toBeTruthy();
  });
  
  test.each([
    ["DM"], 
    ["player1"]
  ])('if there are no messages the %p should be able to write a Chat', async (player) => {
    setPlayer(player);
    await sendChat("A message!");
  
    let messages = await screen.findAllByTestId("message");
    expect(messages.length).toBe(1);
    expect(mockedFirestore[0].type).toBe("chat");
  });
  
  test('if there are no messages the DM should be able to declare an Action', async () => {
    setPlayer("DM");
    await sendAction("An action!");
  
    let messages = await screen.findAllByTestId("message");
    expect(messages.length).toBe(1);
    expect(mockedFirestore[0].type).toBe("action");
  });
  
  test('if there are no messages the player should NOT be able to declare an Action', async () => {
    setPlayer("player1");
    await sendAction("An action!");
  
    let noMessages = false;
    try {
      await screen.findAllByTestId("message");
    } catch (e) {
      noMessages = true;
    }  
    expect(noMessages).toBeTruthy();
  });
  
  test.each([
    ["DM"], 
    ["player1"]
  ])('after an Action is sent by the %p, all Chats are deleted', async (player) => {
    setPlayer("DM");
    await sendAction("Incipit!");
    setPlayer(player);
    await sendChat("Here's a message");
    await sendChat("Here's another");
    await sendAction("And an action");
  
    const messages = await screen.findAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(mockedFirestore[0].type).toBe("action");
    expect(mockedFirestore[1].type).toBe("action");
  });
  
  test("A player should NOT be able to declare an Action without a previous Action from the DM", async () => {
    setPlayer("player1");
    await sendChat("Here's a message from player");
    setPlayer("DM");
    await sendChat("Here's a message from DM");
    setPlayer("player1");
    await sendAction("Here's an Action from the player");
  
    const messages = await screen.findAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(mockedFirestore[0].type).toBe("chat");
    expect(mockedFirestore[1].type).toBe("chat");
  });
  
  test("A player should be able to declare an Action after an Action from the DM", async () => {
    setPlayer("DM");
    await sendAction("Incipit!");
    setPlayer("player1");
    await sendAction("Here's an Action from the player");
  
    const messages = await screen.findAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(mockedFirestore[0].type).toBe("action");
    expect(mockedFirestore[1].type).toBe("action");
  });
  
  test("A player should NOT be able to declare an Action after another player's Action", async () => {
    setPlayer("DM");
    await sendAction("Incipit");
    setPlayer("player1");
    await sendAction("Action!");
    setPlayer("player1");
    await sendAction("Another action!");
  
    const messages = await screen.findAllByTestId("message");
    expect(messages.length).toBe(2);
    expect(mockedFirestore[0].type).toBe("action");
    expect(mockedFirestore[1].type).toBe("action");
    expect(mockedFirestore[1].text).toBe("Action!");
  });

});

describe("Commands", () => {

  test("A DM should be able to send an unknown command and receive an error message", async () => {
    setPlayer("DM");
    await sendAction("/someWrongCommand");
  
    const messages = await screen.findAllByTestId("message");
  
    expect(messages.length).toBe(1);
    expect(mockedFirestore[0].type).toBe("chat");
    expect(mockedFirestore[0].private).toBe(true);
    expect(mockedFirestore[0].text).toBe("!!! Unknown command: someWrongCommand !!!");
  });
  
  test("A wrong command from the DM should not delete chats", async () => {
    setPlayer("DM");
    await sendChat("A chat");
    await sendChat("Another chat");
    await sendAction("/someWrongCommand");
  
    const messages = await screen.findAllByTestId("message");
  
    expect(messages.length).toBe(3);
  });
  
  test("A player should NOT be able to send commands", async () => {
    setPlayer("DM");
    await sendAction("Incipit!");
    setPlayer("player1");
    await sendAction("/someCommand");
  
    const messages = await screen.findAllByTestId("message");
  
    expect(messages.length).toBe(2);
    expect(mockedFirestore[1].type).toBe("action");
    expect(mockedFirestore[1].text).toBe("/someCommand");
  });

  describe("/skillcheck", () => {

    test("When a DM asks a non existing player to make a skill check, he should receive an error message", async () => {
      setPlayer("DM");
      await sendAction("/skillcheck nonexisting str 20");
    
      const messages = await screen.findAllByTestId("message");
    
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].type).toBe("chat");
      expect(mockedFirestore[0].private).toBe(true);
      expect(mockedFirestore[0].text).toBe("!!! Unknown player: nonexisting !!!");
    });
    
    test("When a DM asks a player to make a skill check on a wrong stat, he should receive an error message", async () => {
      setPlayer("DM");
      await sendAction("/skillcheck player1 xxx 20");
    
      const messages = await screen.findAllByTestId("message");
    
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].type).toBe("chat");
      expect(mockedFirestore[0].private).toBe(true);
      expect(mockedFirestore[0].text).toBe("!!! Unknown stat: xxx !!!");
    });
    
    test("When a DM asks a player to make a skill check on a DC that's not a number, he should receive an error message", async () => {
      setPlayer("DM");
      await sendAction("/skillcheck player1 str xx");
    
      const messages = await screen.findAllByTestId("message");
    
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].type).toBe("chat");
      expect(mockedFirestore[0].private).toBe(true);
      expect(mockedFirestore[0].text).toBe("!!! DC must be a number. Provided: xx !!!");
    });
    
    test("A skill check command should have 3 arguments, or it throws an error message", async () => {
      setPlayer("DM");
      await sendAction("/skillcheck");
    
      const messages = await screen.findAllByTestId("message");
    
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].type).toBe("chat");
      expect(mockedFirestore[0].private).toBe(true);
      expect(mockedFirestore[0].text).toBe("!!! Wrong number of arguments. Correct syntax: /skillcheck <player_name> <stat> <DC> !!!");
    });
    
    test("A DM should be able to ask for a skill check", async () => {
      setPlayer("DM");
      await sendAction("/skillcheck player1 str 20");
    
      const messages = await screen.findAllByTestId("message");
    
      expect(messages.length).toBe(1);
      expect(mockedFirestore[0].type).toBe("chat");
      expect(mockedFirestore[0].text).toBe("PLAYER1, make a STR skill check! (DC 20)");
      expect(mockedFirestore[0].target).toBe("abc");
    });
  
    test("A player asked for a skill check should be able to see the roll button", async () => {
      setPlayer("DM");
      await sendAction("/skillcheck player1 str 20");
      setPlayer("player1");      
      renderGameRoom();

      const rollButton = screen.queryByTestId("roll");

      expect(rollButton).toBeTruthy();
    });

    test("ONLY the player asked for a skill check should be able to see the roll button", async () => {
      setPlayer("DM");
      await sendAction("/skillcheck player1 str 20");
      setPlayer("player2");    

      const rollButton = screen.queryByTestId("roll");

      expect(rollButton).toBeFalsy();
    });

    // test("If there is a skill check pending, the DM should NOT be able to ask another one to the same player", async () => {

    // });

    // test("If there is a skill check pending, the DM should be able to ask another one to another player", async () => {

    // });

  });  

});

function renderGameRoom() {
  render(
    <GameRoom 
      firebase={firebase} 
      firestore={firestore} 
      user={user}
      characters={players}
    />
  )
}

function setMessages(messages) {
  mockedFirestore = messages;
  useCollectionData.mockImplementation(() => [mockedFirestore]);
}

function addMessage(message) {
  mockedFirestore.push(message);
  useCollectionData.mockImplementation(() => [mockedFirestore]);
}

function setPlayer(name) {
  if (name == "DM") {
    user.uid = "78OjG96RrtZi5J3vqUChlmIdL503";
  } else {
    user.uid = players.find(p => p.name === name).uid;
  }
}

const sendChat = async (text) => act(async () => { 
  userEvent.type(screen.getByTestId("text"), text);
  userEvent.click(screen.getByTestId("send"));
});

const sendAction = async (text) => act(async () => { 
  userEvent.type(screen.getByTestId("text"), text);
  userEvent.click(screen.getByTestId("send-action"));
});