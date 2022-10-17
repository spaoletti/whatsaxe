export default function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;
  const messageClass = uid === props.auth.currentUser.uid ? "sent" : "received";
  return (
    <div data-testid="message" className={`message ${messageClass}`}>
      <img src={photoURL} />
      <p>{text}</p>
    </div>
  )
}