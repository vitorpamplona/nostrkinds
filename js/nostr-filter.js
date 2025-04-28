// fetch events from relay, returns a promise
function matchFilter(filter, event) {
    if (filter.ids && filter.ids.indexOf(event.id) === -1) {
      return false
    }
    if (filter.kinds && filter.kinds.indexOf(event.kind) === -1) {
      return false
    }
    if (filter.authors && filter.authors.indexOf(event.pubkey) === -1) {
      return false
    }

    for (let f in filter) {
      if (f[0] === '#') {
        let tagName = f.slice(1)
        let values = filter[`#${tagName}`]
        if (values && !event.tags.find(([t, v]) => t === tagName && values.indexOf(v) !== -1)) {
          return false
        }
      }
    }
  
    if (filter.since && event.created_at < filter.since) {
      return false
    }
    if (filter.until && event.created_at > filter.until) {
      return false
    }
  
    return true
  }
  
  function matchFilters(filters, event) {
    for (let i = 0; i < filters.length; i++) {
      if (!matchFilter(filters[i], event)) {
        return false
      }
    }
    return true
  }