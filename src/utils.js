export function isDM(userOrMessage) {
  return userOrMessage.uid === "78OjG96RrtZi5J3vqUChlmIdL503";
}

export function isPlayer(userOrMessage) {
  return !isDM(userOrMessage);
}

export function isFromTheDM(message) {
  return message && isDM(message);
}

export function getLastAction(messages) {
  if (!messages) {
    return null;
  }
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.type === "action") {
      return message;
    }
  }
}

export function parseCommand(commandString) {
  const tokens = commandString.split(" ");
  const name = tokens[0].slice(1);
  return {
    error: true,
    name: name,
  };
}

export function buildMessage(text, type, user) {
  if (type === "action" && isDM(user) && text.charAt(0) === "/") {
    const command = parseCommand(text);
    if (command.error) {
      return {
        text: `!!! Unknown command: ${command.name} !!!`,
        photoURL: "https://cdn-icons-png.flaticon.com/512/5219/5219070.png",
        type: "chat",
        private: true
      }
    } 
  }   
  return {
    text: text,
    photoURL: user.photoURL,
    type: type
  };  
}