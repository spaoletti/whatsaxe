import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    }
  })
};

const user = {
  uid: ""
};

test('should render', () => {
  setMessages([])
  render(<GameRoom firebase={firebase} firestore={firestore} user={user}/>)
});

test('if there are no messages the DM should be able to write a Chat', async () => {
  setMessages([]);
  setRole("DM");
  
  render(<GameRoom firebase={firebase} firestore={firestore} user={user}/>);
  userEvent.type(screen.getByTestId("text"), "A message!");
  userEvent.click(screen.getByTestId("send"));
  
  let messages = await screen.findAllByTestId("message");

  expect(messages.length).toBe(1);
  expect(mockedFirestore[0].type).toBe("chat");
});

test('if there are no messages the player should be able to write a Chat', async () => {
  setMessages([]);
  setRole("Player");
  
  render(<GameRoom firebase={firebase} firestore={firestore} user={user}/>);
  userEvent.type(screen.getByTestId("text"), "A message!");
  userEvent.click(screen.getByTestId("send"));
  
  let messages = await screen.findAllByTestId("message");

  expect(messages.length).toBe(1);
  expect(mockedFirestore[0].type).toBe("chat");
});

test('if there are no messages the DM should be able to write a Prompt', async () => {
  setMessages([]);
  setRole("DM");
  
  render(<GameRoom firebase={firebase} firestore={firestore} user={user}/>);
  userEvent.type(screen.getByTestId("text"), "A prompt!");
  userEvent.click(screen.getByTestId("send-prompt"));
  
  let messages = await screen.findAllByTestId("message");

  expect(messages.length).toBe(1);
  expect(mockedFirestore[0].type).toBe("prompt");
});

test('if there are no messages the player should not be able to write an Action', async () => {
  setMessages([]);
  setRole("Player");

  render(<GameRoom firebase={firebase} firestore={firestore} user={user}/>);
  userEvent.type(screen.getByTestId("text"), "A message!");
  userEvent.click(screen.getByTestId("send-prompt"));

  let noMessages = false;
  try {
    await screen.findAllByTestId("message");
  } catch (e) {
    noMessages = true;
  }
  
  expect(noMessages).toBeTruthy();
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