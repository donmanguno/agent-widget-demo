"use strict";

const initDelay = 250;
const dataSources = {
      chatInfo: { bound: null },
      chattingAgentInfo: { bound: null },
      agentInfo: { bound: null },
      chatTranscript: { bound: null },
      surveyQuestions: { bound: null },
      visitorInfo: { bound: null },
      campaignInfo: { bound: null },
      engagementInfo: { bound: null },
      visitorJourney: { bound: null },
      SDE: { bound: null },
      authenticatedData: { bound: null },
      claimsAndAuthType: { bound: null },
      customVariables: { bound: null },
      splitSession: { bound: null }
  };
// <editor-fold defaultstate="collapsed" desc="Sample Structured Content">
const sampleSC = {
      "type": "vertical",
      "elements": [
          {
              "type": "image",
              "url": "https://i.pinimg.com/originals/d4/ed/12/d4ed1207911a4be90a14424476e21364.jpg",
              "tooltip": "image tooltip",
              "click": {
                  "actions": [
                      {
                          "type": "navigate",
                          "name": "Navigate to store via image",
                          "lo": 23423423,
                          "la": 2423423423
                      }
                  ]
              }
          },
          {
              "type": "text",
              "text": "Pickle Rick!",
              "tooltip": "text tooltip",
              "style": {
                  "bold": true,
                  "size": "large"
              }
          },
          {
              "type": "text",
              "text": "wubba wubba wubba",
              "tooltip": "text tooltip"
          },
          {
              "type": "button",
              "tooltip": "button tooltip",
              "title": "Add to cart",
              "click": {
                  "actions": [
                      {
                          "type": "link",
                          "name": "Add to cart",
                          "uri": "https://example.com"
                      }
                  ]
              }
          },
          {
              "type": "horizontal",
              "elements": [
                  {
                      "type": "button",
                      "title": "Buy",
                      "tooltip": "Buy this broduct",
                      "click": {
                          "actions": [
                              {
                                  "type": "link",
                                  "name": "Buy",
                                  "uri": "https://example.com"
                              }
                          ]
                      }
                  },
                  {
                      "type": "button",
                      "title": "Find similar",
                      "tooltip": "store is the thing",
                      "click": {
                          "actions": [
                              {
                                  "type": "link",
                                  "name": "Buy",
                                  "uri": "https://search.com"
                              }
                          ]
                      }
                  }
              ]
          },
          {
              "type": "button",
              "tooltip": "button tooltip",
              "title": "Publish text",
              "click": {
                  "actions": [
                      {
                          "type": "publishText",
                          "text": "my text"
                      }
                  ]
              }
          },
          {
              "type": "map",
              "lo": 64.128597,
              "la": -21.89611,
              "tooltip": "map tooltip"
          },
          {
              "type": "button",
              "tooltip": "button tooltip",
              "title": "Navigate",
              "click": {
                  "actions": [
                      {
                          "type": "publishText",
                          "text": "my text"
                      },
                      {
                          "type": "navigate",
                          "name": "Navigate to store via image",
                          "lo": 23423423,
                          "la": 2423423423
                      }
                  ]
              }
          }
      ]
  };
const sampleSCMeta = [	//metadata is optional
      {"type":"ExternalId","id":"running364"},
      {"type":"ExternalId","id":"soccer486"}
  ];
// </editor-fold>
const urlParams = {};
const lastValue = {};
const bindJSONOptions = { collapsed: true };
let bearer = undefined;

// <editor-fold defaultstate="collapsed" desc="Global Methods">
const sdkInit = () => {
    // initialize the SDK
    lpTag.agentSDK.init({
        notificationCallback: notificationCallback,
        visitorFocusedCallback: visitorFocusedCallback,
        visitorBlurredCallback: visitorBlurredCallback
    });
    // disable the 'init' button
    $('button#init').attr('disabled', 'disabled');
    // enable the 'dispose' button
    $('button#dispose').removeAttr('disabled');
    // bind all data sources
    bindDataSources().then(() => {
        printLogLine(`[sdkInit] all data sources bound`)
    }).catch(e => {
        printLogLine(`[sdkInit] ERROR failed to bind data sources: ${e}`);
    });
};

// log when focus gained
const visitorFocusedCallback = () => {
    lpTag.agentSDK.get('visitorInfo.visitorName', (visitorName) => {
        printLogLine(`[visitorFocusedCallback] focused on ${visitorName}`)
    })
};

// log when focus lost
const visitorBlurredCallback = () => {
    lpTag.agentSDK.get('visitorInfo.visitorName', (visitorName) => {
        printLogLine(`[visitorBlurredCallback] ${visitorName} unfocused`)
    })
};

// log when notifications occur
const notificationCallback = (notificationData) => {
    printLogLine(`[notificationCallback] data: ${JSON.stringify(notificationData)}`)
};

// format a Date as a time string
const timeString = (date) => {
    return `${date.getHours()}:${('0'+date.getMinutes()).slice(-2)}:${('0'+date.getSeconds()).slice(-2)}.${date.getMilliseconds()}`
};

// </editor-fold>

// <editor-fold defaultstate="collapsed" desc="QueryParams Tab">
const getQueryStringParams = () => {
    let match,
      decode	= function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); },
      search	= /([^&=]+)=?([^&]*)/g,
      query	= window.location.search.substring(1);

    while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);
};

const printQueryStringParams = () => {
    for (let key in urlParams) {
        if (urlParams.hasOwnProperty(key)) {
            $('#urlParamsTable').append($('<tr>')
              .append($('<td>').text(key))
              .append($('<td>').text(urlParams[key]))
            )
        }
    }
};
// </editor-fold>

// <editor-fold defaultstate="collapsed" desc="Binding Tab">
// create buttons to bind/unbind each data source and indicate bind state
const addBindIndicators = () => {
    let buttonGroup = $('div#bindIndicators');
    for (let path in dataSources) {
        buttonGroup.append($('<button>', {
            id: path,
            type: 'button',
            class: 'btn btn-light btn-sm mr-1 mb-1',
            disabled: true,
            text: path,
            on: { click: function() { toggleDataBind(this.id) } }
        }))
    }
};

// bind all data sources
const bindDataSources = () => {
    // concurrently, for each data source run 'bindDataSource'
    return Promise.all(Object.keys(dataSources).map(source => {
        return bindDataSource(source)
    }));
};

// unbind all data sources
const unbindDataSources = () => {
    // concurrently, for each data source run 'unbindDataSource'
    return Promise.all(Object.keys(dataSources).map(source => {
        return unbindDataSource(source)
    }));
};

// create the dropdown menu to filter bind output
const addFilterDropDown = () => {
    let dropdown = $('select#eventFilter');
    dropdown.append($('<option>').val('none').text('all'));
    for (let path in dataSources) {
        dropdown.append($('<option>').val(path).text(path))
    }
    dropdown.change(filterEvents)
};

// bind the showUnchanged checkbox to the filter function
const bindUnchangedFilter = () => {
    $('input#showUnchanged').change(filterEvents)
};

// print data to log on update
const printData = (data) => {
    // check whether data changed since last update
    let unchanged;
    if (_.isEqual(data.newValue, lastValue[data.key])) {
        unchanged = true;
    } else {
        lastValue[data.key] = data.newValue
    }

    // create a new line for the log
    let newEntry = $('<tr>').addClass(data.key).addClass('bindingOutputRow')
      .append($('<td>').text(timeString(new Date())))
      .append($('<td>').text(data.key))
      .append($('<td>').jsonViewer(data.newValue, bindJSONOptions));
    // if data is unchanged add relevant class
    if (unchanged) newEntry.addClass('unchanged');
    // get the filter value
    let efv = $('select#eventFilter').val();
    // hide the entry if it's filtered out or it is unchanged and the checkbox is checked
    if ((efv !== data.key && efv !== 'none') || (unchanged && !$('input#showUnchanged')[0].checked)) {
        newEntry.hide()
    }
    // add it to the top of the list
    $('tbody#bindOutput').prepend(newEntry)
};

// expand all visible, unexpanded entries
const bindExpand = () => {
    $('tbody#bindOutput tr:visible a.json-toggle.collapsed').click();
};

// collapse all visible, expanded entries
const bindCollapse = () => {
    $('tbody#bindOutput tr:visible a.json-toggle').not('.collapsed').click();
};

// filter visible events
const filterEvents = () => {
    let dropdown = $('select#eventFilter');
    if (dropdown.val() === 'none') {
        $('.bindingOutputRow').show()
    } else {
        $('.bindingOutputRow').hide();
        $('.'+dropdown.val()).show()
    }

    if (!$('input#showUnchanged')[0].checked) { $('.unchanged').hide() }
};

// return a promise that will bind a specific data source
const bindDataSource = (path) => {
    return new Promise((resolve, reject) => {
        // bind printData to the specified data source / path
        lpTag.agentSDK.bind(path,
          printData,
          (err) => {
            // when finished
              if (err) {
                  // if there was an error binding update the bind state indicator and reject the promise
                  updateBindIndicator(path);
                  reject(err);
              } else {
                  // if the bind succeeded set the bind state to true, update the indicator, and resolve the promise
                  dataSources[path].bound = true;
                  updateBindIndicator(path);
                  resolve(true)
              }
          })
    });
};

// return a promise that will unbind a specific data source
const unbindDataSource = (path) => {
    return new Promise((resolve, reject) => {
        // unbind printData from the specified data source / path
        lpTag.agentSDK.unbind(path,
          printData,
          (err) => {
            // when finished
              if (err) {
                  // if there was an error unbinding update the bind state indicator and reject the promise
                  updateBindIndicator(path);
                  reject(err)
              } else {
                  // if the unbind succeeded set the bind state to false, update the indicator, and resolve the promise
                  dataSources[path].bound = false;
                  updateBindIndicator(path);
                  resolve(true)
              }
          })
    });
};

// call bind or unbind as appropriate for this data source
const toggleDataBind = (path) => {
    if (dataSources[path].bound) {
        unbindDataSource(path).then(() => {
            printLogLine(`[unbind] unbound ${path}`)
        }).catch(e => {
            printLogLine(`[unbind] ERROR unbinding ${path}: ${e}`)
        })
    } else {
        bindDataSource(path).then(() => {
            printLogLine(`[bind] bound ${path}`)
        }).catch(e => {
            printLogLine(`[bind] ERROR binding ${path}: ${e}`)
        })
    }
};

// change the bind indicator button to reflect the current state
const updateBindIndicator = (path) => {
    let state = dataSources[path].bound;
    let btn = $('button#'+path);
    btn.removeClass('btn-light btn-success btn-warning');
    btn.removeAttr('disabled');
    if (state === false) {
        btn.addClass('btn-warning')
    } else if (state === true) {
        btn.addClass('btn-success')
    } else {
        btn.addClass('btn-light');
        btn.disable();
    }
};
// </editor-fold>

// <editor-fold defaultstate="collapsed" desc="SDK Methods Tab">
const populateSampleSC = () => {
    $('textarea#richContent').val(JSON.stringify(sampleSC, null, 4));
    $('textarea#richContentMetadata').val(JSON.stringify(sampleSCMeta, null, 4));
};

const sendRichContent = () => {
    let data = { json: JSON.parse($('textarea#richContent').val()) };
    let meta = $('textarea#richContentMetadata').val();
    if (meta !== '') { data.metadata = meta }
    lpTag.agentSDK.command(lpTag.agentSDK.cmdNames.writeSC, data, error => {
        if (error) printLogLine(`[command: writeSC] ERROR ${error}`);
        else printLogLine(`[command: writeSC] success`)
    });
};

const sendChatLine = () => {
    lpTag.agentSDK.command(lpTag.agentSDK.cmdNames.write, {
        text: $('input#chatLine').val()
    }, error => {
        if (error) printLogLine(`[command: write] ERROR ${error}`);
        else printLogLine(`[command: write] success`)
    });
};

const getCustomPath = () => {
    getCommand($('input#customGetPath')[0].value)
};

const createGetButtons = () => {
    let buttonsDiv = $('div#predefinedGetButtons');

    for (let path in dataSources) {
        let button = $('<button>', {
            id: 'getButton_'+path,
            type: 'button',
            class: 'btn btn-primary btn-sm mb-1 mr-1',
            text: path,
            on: { click: function() { getCommand(this.id.substr(10)) } }
        });
        buttonsDiv.append(button);
    }

};

const getCommand = (path) => {
    lpTag.agentSDK.get(path, data => {
        $('#getOutput').jsonViewer(data);
        printLogLine(`[get] successfully got ${path}`)
    }, error => {
        if (error) {
            $('#getOutput').jsonViewer(error);
            printLogLine(`[get] ERROR getting ${path}: ${error}`)
        }
    })
};

const sendNotification = () => {
    lpTag.agentSDK.command(lpTag.agentSDK.cmdNames.notify, {}, error => {
        if (error) printLogLine(`[command: notify] ERROR ${error}`);
        else printLogLine(`[command: notify] success`)
    })
};

// const setConsumerProfile = () => {
//     let consumerData = {
//         firstName: $('input#firstName')[0].value
//     };
//     lpTag.agentSDK.setConsumerProfile(consumerData, response => {
//         console.log(response);
//     }, error => {
//         if (error) {
//             printLogLine(`[setConsumerProfile] ERROR ${error.message}`)
//         }
//     })
//
// };

const sdkDispose = () => {
    // unbind all data sources
    unbindDataSources().then(() => {
        printLogLine('[sdkDispose] all data sources unbound');
    }).catch(e => {
        printLogLine(`[sdkDispose] ERROR failed to unbind data sources: ${e}`);
    }).finally(() => {
        // use the SDK 'dispose' method
        lpTag.agentSDK.dispose();
        printLogLine('[sdkDispose] SDK disposed');
        // enable the 'init' button
        $('button#init').removeAttr('disabled');
        // disable the 'dispose' button
        $('button#dispose').attr('disabled', 'disabled');
    });
};

// </editor-fold>

// <editor-fold defaultstate="collapsed" desc="Auth Tab">
const setBearer = () => {
    bearer = $('input#bearerToken')[0].value;
    $('span#currentBearer')[0].innerText = bearer;
};
// </editor-fold>

// <editor-fold defaultstate="collapsed" desc="Log Tab">
const printLogLine = (logLine) => {
    let line = $('<span>').text(timeString(new Date())+' '+logLine+'\n');
    $('pre#logOutput').prepend(line)
};
// </editor-fold>

// <editor-fold defaultstate="collapsed" desc="Init">
const init = () => {
    sdkInit();
    addBindIndicators();
    addFilterDropDown();
    bindUnchangedFilter();
    getQueryStringParams();
    printQueryStringParams();
    populateSampleSC();
    createGetButtons();
    printLogLine(`[widget] initialized SDK version ${lpTag.agentSDK.v}`);
};

$(function(){
    printLogLine('[widget] initializing in '+initDelay+' ms...');
    setTimeout(init,initDelay);
});

// </editor-fold>