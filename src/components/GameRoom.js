import { useEffect, useRef, useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { deleteChats, getSnaphotData, resolveRequest, saveMessage, updateCharacterHp } from "../repository";
import { buildMessage, d20, getCharacterByUid, getLastAction, getLastRequest as getLastRequestForAPlayer, getModifierForStat, isDead, isFromTheDM, isPlayer } from "../utils";
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
  const lastRequestForMe = getLastRequestForAPlayer(messages, props.user);
  const isCharactersLoading = !characters;
  const playerCharacter = !isCharactersLoading && getCharacterByUid(characters, props.user.uid);
  const isPlayerDead = !isCharactersLoading && isPlayer(props.user) && isDead(playerCharacter);
  const isInputEmpty = inputText.trim().length === 0;  
  const isChatDisabled = isInputEmpty || inputText.charAt(0) === "/";  
  const isActionDisabled = isInputEmpty || isPlayerDead || (isPlayer(props.user) && !isFromTheDM(lastAction));

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
    const modifier = getModifierForStat(playerCharacter, stat);
    const result = die + modifier;
    const outcome = (result >= dc) ? "success" : "failure";
    const message = 
      `${playerCharacter.name.toUpperCase()} rolled a ${die}!\n` +
      `${die} + ${modifier} = ${result}\n` +
      `It's a ${outcome}!`
    resolveRequest(messagesRef, rollRequest);
    sendMessage("chat", message);
  }

  function loseHp(hitRequest) {
    const newHp = playerCharacter.hp - hitRequest.command.args[1];
    updateCharacterHp(charactersRef, playerCharacter, newHp);    
    resolveRequest(messagesRef, hitRequest).then(_ => {
      if (newHp <= 0) {
        sendMessage("chat", `${playerCharacter.name.toUpperCase()}, you are dead.`);
      }      
    });
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

  useEffect(() => {
    if (lastRequestForMe && lastRequestForMe.command.name === "hit" && !lastRequestForMe.resolved) {
      loseHp(lastRequestForMe);
    }
  // eslint-disable-next-line
  }, [messages]);

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
        {lastRequestForMe && lastRequestForMe.command.name === "skillcheck" && !lastRequestForMe.resolved &&
          <button
            disabled={isCharactersLoading} 
            onClick={(e) => roll(lastRequestForMe)} 
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
