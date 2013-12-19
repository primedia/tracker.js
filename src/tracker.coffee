define ['jquery', 'primedia_events', 'utils'], ($, events, utils) ->
  _read = (key, not_found={}) ->
    data = localStorage.getItem(key)
    if data? then JSON.parse(data) else not_found

  _write = (key, value) ->
    localStorage.setItem(key, JSON.stringify(value))
    value

  return {
    path: -> window.location.pathname

    path_and_query: -> window.location.pathname + window.location.search

    path_refinements: -> $("head meta[name='refinements']").attr('content') || null

    key: (type="refined") ->
      switch type
        when "refined" then @path()
        when "base" then @path().split(@path_refinements()).shift()

    track: ->
      count = @peek('count', 0) + 1
      @save('count', count)

    save: (item, value, type) ->
      key = @key(type)
      prefill_data = utils.getPageInfo(key)

      record = _read(key, prefill_data)
      record[item] = value
      _write key, record

      record

    peek: (item, not_found=0, type) ->
      record = _read(@key(type))
      if record[item]? then record[item] else not_found

    number_of_visits: -> @peek('count')

    refinements: -> @peek('nodes', [])

    number_of_refinements: -> @peek('nodes', []).length

    type: -> @peek('type', '')

    searchType: -> @peek('searchType', '')
  }
