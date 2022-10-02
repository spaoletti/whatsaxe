import { useEffect, useRef, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import ChatMessage from "./ChatMessage";

export default function GameRoom(props) {
  const bottom = useRef();
  const messagesRef = props.firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(25);
  const [messages] = useCollectionData(query);
  const [formValue, setFormValue] = useState("");
  const [isDM, setIsDM] = useState(props.auth.currentUser.uid == "78OjG96RrtZi5J3vqUChlmIdL503");  

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = props.auth.currentUser;
    await messagesRef.add({
      text: formValue,
      createdAt: props.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      type: "chat"
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
      <form onSubmit={sendMessage}>
        <input data-testid="text" value={formValue} onChange={(e) => setFormValue(e.target.value)} />
        <button data-testid="send" type='submit'>Send</button>
      </form>
    </>
  )
}
