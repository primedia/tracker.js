define(['jquery'], function (jQuery) {
  var ONESEARCH_OPTIONS;
  var INVALID_QUERIES = [""];
  var PROCESSING = false;

  if (typeof (jQuery) != "undefined") {
    jQuery.fn.onesearch = function (options) {
      setupOptions(options);
      jQuery(this).bind("submit", getSeoPath);
    };
    jQuery.fn.oneautocomplete = function (options) {
      setupOptions(options);
      jQuery("body").append("<input type='hidden' id='seopath'/>");
      jQuery("body").append("<input type='hidden' id='geocode'/>");
      jQuery("body").append("<input type='hidden' id='radius'/>");
      jQuery("body").append("<input type='hidden' id='sortfield'/>");
      jQuery("body").append("<input type='hidden' id='hood_name'/>");
      jQuery("body").append("<input type='hidden' id='hood_city'/>");
      jQuery("body").append("<input type='hidden' id='hood_state'/>");
      jQuery(this).autocomplete(ONESEARCH_URL + "/autocomplete?callback=?", {
        dataType: "json",
        highlight: options.highlight,
        minChars: 3,
        delay: 200,
        cacheLength: 1000,
        max: 10,
        matchSubset: 1,
        matchContains: 0,
        onSelect: selectLocation
      }).result(function (event, item) {
        jQuery(this).attr("value", item[0]);
        jQuery("#seopath").attr("value", item[1]);
        jQuery("#geocode").attr("value", item[2]);
        jQuery("#radius").attr("value", item[3]);
        jQuery("#sortfield").attr("value", item[4]);
        jQuery("#hood_name").attr("value", item[6]);
        jQuery("#hood_city").attr("value", item[7]);
        jQuery("#hood_state").attr("value", item[8]);
        PROCESSING = true;
      });
    };

    Search = function (controller) {
      this.controller = controller;
    };

    Search.prototype.execute = function (query) {
      var newQuery = query.replace(/=/g, '');
      if (this.invalid(query)) {
        jQuery("body").trigger({
          type: "onesearch-error-invalid",
          query: query
        });
        PROCESSING = false;
        return false;
      }
      this.controller.seoPath(newQuery);
    };
    Search.prototype.invalid = function (query) {
      if (jQuery.inArray(query, INVALID_QUERIES) >= 0) {
        return true;
      }
      return false;
    };
    OnesearchService = function (channel) {
      this.channel = channel;
    };
    OnesearchService.prototype.seoPath = function (query) {
      var self = this;
      jQuery.getJSON(ONESEARCH_URL + "/seopath?callback=?", {
        q: query,
        channel: this.channel,
        application: APPLICATION
      }, function (response) {
        if (response.seopath) {
          self.handleSuccess(response);
        } else {
          self.handleError(response);
        }
      });
    };
    OnesearchService.prototype.handleSuccess = function (response) {
      var seoPath = response.seopath;
      jQuery("#search_form").unbind("submit", getSeoPath);
      jQuery("body").trigger({
        type: "onesearch-success",
        seoPath: seoPath,
        query: response.query,
        geocode: response.geocode,
        radius: response.radius,
        sortfield: response.sortfield,
        hoodName: response.hood_name,
        hoodCity: response.hood_city,
        hoodState: response.hood_state
      });
      PROCESSING = false;
    };
    OnesearchService.prototype.handleError = function (response) {
      jQuery("body").trigger({
        type: "onesearch-error-noresults",
        message: response.message,
        query: response.query
      });
      PROCESSING = false;
    };
    setupOptions = function (options) {
      if (!ONESEARCH_OPTIONS) {
        ONESEARCH_OPTIONS = options;
      }
    };
    selectLocation = function () {
      var seoPath = jQuery("#seopath").attr("value");
      var geoCode = jQuery("#geocode").attr("value");
      var radius = jQuery("#radius").attr("value");
      var sortField = jQuery("#sortfield").attr("value");
      var query = jQuery("#user_search").attr("value");
      var hoodName = jQuery("#hood_name").attr("value");
      var hoodCity = jQuery("#hood_city").attr("value");
      var hoodState = jQuery("#hood_state").attr("value");
      jQuery("#search_form").unbind("submit", getSeoPath);
      jQuery("body").trigger({
        type: "onesearch-success",
        seoPath: seoPath,
        query: query,
        geocode: geoCode,
        radius: radius,
        sortfield: sortField,
        hoodName: hoodName,
        hoodCity: hoodCity,
        hoodState: hoodState
      });
      PROCESSING = false;
    };
    getSeoPath = function () {
      if (!PROCESSING) {
        PROCESSING = true;
        var query = jQuery("#user_search").attr("value");
        new Search(new OnesearchService(channel)).execute(query);
      } else {
        selectLocation();
      }
      return false;
    };
  }
  if (typeof (jQuery) != "undefined") {;
    (function ($) {
      $.fn.extend({
        autocomplete: function (urlOrData, options) {
          var isUrl = typeof urlOrData == "string";
          options = $.extend({}, $.Autocompleter.defaults, {
            url: isUrl ? urlOrData : null,
            data: isUrl ? null : urlOrData,
            delay: isUrl ? $.Autocompleter.defaults.delay : 10,
            max: options && !options.scroll ? 10 : 150
          }, options);
          options.highlight = options.highlight || function (value) {
            return value;
          };
          options.formatMatch = options.formatMatch || options.formatItem;
          options.onSelect = options.onSelect || function (value) {
            return value;
          };
          return this.each(function () {
            new $.Autocompleter(this, options);
          });
        },
        result: function (handler) {
          return this.bind("result", handler);
        },
        search: function (handler) {
          return this.trigger("search", [handler]);
        },
        flushCache: function () {
          return this.trigger("flushCache");
        },
        setOptions: function (options) {
          return this.trigger("setOptions", [options]);
        },
        unautocomplete: function () {
          return this.trigger("unautocomplete");
        }
      });

      $.Autocompleter = function (input, options) {
        var KEY = {
          UP: 38,
          DOWN: 40,
          DEL: 46,
          TAB: 9,
          RETURN: 13,
          ESC: 27,
          COMMA: 188,
          PAGEUP: 33,
          PAGEDOWN: 34,
          BACKSPACE: 8
        };
        var $input = $(input).attr("autocomplete", "off").addClass(options.inputClass);
        var timeout;
        var previousValue = "";
        var cache = $.Autocompleter.Cache(options);
        var hasFocus = 0;
        var lastKeyPressCode;
        var searchTermTimer;
        var config = {
          mouseDownOnSelect: false
        };
        var select = $.Autocompleter.Select(options, input, selectCurrent, config);
        var blockSubmit;
        $.browser.opera && $(input.form).bind("submit.autocomplete", function () {
          if (blockSubmit) {
            blockSubmit = false;
            return false;
          }
        });
        $input.bind(($.browser.opera ? "keypress" : "keydown") + ".autocomplete", function (event) {
          lastKeyPressCode = event.keyCode;
          resetSearchTermTimer();

          switch (event.keyCode) {
          case KEY.UP:
            event.preventDefault();
            if (select.visible()) {
              select.prev();
            } else {
              onChange(0, true);
            }
            break;
          case KEY.DOWN:
            event.preventDefault();
            if (select.visible()) {
              select.next();
            } else {
              onChange(0, true);
            }
            break;
          case KEY.PAGEUP:
            event.preventDefault();
            if (select.visible()) {
              select.pageUp();
            } else {
              onChange(0, true);
            }
            break;
          case KEY.PAGEDOWN:
            event.preventDefault();
            if (select.visible()) {
              select.pageDown();
            } else {
              onChange(0, true);
            }
            break;
          case options.multiple && $.trim(options.multipleSeparator) == "," && KEY.COMMA:
          case KEY.TAB:
            if (selectCurrent()) {
              event.preventDefault();
              blockSubmit = true;
              return false;
            }
            break;
          case KEY.RETURN:
            if (selectCurrent()) {
              options.onSelect();
              event.preventDefault();
              blockSubmit = true;
              return false;
            }
            break;
          case KEY.ESC:
            select.hide();
            break;
          default:
            clearTimeout(timeout);
            timeout = setTimeout(onChange, options.delay);
            break;
          }
        }).focus(function () {
          hasFocus++;
        }).blur(function () {
          hasFocus = 0;
          if (!config.mouseDownOnSelect) {
            hideResults();
          }
        }).click(function () {
          if (hasFocus++ > 1 && !select.visible()) {
            onChange(0, true);
          }
        }).bind("search", function () {
          var fn = (arguments.length > 1) ? arguments[1] : null;

          function findValueCallback(q, data) {
            var result;
            if (data && data.length) {
              for (var i = 0; i < data.length; i++) {
                if (data[i].result.toLowerCase() == q.toLowerCase()) {
                  result = data[i];
                  break;
                }
              }
            }
            if (typeof fn == "function") fn(result);
            else $input.trigger("result", result && [result.data, result.value]);
          }
          $.each(trimWords($input.val()), function (i, value) {
            request(value, findValueCallback, findValueCallback);
          });
        }).bind("flushCache", function () {
          cache.flush();
        }).bind("setOptions", function () {
          $.extend(options, arguments[1]);
          if ("data" in arguments[1])
            cache.populate();
        }).bind("unautocomplete", function () {
          select.unbind();
          $input.unbind();
          $(input.form).unbind(".autocomplete");
        });

        function resetSearchTermTimer() {
          clearTimeout(searchTermTimer);

          searchTermTimer = setTimeout(fireSearchTermWhTag, 1000);
        };

        function fireSearchTermWhTag() {

          var userSearchValue = $('.user_search').val();

          WH.fire({ sg: 'SearchBox',
            value: userSearchValue,
            type: 'keypress'
          });

        };

        function selectCurrent() {
          var selected = select.selected();
          if (!selected)
            return false;
          var v = selected.result;
          previousValue = v;
          if (options.multiple) {
            var words = trimWords($input.val());
            if (words.length > 1) {
              v = words.slice(0, words.length - 1).join(options.multipleSeparator) + options.multipleSeparator + v;
            }
            v += options.multipleSeparator;
          }
          if ($("input#typed")) $("input#typed").val($input.val());
          $input.val(v);
          hideResultsNow();
          $input.trigger("result", [selected.data, selected.value]);
          return true;
        }

        function onChange(crap, skipPrevCheck) {
          if (lastKeyPressCode == KEY.DEL) {
            select.hide();
            return;
          }
          var currentValue = $input.val();
          if (!skipPrevCheck && currentValue == previousValue)
            return;
          previousValue = currentValue;
          currentValue = lastWord(currentValue);
          if (currentValue.length >= options.minChars) {
            $input.addClass(options.loadingClass);
            if (!options.matchCase)
              currentValue = currentValue.toLowerCase();
            request(currentValue, receiveData, hideResultsNow);
          } else {
            stopLoading();
            select.hide();
          }
        };

        function trimWords(value) {
          if (!value) {
            return [""];
          }
          var words = value.split(options.multipleSeparator);
          var result = [];
          $.each(words, function (i, value) {
            if ($.trim(value))
              result[i] = $.trim(value);
          });
          return result;
        }

        function lastWord(value) {
          if (!options.multiple)
            return value;
          var words = trimWords(value);
          return words[words.length - 1];
        }

        function autoFill(q, sValue) {
          if (options.autoFill && (lastWord($input.val()).toLowerCase() == q.toLowerCase()) && lastKeyPressCode != KEY.BACKSPACE) {
            $input.val($input.val() + sValue.substring(lastWord(previousValue).length));
            $.Autocompleter.Selection(input, previousValue.length, previousValue.length + sValue.length);
          }
        };

        function hideResults() {
          clearTimeout(timeout);
          timeout = setTimeout(hideResultsNow, 200);
        };

        function hideResultsNow() {
          var wasVisible = select.visible();
          select.hide();
          clearTimeout(timeout);
          stopLoading();
          if (options.mustMatch) {
            $input.search(function (result) {
              if (!result) {
                if (options.multiple) {
                  var words = trimWords($input.val()).slice(0, -1);
                  $input.val(words.join(options.multipleSeparator) + (words.length ? options.multipleSeparator : ""));
                } else
                  $input.val("");
              }
            });
          }
        };

        function receiveData(q, data) {
          if (data && data.length && hasFocus) {
            stopLoading();
            select.display(data, q);
            autoFill(q, data[0].value);
            select.show();
          } else {
            hideResultsNow();
          }
        };

        function request(term, success, failure) {
          if (!options.matchCase) {
            term = term.toLowerCase();
            term = term.replace(/=/g, '');
          }
          var data = cache.load(term);
          if (data && data.length) {
            success(term, data);
          } else if ((typeof options.url == "string") && (options.url.length > 0)) {
            var extraParams = {
              timestamp: +new Date()
            };
            $.each(options.extraParams, function (key, param) {
              extraParams[key] = typeof param == "function" ? param() : param;
            });
            $.ajax({
              mode: "abort",
              port: "autocomplete" + input.name,
              dataType: options.dataType,
              url: options.url,
              data: $.extend({
                q: lastWord(term),
                channel: channel,
                application: APPLICATION,
                limit: options.max
              }, extraParams),
              success: function (data) {
                var parsed = options.parse && options.parse(data) || parse(data);
                cache.add(term, parsed);
                success(term, parsed);
              }
            });
          } else {
            select.emptyList();
            failure(term);
          }
        };

        function parse(data) {
          return JSONDataParser.parse(data, options);
        };

        function stopLoading() {
          $input.removeClass(options.loadingClass);
        };
      };
      $.Autocompleter.defaults = {
        inputClass: "ac_input",
        resultsClass: "ac_results",
        loadingClass: "ac_loading",
        minChars: 1,
        delay: 400,
        matchCase: false,
        matchSubset: true,
        matchContains: false,
        cacheLength: 10,
        max: 100,
        mustMatch: false,
        extraParams: {},
        selectFirst: true,
        formatItem: function (row) {
          return row[0];
        },
        formatMatch: null,
        autoFill: false,
        width: 0,
        multiple: false,
        multipleSeparator: ", ",
        highlight: function (value, term) {
          return value.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + term.replace(/([^$()[]{}*.+?|\])/gi, "\$1") + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<strong>$1</strong>");
        },
        scroll: true,
        scrollHeight: 180
      };
      $.Autocompleter.Cache = function (options) {
        var data = {};
        var length = 0;

        function matchSubset(s, sub) {
          if (!options.matchCase)
            s = s.toLowerCase();
          var i = s.indexOf(sub);
          if (i == -1) return false;
          return i == 0 || options.matchContains;
        };

        function add(q, value) {
          if (length > options.cacheLength) {
            flush();
          }
          if (!data[q]) {
            length++;
          }
          data[q] = value;
        }

        function populate() {
          if (!options.data) return false;
          var stMatchSets = {}, nullData = 0;
          if (!options.url) options.cacheLength = 1;
          stMatchSets[""] = [];
          for (var i = 0, ol = options.data.length; i < ol; i++) {
            var rawValue = options.data[i];
            rawValue = (typeof rawValue == "string") ? [rawValue] : rawValue;
            var value = options.formatMatch(rawValue, i + 1, options.data.length);
            if (value === false)
              continue;
            var firstChar = value.charAt(0).toLowerCase();
            if (!stMatchSets[firstChar])
              stMatchSets[firstChar] = [];
            var row = {
              value: value,
              data: rawValue,
              result: options.formatResult && options.formatResult(rawValue) || value
            };
            stMatchSets[firstChar].push(row);
            if (nullData++ < options.max) {
              stMatchSets[""].push(row);
            }
          };
          $.each(stMatchSets, function (i, value) {
            options.cacheLength++;
            add(i, value);
          });
        }
        setTimeout(populate, 25);

        function flush() {
          data = {};
          length = 0;
        }
        return {
          flush: flush,
          add: add,
          populate: populate,
          load: function (q) {
            if (!options.cacheLength || !length)
              return null;
            if (!options.url && options.matchContains) {
              var csub = [];
              for (var k in data) {
                if (k.length > 0) {
                  var c = data[k];
                  $.each(c, function (i, x) {
                    if (matchSubset(x.value, q)) {
                      csub.push(x);
                    }
                  });
                }
              }
              return csub;
            } else
            if (data[q]) {
              return data[q];
            } else
            if (options.matchSubset) {
              for (var i = q.length - 1; i >= options.minChars; i--) {
                var c = data[q.substr(0, i)];
                if (c) {
                  var csub = [];
                  $.each(c, function (i, x) {
                    if (matchSubset(x.value, q)) {
                      csub[csub.length] = x;
                    }
                  });
                  return csub;
                }
              }
            }
            return null;
          }
        };
      };
      $.Autocompleter.Select = function (options, input, select, config) {
        var CLASSES = {
          ACTIVE: "ac_over"
        };
        var listItems, active = -1,
          data, term = "",
          needsInit = true,
          element, list;

        function init() {
          if (!needsInit)
            return;
          element = $("<div/>").hide().addClass(options.resultsClass).css("position", "absolute").appendTo(document.body);
          list = $("<ul/>").appendTo(element).mouseover(function (event) {
            if (target(event).nodeName && target(event).nodeName.toUpperCase() == 'LI') {
              active = $("li", list).removeClass(CLASSES.ACTIVE).index(target(event));
              $(target(event)).addClass(CLASSES.ACTIVE);
            }
          }).click(function (event) {
            $(target(event)).addClass(CLASSES.ACTIVE);
            select();
            input.focus();
            jQuery("body").trigger({ type: "onesearch-autocompletion-clicked" });
            return false;
          }).mousedown(function () {
            config.mouseDownOnSelect = true;
          }).mouseup(function () {
            config.mouseDownOnSelect = false;
          });
          if (options.width > 0)
            element.css("width", options.width);
          needsInit = false;
        }

        function target(event) {
          var element = event.target;
          while (element && element.tagName != "LI")
            element = element.parentNode;
          if (!element)
            return [];
          return element;
        }

        function moveSelect(step) {
          listItems.slice(active, active + 1).removeClass(CLASSES.ACTIVE);
          movePosition(step);
          var activeItem = listItems.slice(active, active + 1).addClass(CLASSES.ACTIVE);
          if (options.scroll) {
            var offset = 0;
            listItems.slice(0, active).each(function () {
              offset += this.offsetHeight;
            });
            if ((offset + activeItem[0].offsetHeight - list.scrollTop()) > list[0].clientHeight) {
              list.scrollTop(offset + activeItem[0].offsetHeight - list.innerHeight());
            } else if (offset < list.scrollTop()) {
              list.scrollTop(offset);
            }
          }
        };

        function movePosition(step) {
          active += step;
          if (active < 0) {
            active = listItems.size() - 1;
          } else if (active >= listItems.size()) {
            active = 0;
          }
        }

        function limitNumberOfItems(available) {
          return options.max && options.max < available ? options.max : available;
        }

        function fillList() {
          list.empty();
          var max = limitNumberOfItems(data.length);
          for (var i = 0; i < max; i++) {
            if (!data[i])
              continue;
            var formatted = options.formatItem(data[i].data, i + 1, max, data[i].value, term);
            if (formatted === false)
              continue;
            var li = $("<li/>").html(options.highlight(formatted, term)).addClass(i % 2 == 0 ? "ac_even" : "ac_odd").appendTo(list)[0];
            $.data(li, "ac_data", data[i]);
          }
          listItems = list.find("li");
          if (options.selectFirst) {
            listItems.slice(0, 1).addClass(CLASSES.ACTIVE);
            active = 0;
          }
          if ($.fn.bgiframe)
            list.bgiframe();
        }
        return {
          display: function (d, q) {
            init();
            data = d;
            term = q;
            fillList();
          },
          next: function () {
            moveSelect(1);
          },
          prev: function () {
            moveSelect(-1);
          },
          pageUp: function () {
            if (active != 0 && active - 8 < 0) {
              moveSelect(-active);
            } else {
              moveSelect(-8);
            }
          },
          pageDown: function () {
            if (active != listItems.size() - 1 && active + 8 > listItems.size()) {
              moveSelect(listItems.size() - 1 - active);
            } else {
              moveSelect(8);
            }
          },
          hide: function () {
            hideDropdowns(false);
            element && element.hide();
            listItems && listItems.removeClass(CLASSES.ACTIVE);
            active = -1;
          },
          visible: function () {
            return element && element.is(":visible");
          },
          current: function () {
            return this.visible() && (listItems.filter("." + CLASSES.ACTIVE)[0] || options.selectFirst && listItems[0]);
          },
          show: function () {
            hideDropdowns(true);
            var offset = $(input).offset();
            element.css({
              width: typeof options.width == "string" || options.width > 0 ? options.width : $(input).width(),
              top: offset.top + input.offsetHeight + 8,
              left: offset.left - 1
            }).show();
            if (options.scroll) {
              list.scrollTop(0);
              list.css({
                maxHeight: options.scrollHeight,
                overflow: 'auto'
              });
              if ($.browser.msie && typeof document.body.style.maxHeight === "undefined") {
                var listHeight = 0;
                listItems.each(function () {
                  listHeight += this.offsetHeight;
                });
                var scrollbarsVisible = listHeight > options.scrollHeight;
                list.css('height', scrollbarsVisible ? options.scrollHeight : listHeight);
                if (!scrollbarsVisible) {
                  listItems.width(list.width() - parseInt(listItems.css("padding-left")) - parseInt(listItems.css("padding-right")));
                }
              }
            }
          },
          selected: function () {
            var selected = listItems && listItems.filter("." + CLASSES.ACTIVE).removeClass(CLASSES.ACTIVE);
            return selected && selected.length && $.data(selected[0], "ac_data");
          },
          emptyList: function () {
            list && list.empty();
          },
          unbind: function () {
            element && element.remove();
          }
        };
      };
      $.Autocompleter.Selection = function (field, start, end) {
        if (field.createTextRange) {
          var selRange = field.createTextRange();
          selRange.collapse(true);
          selRange.moveStart("character", start);
          selRange.moveEnd("character", end);
          selRange.select();
        } else if (field.setSelectionRange) {
          field.setSelectionRange(start, end);
        } else {
          if (field.selectionStart) {
            field.selectionStart = start;
            field.selectionEnd = end;
          }
        }
        field.focus();
      };
    })(jQuery);
    JSONDataParser = {
      parse: function (data, options) {
        var parsed = [];
        if (data) {
          $(data).each(function (index, jsonData) {
            var row = $.trim(jsonData.name + "|" + jsonData.seopath + "|" + jsonData.geocode + "|" + jsonData.radius + "|" + jsonData.sortfield + "|" + jsonData.count + "|" + jsonData.hood_name + "|" + jsonData.hood_city + "|" + jsonData.hood_state);
            if (row) {
              row = row.split("|");
              parsed[parsed.length] = {
                data: row,
                value: row[0],
                result: options.formatResult && options.formatResult(row, row[0]) || row[0]
              };
            }
          });
        }
        return parsed;
      }
    }

    function hideAllSelects() {
      $("select").hide();
    }

    function showAllSelects() {
      $("select").show();
    }

    function isIESixOrLower() {
      return $.browser.msie && parseInt($.browser.version) <= 6;
    }

    function hideDropdowns(hide) {
      if (isIESixOrLower()) {
        if (hide) {
          hideAllSelects();
        } else {
          showAllSelects();
        }
      }
    }
  }
});