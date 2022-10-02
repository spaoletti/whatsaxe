import { useRef, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import firebase from 'firebase/compat/app';
import ChatMessage from "./ChatMessage";

export default function GameRoom(props) {
  const bottom = useRef();
  const messagesRef = props.firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(25);
  const [messages] = useCollectionData(query);
  const [formValue, setFormValue] = useState("");
  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = props.auth.currentUser;
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
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
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} />
        <button type='submit'>Send</button>
      </form>
    </>
  )
}
