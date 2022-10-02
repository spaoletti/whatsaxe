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

const firestore = {
  collection: () => ({
    orderBy: () => ({
      limit: () => ({})
    }),
    add: (doc) => {
      addMessage(doc);
      return Promise.resolve();
    }
  }),
  FieldValue: {
    serverTimestamp: () => "timestamp"
  }
};

const auth = {
  currentUser: {
    uid: ""
  }
};

test('should render', () => {
  setMessages([])
  render(<GameRoom firestore={firestore} auth={auth}/>)
});

test('if there are no messages the DM should be able to write a Chat', async () => {
  setMessages([]);
  setRole("DM");
  
  render(<GameRoom firestore={firestore} auth={auth}/>);
  userEvent.type(screen.getByTestId("text"), "A message!");
  userEvent.click(screen.getByTestId("send"));
  
  let messages = await screen.findAllByTestId("message");

  expect(messages.length).toBe(1);
  expect(mockedFirestore[0].type).toBe("chat");
});

test('if there are no messages the player should be able to write a Chat', async () => {
  setMessages([]);
  setRole("Player");
  
  render(<GameRoom firestore={firestore} auth={auth}/>);
  userEvent.type(screen.getByTestId("text"), "A message!");
  userEvent.click(screen.getByTestId("send"));
  
  let messages = await screen.findAllByTestId("message");

  expect(messages.length).toBe(1);
  expect(mockedFirestore[0].type).toBe("chat");
});

// test('if there are no messages the DM should be able to write a Prompt', () => {
// });

// test('if there are no messages the player should not be able to write an Action', () => {
// });

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
    auth.currentUser.uid = "78OjG96RrtZi5J3vqUChlmIdL503";
  } else {
    auth.currentUser.uid = "abc";
  }
}