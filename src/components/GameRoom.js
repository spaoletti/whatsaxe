import { useRef, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { buildMessage, getLastAction, isFromTheDM, isPlayer } from "../utils";
import ChatMessage from "./ChatMessage";

export default function GameRoom(props) {
  const bottom = useRef();
  const messagesRef = props.firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(100);
  const [messages] = useCollectionData(query);  
  const [inputText, setInputText] = useState("");
  const lastAction = getLastAction(messages);
  const inputIsEmpty = inputText.trim().length === 0;

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
      props.characters
    );
    if (message.type === "action") {
      deleteChats(messagesRef);
    }
    messagesRef.add({
      ...message,
      uid: props.user.uid,
      createdAt: props.firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => { 
      bottom.current.scrollIntoView(); 
    });
  }

  return (
    <>
      <main>
        {messages && messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} user={props.user} />
        ))}
        <div ref={bottom}></div>
      </main>
      <form>
        <input 
          data-testid="text" 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
        />
        <button 
          disabled={inputIsEmpty || inputText.charAt(0) === "/"}
          onClick={() => sendMessage("chat")} 
          data-testid="send" 
          type="button"
        >
          Chat
        </button>
        <button 
          disabled={inputIsEmpty || (isPlayer(props.user) && !isFromTheDM(lastAction))} 
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
