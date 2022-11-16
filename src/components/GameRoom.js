import { useEffect, useRef, useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { buildCharacters, buildMessage, d20, getLastAction, getLastRollRequest, isFromTheDM, isPlayer } from "../utils";
import ChatMessage from "./ChatMessage";

export default function GameRoom(props) {
  const bottom = useRef();
  const messagesRef = props.firestore.collection("messages");
  const messagesQuery = messagesRef.orderBy("createdAt").limit(100);
  const [messagesSnapshot] = useCollection(messagesQuery);
  const messages = messagesSnapshot && messagesSnapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  const charactersQuery = props.firestore.collection("characters");
  const [charactersSnapshot] = useCollection(charactersQuery);
  const characters = 
    charactersSnapshot && 
    buildCharacters(charactersSnapshot.docs.map(d => d.data()));
  const [inputText, setInputText] = useState("");
  const inputIsEmpty = inputText.trim().length === 0;
  const lastAction = getLastAction(messages);
  const rollRequest = getLastRollRequest(messages, props.user);

  const deleteChats = (messagesRef) => {
    messagesRef
      .where('type','==',"chat")
      .get().then((result) => 
        result.forEach((doc) => doc.ref.delete())
      );  
  }
  
  const sendMessage = (type, text) => {
    setInputText("");
    const message = buildMessage(
      text.trim(), 
      type, 
      props.user,
      characters,
      messages
    );
    if (message.type === "action") {
      deleteChats(messagesRef);
    }
    messagesRef.add({
      ...message,
      uid: props.user.uid,
      createdAt: props.firebase.firestore.FieldValue.serverTimestamp()
    })
  }

  const resolveRollRequest = (rollRequest) => {
    messagesRef.doc(rollRequest.id).update({ resolved: true });    
  }

  function roll(rollRequest) {
    const die = d20();
    const stat = rollRequest.command.args[1];
    const dc = rollRequest.command.args[2];
    const pc = characters.find(c => c.uid === props.user.uid);
    const modifier = pc.modifier(stat);
    const result = die + modifier;
    const outcome = (result >= dc) ? "success" : "failure";
    const message = 
      `${pc.name.toUpperCase()} rolled a ${die}!\n` +
      `${die} + ${modifier} = ${result}\n` +
      `It's a ${outcome}!`
    resolveRollRequest(rollRequest);
    sendMessage("chat", message);
  }

  const isChatDisabled = () => inputIsEmpty || inputText.charAt(0) === "/";
  
  const isActionDisabled = () => inputIsEmpty || (isPlayer(props.user) && !isFromTheDM(lastAction));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {      
      e.preventDefault();
      if (isChatDisabled()) {
        return;
      }
      sendMessage("chat", inputText);
    }
  }

  useEffect(() => {
    bottom.current.scrollIntoView();
  });

  return (
    <>
      <main>
        {messages && messages
          .filter(m => !m.private || m.uid === props.user.uid)
          .map((msg, idx) => (
            <ChatMessage key={idx} message={msg} user={props.user} />
          ))
        }
        <div ref={bottom}></div>
      </main>
      <form onKeyDown={handleKeyDown}>
        {rollRequest && !rollRequest.resolved &&
          <button
            disabled={!characters} 
            onClick={(e) => roll(rollRequest)} 
            data-testid="roll" 
            type="button"
          >
            Roll
          </button>
        }
        <input 
          data-testid="text" 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
        />
        <button 
          disabled={!characters || isChatDisabled()}
          onClick={() => sendMessage("chat", inputText)} 
          data-testid="send" 
          type="button"
        >
          Chat
        </button>
        <button 
          disabled={!characters || isActionDisabled()} 
          onClick={() => sendMessage("action", inputText)} 
          data-testid="send-action" 
          type="button"
        >
          Play
        </button>
      </form>
    </>
  )
}
