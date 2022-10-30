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

beforeEach(() => {
  setMessages([]);
  render(<GameRoom firebase={firebase} firestore={firestore} user={user}/>)
});

test.each([
  ["DM"], 
  ["Player"]
])('if there are no messages the %p should be able to write a Chat', async (role) => {
  setRole(role);
  await sendChat("A message!");

  let messages = await screen.findAllByTestId("message");
  expect(messages.length).toBe(1);
  expect(mockedFirestore[0].type).toBe("chat");
});

test('if there are no messages the DM should be able to declare an Action', async () => {
  setRole("DM");
  await sendAction("An action!");

  let messages = await screen.findAllByTestId("message");
  expect(messages.length).toBe(1);
  expect(mockedFirestore[0].type).toBe("action");
});

test('if there are no messages the player should NOT be able to declare an Action', async () => {
  setRole("Player");
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
  ["Player"]
])('after an Action is sent by the %p, all Chats are deleted', async (role) => {
  setRole("DM");
  await sendAction("Incipit!");
  setRole(role);
  await sendChat("Here's a message");
  await sendChat("Here's another");
  await sendAction("And an action");

  const messages = await screen.findAllByTestId("message");
  expect(messages.length).toBe(2);
  expect(mockedFirestore[0].type).toBe("action");
  expect(mockedFirestore[1].type).toBe("action");
});

test("A player should NOT be able to declare an Action without a previous Action from the DM", async () => {
  setRole("Player");
  await sendChat("Here's a message from player");
  setRole("DM");
  await sendChat("Here's a message from DM");
  setRole("Player");
  await sendAction("Here's an Action from the player");

  const messages = await screen.findAllByTestId("message");
  expect(messages.length).toBe(2);
  expect(mockedFirestore[0].type).toBe("chat");
  expect(mockedFirestore[1].type).toBe("chat");
});

test("A player should be able to declare an Action after an Action from the DM", async () => {
  setRole("DM");
  await sendAction("Incipit!");
  setRole("Player");
  await sendAction("Here's an Action from the player");

  const messages = await screen.findAllByTestId("message");
  expect(messages.length).toBe(2);
  expect(mockedFirestore[0].type).toBe("action");
  expect(mockedFirestore[1].type).toBe("action");
});

function setMessages(messages) {
  mockedFirestore = messages;
  useCollectionData.mockImplementation(() => [mockedFirestore]);
}

function addMessage(message) {
  mockedFirestore.push(message);
  useCollectionData.mockImplementation(() => [mockedFirestore]);
}

function setRole(role) {
  if (role == "DM") {
    user.uid = "78OjG96RrtZi5J3vqUChlmIdL503";
  } else {
    user.uid = "abc";
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