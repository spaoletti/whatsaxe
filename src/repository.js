export function getSnaphotData(snapshot) {
  return snapshot && snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
}

export function deleteChats(messagesRef) {
  return messagesRef
    .where('type','==',"chat")
    .get().then((result) => 
      result.forEach((doc) => doc.ref.delete())
    );  
}

export function saveMessage(messagesRef, message, uid, timestamp) {
  messagesRef.add({
    ...message,
    uid,
    createdAt: timestamp
  })  
}

export async function resolveRequest(messagesRef, request) {
  return update(messagesRef, request.id, { resolved: true });
}

export async function updateCharacterHp(charactersRef, character, newHp) {
  return update(charactersRef, character.id, { hp: newHp });
}

async function update(ref, id, propsToUpdate) {
  return ref.doc(id).update(propsToUpdate);
}