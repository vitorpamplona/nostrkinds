// button click handler
const crawl = async () => {
  let kind = parseInt($('#kind').val())

  if (kind == undefined || isNaN(kind)) return

  // reset UI
  $('#fetching-status').html('')
  $('#fetching-progress').css('visibility', 'hidden')
  $('#fetching-progress').val(0)
  $('#file-download').html('')
  $('#events-found').text('')

  $('#fetching-relays').html("<tr id=\"fetching-relays-header\"></tr>")
  
  // messages to show to user
  const checkMark = '&#10003;'

  // parse pubkey ('npub' or hexa)
  const relaySet = allAvailableRelays

  // disable button (will be re-enable at the end of the process)
  $('#fetch-and-broadcast').prop('disabled', true)
  $('#just-broadcast').prop('disabled', true)
  // inform user that app is fetching from relays
  $('#fetching-status').text('Fetching from ' + relaySet.length + ' available relays... ')
  // show and update fetching progress bar
  $('#fetching-progress').css('visibility', 'visible')
  $('#fetching-box').css('visibility', 'visible')
  $('#sample-box').css('visibility', 'visible')
  $('#fetching-progress').prop('max', relaySet.length)

  $('#fetching-relays-header-box').css('display', 'flex')
  $('#fetching-relays-box').css('display', 'flex')
  $('#fetching-relays-header').html("<th>Relay</th><th>Status</th><th>Events</th><th>Last Seen</th>")

  // get all events from relays
  let filterObj = [
    {
      kinds: [kind]
    }
  ]

  // events hash
  const events = {}

  // batch processing of 10 relays
  await processInPool(relaySet, (relay) => fetchFromRelay(relay, filterObj, events, "fetching-relays"), 10, (progress) => $('#fetching-progress').val(progress))

  // inform user fetching is done
  $('#fetching-status').html(txt.fetching + checkMark)
  $('#fetching-progress').val(relaySet.length)
}

// Request a weekday along with a long date
const dateOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

function displayLastOne(event) {
  $('#fetching-code').text(JSON.stringify(event, null, 2))
}

function displayRelayStatus(uiBoxPrefix, relay, relayStatus) {
  let msg = ""

  if (relayStatus.message)
    msg = relayStatus.message
    
  let lastSeen = "" 

  if (relayStatus.lastEvent) {
    lastSeen = new Date(relayStatus.lastEvent.created_at * 1000).toLocaleDateString("en-US", dateOptions)
  }

  const relayName = relay.replace("wss://", "").replace("ws://", "").split("#")[0].split("?")[0].split("/")[0]
  let line = "<td>" + relayName + "</td><td>" + relayStatus.status + "<td>" + relayStatus.count + "</td><td>" + lastSeen + "</td>"

  const elemId = uiBoxPrefix+relayName.replaceAll(".", "").replaceAll("/", "").replaceAll("-", "").replaceAll(":", "").replaceAll("%", "").replaceAll("⬤ ", "").replaceAll(" ", "").replaceAll("@", "").replaceAll("	", "")

  if (elemId.trim() !== "") { 
    if ($('#' + elemId).length > 0) {
      $('#' + elemId).html(line)
    } else {
      $('#'+uiBoxPrefix).append(
        $("<tr>" +line+ "</tr>").attr('id', elemId)
      )
    }
  }
}

// fetch events from relay, returns a promise
function fetchFromRelay(relay, filters, events, uiBox) {
  let relayStatus = {
    lastEvent: undefined,
    count: 0
  }

  return openRelay(
      relay, 
      filters,
      [],
      (state) => {
        if (state && relayStatus.status != state && !(state == "Done" && (relayStatus.status == "Auth Fail" || relayStatus.status == "Error"))) {
          relayStatus.status = state
          displayRelayStatus(uiBox, relay, relayStatus)
        }
      },
      (event) => { 
        if (!relayStatus.lastEvent || event.created_at > relayStatus.lastEvent.created_at) {
          relayStatus.lastEvent = event
        }
        relayStatus.count = relayStatus.count + 1

        displayRelayStatus(uiBox, relay, relayStatus)

        // prevent duplicated events
        if (events[event.id]) return
        else events[event.id] = event.id

        if (events["lastOne"] == undefined || event.created_at > events["lastOne"].created_at) {
          events["lastOne"] = event
          displayLastOne(event)
        }

        // show how many events were found until this moment
        $('#events-found').text(`${Object.keys(events).length} unique events found`)
      }, 
      (eventId, inserted, message) => {}, 
      (newFilter) => { 
        if (newFilter.until && relayStatus.until != newFilter.until) {
          relayStatus.until = newFilter.until
          displayRelayStatus(uiBox, relay, relayStatus)
        }
      },
      (errorMessage) => {
        if (errorMessage && relayStatus.message != errorMessage) {
          relayStatus.message = errorMessage
          displayRelayStatus(uiBox, relay, relayStatus)
        }
      }
    )
}