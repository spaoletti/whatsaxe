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

test('if there are no messages the DM should be able to write a Chat', async () => {
  setRole("DM");

  await sendChat("A message!");

  let messages = await screen.findAllByTestId("message");
  expect(messages.length).toBe(1);
  expect(mockedFirestore[0].type).toBe("chat");
});

test('if there are no messages the player should be able to write a Chat', async () => {
  setRole("Player");  

  await sendChat("A message!");
  
  let messages = await screen.findAllByTestId("message");
  expect(messages.length).toBe(1);
  expect(mockedFirestore[0].type).toBe("chat");
});

test('if there are no messages the DM should be able to write an Action', async () => {
  setRole("DM");
  
  await sendAction("An action!");

  let messages = await screen.findAllByTestId("message");
  expect(messages.length).toBe(1);
  expect(mockedFirestore[0].type).toBe("action");
});

test('if there are no messages the player should not be able to write an Action', async () => {
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

test('after an Action is sent, all Chats are deleted', async () => {
  setRole("DM");

  await sendChat("Here's a message");
  await sendChat("Here's another");
  await sendAction("And an action");

  let messages = await screen.findAllByTestId("message");
  expect(messages.length).toBe(1);
  expect(mockedFirestore[0].type).toBe("action");
})

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