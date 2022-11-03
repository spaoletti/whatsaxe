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

const validCommands = [
  "skillcheck"
];

export function parseCommand(commandString) {
  const tokens = commandString.split(" ");
  return {
    name: tokens[0].slice(1),
    args: tokens.slice(1)
  }
}

export function buildMessage(text, type, user, characters) {
  if (isCommand(text, type, user)) {
    const command = parseCommand(text);
    if (!validCommands.includes(command.name)) {
      return {
        text: `!!! Unknown command: ${command.name} !!!`,
        photoURL: "https://cdn-icons-png.flaticon.com/512/5219/5219070.png",
        type: "chat",
        private: true
      }
    } 
    return buildSkillCheckMessage(command, characters);
  }   
  return {
    text: text,
    photoURL: user.photoURL,
    type: type
  };  
}

function isCommand(text, type, user) {
  return type === "action" && isDM(user) && text.charAt(0) === "/";
}

function buildSkillCheckMessage(command, characters) {
  for (const character of characters) {
    if (character.name.toLowerCase() === command.args[0].toLowerCase()) {
      return null; // TODO
    }
  }
  return {
    text: `!!! Unknown player: ${command.args[0]} !!!`,
    photoURL: "https://cdn-icons-png.flaticon.com/512/5219/5219070.png",
    type: "chat",
    private: true
  }
}