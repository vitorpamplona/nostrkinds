const fixedRelays = [
  'wss://bitcoiner.social', 
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://a.nos.lol',
  'wss://nostr.bitcoiner.social',
  'wss://nostr.wine',
  'wss://filter.nostr.wine',
  'wss://relay.snort.social',
  'wss://nostr.oxtr.dev',
  'wss://nostr.mom',
  'wss://relay.nostr.band'
]

const buggyRelays = new Set([
  'wss://fonstr-test.onrender.com',
  'wss://fiatjaf.com',
  'wss://pyramid.fiatjaf.com'
])

var allAvailableRelays = []

fetch("https://api.nostr.watch/v1/online")
     .then(response => response.json())
     .then(json => allAvailableRelays = [... new Set(fixedRelays.concat(json))].filter((url) => !buggyRelays.has(url)  ) ); 
