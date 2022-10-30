export function isDM(userOrMessage) {
  return userOrMessage.uid === "78OjG96RrtZi5J3vqUChlmIdL503";
}

export function isFromTheDM(message) {
  return message && isDM(message);
}

export function getLastAction(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.type === "action") {
      return message;
    }
  }
}