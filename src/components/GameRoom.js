import { useEffect, useRef, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { buildMessage, getLastAction, getLastRollRequest, isFromTheDM, isPlayer } from "../utils";
import ChatMessage from "./ChatMessage";
import RollButton from "./RollButton";

export default function GameRoom(props) {
  const bottom = useRef();
  const messagesRef = props.firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(100);
  const [messages] = useCollectionData(query);  
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
  
  const sendMessage = async (type) => {
    setInputText("");
    const message = buildMessage(
      inputText.trim(), 
      type, 
      props.user,
      props.characters,
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

  const isChatDisabled = () => inputIsEmpty || inputText.charAt(0) === "/";
  
  const isActionDisabled = () => inputIsEmpty || (isPlayer(props.user) && !isFromTheDM(lastAction));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {      
      e.preventDefault();
      if (isChatDisabled()) {
        return;
      }
      sendMessage("chat");
    }
  }

  useEffect(() => {
    bottom.current.scrollIntoView();
  });

  return (
    <>
      <main>
        {messages && messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} user={props.user} />
        ))}
        <div ref={bottom}></div>
        {rollRequest && <RollButton/>}
      </main>
      <form onKeyDown={handleKeyDown}>
        <input 
          data-testid="text" 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
        />
        <button 
          disabled={isChatDisabled()}
          onClick={() => sendMessage("chat")} 
          data-testid="send" 
          type="button"
        >
          Chat
        </button>
        <button 
          disabled={isActionDisabled()} 
          onClick={() => sendMessage("action")} 
          data-testid="send-action" 
          type="button"
        >
          Play!
        </button>
      </form>
    </>
  )
}
