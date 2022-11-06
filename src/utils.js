// --------------------------------------- players ---------------------------------------

export function isDM(uidObject) {
  return uidObject.uid === "78OjG96RrtZi5J3vqUChlmIdL503";
}

export function isPlayer(uidObject) {
  return !isDM(uidObject);
}

export function isFromTheDM(message) {
  return message && isDM(message);
}

// --------------------------------------- messages ---------------------------------------

export function getLastAction(messages) {
  return findLastMessage(messages, m => m.type === "action");
}

export function getLastRollRequest(messages, user) {
  return findLastMessage(messages, m => m.target === user.uid);
}

function findLastMessage(messages, condition) {
  if (!messages) {
    return null;
  }
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (condition(message)) {
      return message;
    }  
  }
  return null;
}

// --------------------------------------- dice ---------------------------------------

export function d20() {
  return Math.floor(Math.random() * 20) + 1;
}

// --------------------------------------- characters ---------------------------------------

export function buildCharacters(docs) {
  return docs.map(d => buildCharacter(d));
}

function buildCharacter(doc) {
  doc.modifier = function(stat) {
    const statValue = this[stat];
    return (statValue - 10) / 2;
  }
  return doc;  
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

export function buildMessage(text, type, user, characters, messages) {
  if (isCommand(text, type, user)) {
    const command = parseCommand(text);
    if (!validCommands.includes(command.name)) {
      return errorMessage(`Unknown command: ${command.name}`);
    } 
    return buildSkillCheckMessage(command, characters, user, messages);
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

function buildSkillCheckMessage(command, characters, user, messages) {
  if (command.args.length !== 3) {
    return errorMessage(`Wrong number of arguments. Correct syntax: /skillcheck <player_name> <stat> <DC>`);
  }
  const character = characters.find(c => c.name.toLowerCase() === command.args[0].toLowerCase());
  if (!character) {
    return errorMessage(`Unknown player: ${command.args[0]}`);
  }
  if (!stats.includes(command.args[1].toLowerCase())) {
    return errorMessage(`Unknown stat: ${command.args[1]}`);
  }
  if (isNaN(command.args[2])) {
    return errorMessage(`DC must be a number. Provided: ${command.args[2]}`);
  }
  const lastRollRequest = getLastRollRequest(messages, character);
  if (lastRollRequest && lastRollRequest.target === character.uid && !lastRollRequest.resolved) {
    return errorMessage(`${character.name} has a skill check pending`);
  }
  return {
    text: `${character.name.toUpperCase()}, make a ${command.args[1].toUpperCase()} skill check! (DC ${command.args[2]})`,
    photoURL: user.photoURL,
    type: "chat",
    target: character.uid,
    command: command
  }
}

function errorMessage(message) {
  return {
    text: `!!! ${message} !!!`,
    photoURL: "https://cdn-icons-png.flaticon.com/512/5219/5219070.png",
    type: "chat",
    private: true
  }        
}