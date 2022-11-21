import { useEffect, useRef, useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { buildCharacters, buildMessage, d20, getCharacterByUid, getLastAction, getLastRequest, isFromTheDM, isPlayer } from "../utils";
import ChatMessage from "./ChatMessage";

export default function GameRoom(props) {
  const bottom = useRef();

  const messagesRef = props.firestore.collection("messages");
  const messagesQuery = messagesRef.orderBy("createdAt").limit(100);
  const [messagesSnapshot] = useCollection(messagesQuery);
  const messages = 
    messagesSnapshot && 
    messagesSnapshot.docs.map(d => ({ ...d.data(), id: d.id }));

  const lastAction = getLastAction(messages);
  const lastRequest = getLastRequest(messages, props.user);

  const charactersRef = props.firestore.collection("characters");
  const [charactersSnapshot] = useCollection(charactersRef);
  const characters = 
    charactersSnapshot && 
    buildCharacters(charactersSnapshot.docs.map(d => ({ ...d.data(), id: d.id })));

  const [inputText, setInputText] = useState("");
  const inputIsEmpty = inputText.trim().length === 0;  

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

  const resolveRequest = (request) => {
    messagesRef.doc(request.id).update({ resolved: true });    
  }

  const updateCharacterHp = (docId, newHp) => {
    charactersRef.doc(docId).update({ hp: newHp });    
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
    resolveRequest(rollRequest);
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

  if (lastRequest && lastRequest.command.name === "hit" && !lastRequest.resolved) {
    const character = getCharacterByUid(characters, props.user.uid);
    const newHp = character.hp - lastRequest.command.args[1];
    updateCharacterHp(character.id, newHp);
    resolveRequest(lastRequest);
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
            disabled={!characters} 
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
