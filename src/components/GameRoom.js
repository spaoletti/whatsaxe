import { useRef, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { getLastAction, isDM, isFromTheDM } from "../utils";
import ChatMessage from "./ChatMessage";

export default function GameRoom(props) {
  const bottom = useRef();
  const messagesRef = props.firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(100);
  const [messages] = useCollectionData(query);  
  const [formValue, setFormValue] = useState("");
  const lastAction = getLastAction(messages);

  const sendMessage = async (messageType) => {
    const msgText = formValue.trim();
    if (msgText === "") {
      return;
    }
    setFormValue("");
    const { uid, photoURL } = props.user;
    if (!isDM(props.user) && !isFromTheDM(lastAction) && messageType === "action") {
      return;
    }
    if (messageType === "action") {
      const query = messagesRef.where('type','==',"chat");
      query.get().then((result) => result.forEach((doc) => doc.ref.delete()));
    }
    messagesRef.add({
      text: msgText,
      createdAt: props.firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      type: messageType
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
          value={formValue} 
          onChange={(e) => setFormValue(e.target.value)} 
        />
        <button 
          disabled={formValue.length === 0}
          onClick={() => sendMessage("chat")} 
          data-testid="send" 
          type="button"
        >
          Chat
        </button>
        <button 
          disabled={formValue.length === 0 || (!isDM(props.user) && (!messages || messages.length === 0 || !isFromTheDM(lastAction)))} 
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
