import { isDM } from "../utils";

export default function ChatMessage(props) {
  const { text, uid, photoURL, type } = props.message;
  let messageClass;
  let authorName = (props.character) ? props.character.name : "Dungeon Master";
  if (type === "chat") {
    messageClass = uid === props.user.uid ? "sent" : "received";
  } else if (type === "action") {
    messageClass = `action${isDM({ uid: uid }) ? " dm-action" : ""}`;
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
