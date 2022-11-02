import { useRef, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { buildMessage, getLastAction, isDM, isFromTheDM, isPlayer } from "../utils";
import ChatMessage from "./ChatMessage";

export default function GameRoom(props) {
  const bottom = useRef();
  const messagesRef = props.firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(100);
  const [messages] = useCollectionData(query);  
  const [inputText, setInputText] = useState("");
  const lastAction = getLastAction(messages);

  const deleteChats = (messagesRef) => {
    const query = messagesRef.where('type','==',"chat");
    query.get().then((result) => result.forEach((doc) => doc.ref.delete()));  
  }

  const sendMessage = async (type) => {
    const text = inputText.trim();
    if (text === "") {
      return;
    }
    if (type === "action" && isPlayer(props.user) && !isFromTheDM(lastAction)) {
      return;
    }
    setInputText("");
    const message = buildMessage(
      text, 
      type, 
      props.user 
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
          disabled={inputText.length === 0 || inputText.charAt(0) === "/"}
          onClick={() => sendMessage("chat")} 
          data-testid="send" 
          type="button"
        >
          Chat
        </button>
        <button 
          disabled={inputText.length === 0 || (!isDM(props.user) && (!messages || messages.length === 0 || !isFromTheDM(lastAction)))} 
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
