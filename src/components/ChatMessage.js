import { isDM } from "../utils";

export default function ChatMessage(props) {
  const { text, uid, photoURL, type } = props.message;
  let messageClass;
  let authorName;
  if (type === "chat") {
    messageClass = uid === props.user.uid ? "sent" : "received";
    authorName = props.user.displayName;
  } else if (type === "action") {
    messageClass = `action${isDM({ uid: uid }) ? " dm-action" : ""}`;
    authorName = (props.character || { name: "Dungeon Master" }).name;
  }

  return (
    <div 
      data-testid="message" 
      className={`message ${messageClass}`}
    >
      <img alt="avatar" src={photoURL} />
      <p><span>{authorName}</span>{text}</p>
    </div>
  )
}
