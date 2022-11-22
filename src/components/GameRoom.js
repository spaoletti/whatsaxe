import { useEffect, useRef, useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { deleteChats, getSnaphotData, resolveRequest, saveMessage, updateCharacterHp } from "../repository";
import { buildMessage, d20, getCharacterByUid, getLastAction, getLastRequest, getStatModifier, isFromTheDM, isPlayer } from "../utils";
import ChatMessage from "./ChatMessage";

export default function GameRoom(props) {
  const bottom = useRef();
  const [inputText, setInputText] = useState("");

  const messagesRef = props.firestore.collection("messages");
  const [messagesSnapshot] = useCollection(messagesRef.orderBy("createdAt").limit(100));
  const messages = getSnaphotData(messagesSnapshot);

  const charactersRef = props.firestore.collection("characters");
  const [charactersSnapshot] = useCollection(charactersRef);
  const characters = getSnaphotData(charactersSnapshot);

  const lastAction = getLastAction(messages);
  const lastRequest = getLastRequest(messages, props.user);

  const isInputEmpty = inputText.trim().length === 0;  
  const isChatDisabled = isInputEmpty || inputText.charAt(0) === "/";  
  const isActionDisabled = isInputEmpty || (isPlayer(props.user) && !isFromTheDM(lastAction));
  const isCharactersLoading = !characters;

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
    saveMessage(
      messagesRef, 
      message, 
      props.user.uid, 
      props.firebase.firestore.FieldValue.serverTimestamp()
    );
  }

  function roll(rollRequest) {
    const die = d20();
    const stat = rollRequest.command.args[1];
    const dc = rollRequest.command.args[2];
    const character = characters.find(c => c.uid === props.user.uid);
    const modifier = getStatModifier(character, stat);
    const result = die + modifier;
    const outcome = (result >= dc) ? "success" : "failure";
    const message = 
      `${character.name.toUpperCase()} rolled a ${die}!\n` +
      `${die} + ${modifier} = ${result}\n` +
      `It's a ${outcome}!`
    resolveRequest(messagesRef, rollRequest);
    sendMessage("chat", message);
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {      
      e.preventDefault();
      if (isChatDisabled) {
        return;
      }
      sendMessage("chat", inputText);
    }
  }

  useEffect(() => {
    bottom.current.scrollIntoView();
  });

  if (lastRequest && lastRequest.command.name === "hit" && !lastRequest.resolved) {
    const character = getCharacterByUid(characters, props.user.uid);
    const newHp = character.hp - lastRequest.command.args[1];
    updateCharacterHp(charactersRef, character, newHp);
    resolveRequest(messagesRef, lastRequest);
  }

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
        {lastRequest && lastRequest.command.name === "skillcheck" && !lastRequest.resolved &&
          <button
            disabled={isCharactersLoading} 
            onClick={(e) => roll(lastRequest)} 
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
          disabled={isChatDisabled}
          onClick={() => sendMessage("chat", inputText)} 
          data-testid="send" 
          type="button"
        >
          Chat
        </button>
        <button 
          disabled={isCharactersLoading || isActionDisabled} 
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
