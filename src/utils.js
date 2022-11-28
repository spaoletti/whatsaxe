// --------------------------------------- players ---------------------------------------

export function isDM(uidObject) {
  return uidObject.uid === "78OjG96RrtZi5J3vqUChlmIdL503" ||
    uidObject.uid === "xjoPcMx0COMHy2wThp7ydAviPw92";
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

export function d(n) {
  return Math.floor(Math.random() * n) + 1;
}

export function parseRoll(rollString) {
  const [howManyTimes, diceType] = rollString.split("d");
  return { howManyTimes, diceType };
}

export function roll(rollExp) {
  const { howManyTimes, diceType } = parseRoll(rollExp);
  let total = 0;
  let rolls = "";
  for (let c = 1; c <= howManyTimes; c++) {
    const roll = d(diceType);
    total += roll;
    rolls += `${roll} + `;
  }
  return { 
    total, 
    rolls: rolls.slice(0, -3)
  };
}

// --------------------------------------- characters ---------------------------------------

const stats = ["str", "dex", "con", "int", "wis", "cha"];

export function getModifierForStat(character, statName) {
  const statValue = character[statName];
  return getModifier(statValue);
}

export function getModifier(statValue) {
  return Math.floor((statValue - 10) / 2);
}

function getCharacterByName(characters, name) {
  return characters.find(c => c.name.toLowerCase() === name.toLowerCase());
}

export function getCharacterByUid(characters, uid) {
  return characters.find(c => c.uid === uid);
}

export function isDead(character) {
  return character.hp <= 0;
}

// --------------------------------------- commands ---------------------------------------

const commands = {
  skillcheck: buildSkillCheckMessage,
  hit: buildHitMessage,
  heal: buildHealMessage,
  askroll: buildAskRollMessage,
  roll: buildRollMessage
}

export function buildMessage(text, type, user, characters, messages) {
  if (isACommand(text, type, user)) {
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

function isACommand(text, type, user) {
  return type === "action" && isDM(user) && text.charAt(0) === "/";
}

export function isCommandName(command, request) {
  return request && request.command.name === command;
}

export function isUnresolved(request) {
  return request && !request.resolved;
}

export function isCommandUnresolved(commandName, request) {
  return isCommandName(commandName, request) && isUnresolved(request);
}

function buildSkillCheckMessage(command, characters, user, messages) {
  validateSyntax(command, 3, "/skillcheck <player_name> <stat> <DC>");
  const character = getCharacterByName(characters, command.args[0]);
  validateTarget(character, command.args[0]);
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
  validateTarget(character, command.args[0]);
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

function buildHealMessage(command, characters, user, messages) {
  validateSyntax(command, 2, "/heal <player_name> <hp>");
  const character = getCharacterByName(characters, command.args[0]);
  validateTarget(character, command.args[0]);
  validateNumber(command.args[1], "Hit Points");
  const lastRequest = getLastRequest(messages, character);
  validateLastRequest(lastRequest, character);
  return commandMessage(
    `${character.name.toUpperCase()}, you gained ${command.args[1]} hit points!`,
    command,
    character,
    user
  );
}

function buildAskRollMessage(command, characters, user, messages) {
  validateSyntax(command, 2, "/askroll <player_name> <die>");
  const character = getCharacterByName(characters, command.args[0]);
  validateTarget(character, command.args[0]);
  validateDice(command.args[1]);
  const lastRequest = getLastRequest(messages, character);
  validateLastRequest(lastRequest, character);
  return commandMessage(
    `${character.name.toUpperCase()}, roll ${command.args[1]}!`,
    command,
    character,
    user
  );
}

function buildRollMessage(command, _, user) {
  validateSyntax(command, 1, "/roll <die>");
  const rollExp = command.args[0];
  validateDice(rollExp);
  const { total, rolls } = roll(rollExp);
  const text = 
    `DUNGEON MASTER rolled ${rollExp}!\n` +
    `${rolls} = ${total}`;
  return {
    text,
    photoURL: user.photoURL,
    type: "chat"
  };
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

function validateTarget(existingCharacter, calledCharacter) {
  validate(
    !existingCharacter || isDead(existingCharacter),
    `Invalid target: ${calledCharacter}`
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

export function validateDice(dice) {
  const diceRegExp = /\dd(4|6|8|10|12|20)/;
  validate(
    !diceRegExp.test(dice),
    `Unknown dice: ${dice}`
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