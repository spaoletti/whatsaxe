export default function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;
  const messageClass = uid === props.user.uid ? "sent" : "received";
  return (
    <div data-testid="message" className={`message ${messageClass}`}>
      <img alt="avatar" src={photoURL} />
      <p>{text}</p>
    </div>
  )
}
