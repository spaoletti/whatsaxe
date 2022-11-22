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
  return findLastMessageThatMatchCriteria(messages, m => m.type === "action");
}

export function getLastRequest(messages, user) {
  return findLastMessageThatMatchCriteria(messages, m => m.target === user.uid);
}

function findLastMessageThatMatchCriteria(messages, condition) {
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

const stats = ["str", "dex", "con", "int", "wis", "cha"];

export function getStatModifier(character, stat) {
  const statValue = character[stat];
  return (statValue - 10) / 2;
}

function getCharacterByName(characters, name) {
  return characters.find(c => c.name.toLowerCase() === name.toLowerCase());
}

export function getCharacterByUid(characters, uid) {
  return characters.find(c => c.uid === uid);
}

// --------------------------------------- commands ---------------------------------------

const commands = {
  skillcheck: buildSkillCheckMessage,
  hit: buildHitMessage
}

export function buildMessage(text, type, user, characters, messages) {
  if (isCommand(text, type, user)) {
    const command = parseCommand(text);
    let message;
    try {
      validateCommandName(command);
      const buildFn = commands[command.name];
      message = buildFn(command, characters, user, messages);
    } catch (e) {
      message = e.errorMessage;
    }
    return message;
  }   
  return {
    text: text,
    photoURL: user.photoURL,
    type: type
  };  
}

export function parseCommand(commandString) {
  const tokens = commandString.split(" ");
  return {
    name: tokens[0].slice(1),
    args: tokens.slice(1)
  }
}

function isCommand(text, type, user) {
  return type === "action" && isDM(user) && text.charAt(0) === "/";
}

function buildSkillCheckMessage(command, characters, user, messages) {
  validateSyntax(command, 3, "/skillcheck <player_name> <stat> <DC>");
  const character = getCharacterByName(characters, command.args[0]);
  validateCharacter(character, command.args[0]);
  validateStat(command.args[1]);
  validateNumber(command.args[2], "DC");
  const lastRequest = getLastRequest(messages, character);
  validateLastRequest(lastRequest, character);
  return commandMessage(
    `${character.name.toUpperCase()}, make a ${command.args[1].toUpperCase()} skill check! (DC ${command.args[2]})`,
    command,
    character,
    user
  );
}

function buildHitMessage(command, characters, user, messages) {
  validateSyntax(command, 2, "/hit <player_name> <hp>");
  const character = getCharacterByName(characters, command.args[0]);
  validateCharacter(character, command.args[0]);
  validateNumber(command.args[1], "Hit Points");
  const lastRequest = getLastRequest(messages, character);
  validateLastRequest(lastRequest, character);
  return commandMessage(
    `${character.name.toUpperCase()}, you lost ${command.args[1]} hit points!`,
    command,
    character,
    user
  );
}

const commandMessage = (text, command, character, user) => ({
  text,
  photoURL: user.photoURL,
  type: "chat",
  target: character.uid,
  command: command
})

// --------------------------------------- commands validation ---------------------------------------

function validateCommandName(command) {
  validate(
    !commands[command.name],
    `Unknown command: ${command.name}`
  );
}

function validateSyntax(command, numberOfArguments, correctSyntax) {
  validate(
    command.args.length !== numberOfArguments,
    `Wrong number of arguments. Correct syntax: ${correctSyntax}`
  );
}

function validateCharacter(existingCharacter, calledCharacter) {
  validate(
    !existingCharacter,
    `Unknown player: ${calledCharacter}`
  );
}

function validateNumber(n, desc) {
  validate(
    isNaN(n),
    `${desc} must be a number. Provided: ${n}`
  );
}

function validateStat(calledStat) {
  validate(
    !stats.includes(calledStat.toLowerCase()),
    `Unknown stat: ${calledStat}`
  );
}

function validateLastRequest(lastRequest, character) {
  validate(
    lastRequest && lastRequest.target === character.uid && !lastRequest.resolved,
    `${character.name} has another request pending`
  );
}

function validate(errorCondition, errorText) {
  if (errorCondition) {
    const e = new Error(errorText);
    e.errorMessage = {
      text: `!!! ${errorText} !!!`,
      photoURL: "https://cdn-icons-png.flaticon.com/512/5219/5219070.png",
      type: "chat",
      private: true
    };
    throw e;
  }
}
