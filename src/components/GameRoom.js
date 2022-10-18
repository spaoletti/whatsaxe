import { useRef, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { isDM } from "../utils";
import ChatMessage from "./ChatMessage";

export default function GameRoom(props) {
  const bottom = useRef();
  const messagesRef = props.firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(100);
  const [messages] = useCollectionData(query);
  const [formValue, setFormValue] = useState("");

  const sendMessage = async (messageType) => {
    setFormValue("");
    const { uid, photoURL } = props.user;
    if (!isDM(props.user) && messages.length === 0 && messageType === "action") {
      return;
    }
    if (messageType === "action") {
      const query = messagesRef.where('type','==',"chat");
      query.get().then((result) => result.forEach((doc) => doc.ref.delete()));
    }
    messagesRef.add({
      text: formValue,
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
          onClick={() => sendMessage("chat")} 
          data-testid="send" 
          type="button"
        >
          Chat
        </button>
        <button 
          disabled={!isDM(props.user) && (!messages || messages.length === 0)} 
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
