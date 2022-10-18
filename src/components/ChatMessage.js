import { isDM } from "../utils";

export default function ChatMessage(props) {
  const { text, uid, photoURL, type } = props.message;
  let messageClass = "";
  if (type === "chat") {
    messageClass = uid === props.user.uid ? "sent" : "received";
  } else {
    messageClass = `action${isDM({ uid: uid }) ? " dm-action" : ""}`;
  }

  return (
    <div 
      data-testid="message" 
      className={`message ${messageClass}`}
    >
      <img alt="avatar" src={photoURL} />
      <p>{text}</p>
    </div>
  )
}
