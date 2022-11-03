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

// --------------------------------------- commands ---------------------------------------

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
      return errorMessage(`!!! Unknown command: ${command.name} !!!`);
    } 
    return buildSkillCheckMessage(command, characters);
  }   
  return {
    text: text,
    photoURL: user.photoURL,
    type: type
  };  
}

const stats = ["str", "dex", "con", "int", "wis", "cha"];

function isCommand(text, type, user) {
  return type === "action" && isDM(user) && text.charAt(0) === "/";
}

function buildSkillCheckMessage(command, characters) {
  if (!characterIsInTheParty(command.args[0], characters)) {
    return errorMessage(`!!! Unknown player: ${command.args[0]} !!!`);
  }
  if (!stats.includes(command.args[1].toLowerCase())) {
    return errorMessage(`!!! Unknown stat: ${command.args[1]} !!!`);
  }
  return null; // TODO
}

function characterIsInTheParty(name, characters) {
  for (const character of characters) {
    if (character.name.toLowerCase() === name.toLowerCase()) {
      return true;
    }
  }
  return false;
}

function errorMessage(message) {
  return {
    text: message,
    photoURL: "https://cdn-icons-png.flaticon.com/512/5219/5219070.png",
    type: "chat",
    private: true
  }        
}