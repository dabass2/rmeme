const KEY = 'rmeme-votes'

/** Votes cast this browser session, so a meme can only be voted on once. */
export function getVote(id: number): 1 | -1 | undefined {
  try {
    const votes = JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
    return votes[id]
  } catch {
    return undefined
  }
}

export function saveVote(id: number, vote: 1 | -1) {
  try {
    const votes = JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
    votes[id] = vote
    sessionStorage.setItem(KEY, JSON.stringify(votes))
  } catch {}
}
