import { useRef, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import ChatMessage from "./ChatMessage";

export default function GameRoom(props) {
  const bottom = useRef();
  const messagesRef = props.firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(100);
  const [messages] = useCollectionData(query);
  const [formValue, setFormValue] = useState("");
  const [isDM, setIsDM] = useState(props.auth.currentUser.uid === "78OjG96RrtZi5J3vqUChlmIdL503");  

  const sendMessage = async (messageType) => {
    const { uid, photoURL } = props.auth.currentUser;
    await messagesRef.add({
      text: formValue,
      createdAt: props.firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      type: messageType
    });
    setFormValue("");
    bottom.current.scrollIntoView();
  }

  return (
    <>
      <main>
        {messages && messages.map((msg, idx) => <ChatMessage key={idx} message={msg} auth={props.auth} />)}
        <div ref={bottom}></div>
      </main>
      <form>
        <input data-testid="text" value={formValue} onChange={(e) => setFormValue(e.target.value)} />
        <button onClick={() => sendMessage("chat")} data-testid="send" type="button">Chat</button>
        <button onClick={() => sendMessage("prompt")} data-testid="send-prompt" type="button">Prompt</button>
      </form>
    </>
  )
}
