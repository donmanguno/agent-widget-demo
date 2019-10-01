'use strict';

class Widget {
    constructor (initDelay) {
        // List of all paths in the public model
        let _publicModelPaths = [
            'chatInfo',
            'chattingAgentInfo',
            'agentInfo',
            'chatTranscript',
            'surveyQuestions',
            'visitorInfo',
            'campaignInfo',
            'engagementInfo',
            'visitorJourney',
            'SDE',
            'authenticatedData',
            'claimsAndAuthType',
            'customVariables',
            'splitSession'
        ];
        // build the data sources object, with a key for each path used to track whether that path is currently bound
        this._dataSources = {};
        _publicModelPaths.forEach(source => {
            this._dataSources[source] = { bound: null };
        });
        this._lastValues = {};
        this._bindJSONOptions = {collapsed: true};
        setTimeout(this.init.bind(this), initDelay);
    }

    init () {
        this._sdkInit();
        this._buildQueryParamsTab();
        this._buildBindingTab();
        this._buildMethodsTab();
        Widget._printLogLine(`[widget] initialized SDK version ${lpTag.agentSDK.v}`);
    }

// <editor-fold defaultstate="collapsed" desc="Global Methods">
    _sdkInit () {
        // initialize the SDK
        lpTag.agentSDK.init({
            notificationCallback: Widget._notificationCallback,
            visitorFocusedCallback: this._visitorFocusedCallback,
            visitorBlurredCallback: this._visitorBlurredCallback
        });
        // disable the 'init' button
        $('button#init').attr('disabled', 'disabled');
        // enable the 'dispose' button
        $('button#dispose').removeAttr('disabled');
        // bind all data sources
        this._bindDataSources()
          .then(() => Widget._printLogLine(`[sdkInit] all data sources bound`))
          .catch(e => Widget._printLogLine(`[sdkInit] ERROR failed to bind data sources: ${e}`))
    };

    // log when focus gained
    _visitorFocusedCallback () {
        lpTag.agentSDK.get('visitorInfo.visitorName', (visitorName) => {
            Widget._printLogLine(`[visitorFocusedCallback] focused on ${visitorName}`)
        })
    };

    // log when focus lost
    _visitorBlurredCallback () {
        lpTag.agentSDK.get('visitorInfo.visitorName', (visitorName) => {
            Widget._printLogLine(`[visitorBlurredCallback] ${visitorName} unfocused`)
        })
    };

    // log when notifications occur
    static _notificationCallback (notificationData) {
        Widget._printLogLine(`[notificationCallback] data: ${JSON.stringify(notificationData)}`)
    };

    static _printLogLine (logLine) {
        let line = $('<span>').text(Widget._timeString(new Date())+' '+logLine+'\n');
        $('pre#logOutput').prepend(line)
    };

    static _timeString (date) {
        return `${date.getHours()}:${('0'+date.getMinutes()).slice(-2)}:${('0'+date.getSeconds()).slice(-2)}.${date.getMilliseconds()}`
    };
// </editor-fold>

// <editor-fold defaultstate="collapsed" desc="QueryParams Tab">
    _buildQueryParamsTab () {
        // initialize 'match' variable
        let match,
          // create a function to replace + with ' ' and decode URI components in a string
          decode	= function (s) { return decodeURIComponent(s.replace(/\+/g, ' ')) },
          // create a regular expression to match queryparams
          search	= /([^&=]+)=?([^&]*)/g,
          // grab the queryparams string from the url (without the starting ?)
          query	= window.location.search.substring(1);

        // for each match of the regex above in the queryparams string
        while (match = search.exec(query))
            // add the key & value to the table
            $('#urlParamsTable').append($('<tr>')
              .append($('<td>').text(decode(match[1])))
              .append($('<td>').text(decode(match[2])))
            );
    }
// </editor-fold>

// <editor-fold defaultstate="collapsed" desc="Binding Tab">
    _buildBindingTab () {
        // create buttons to bind/unbind each data source and indicate bind state
        let buttonGroup = $('div#bindIndicators');
        for (let path in this._dataSources) {
            if (this._dataSources.hasOwnProperty(path)) {
                buttonGroup.append($('<button>', {
                    id: path,
                    type: 'button',
                    class: 'btn btn-light btn-sm mr-1 mb-1',
                    disabled: true,
                    text: path,
                    on: { click: function() { widget.toggleDataBind(this.id) } }
                }))
            }
        }

        // create the dropdown menu to filter bind output
        let dropdown = $('select#eventFilter');
        dropdown.append($('<option>').val('none').text('all'));
        for (let path in this._dataSources) {
            if (this._dataSources.hasOwnProperty(path)) {
                dropdown.append($('<option>').val(path).text(path))
            }
        }
        dropdown.change(Widget._filterEvents);

        // bind the showUnchanged checkbox to the filter function
        $('input#showUnchanged').change(Widget._filterEvents)
    }

    // call bind or unbind as appropriate for this data source
    toggleDataBind (path) {
        if (this._dataSources[path].bound) {
            this._unbindDataSource(path).then(() => {
                Widget._printLogLine(`[unbind] unbound ${path}`)
            }).catch(e => {
                Widget._printLogLine(`[unbind] ERROR unbinding ${path}: ${e}`)
            })
        } else {
            this._bindDataSource(path).then(() => {
                Widget._printLogLine(`[bind] bound ${path}`)
            }).catch(e => {
                Widget._printLogLine(`[bind] ERROR binding ${path}: ${e}`)
            })
        }
    };

    // bind all data sources
    _bindDataSources () {
        // concurrently, for each data source run 'bindDataSource'
        return Promise.all(Object.keys(this._dataSources).map(source => {
            return this._bindDataSource(source)
        }));
    };

    // unbind all data sources
    _unbindDataSources () {
        // concurrently, for each data source run 'unbindDataSource'
        return Promise.all(Object.keys(this._dataSources).map(source => {
            return this._unbindDataSource(source)
        }));
    };

    // return a promise that will bind a specific data source
    _bindDataSource (path) {
        return new Promise((resolve, reject) => {
            // bind printData to the specified data source / path
            lpTag.agentSDK.bind(path,
              this._printData,
              (err) => {
                  // when finished
                  if (err) {
                      // if there was an error binding update the bind state indicator and reject the promise
                      this._updateBindIndicator(path);
                      reject(err);
                  } else {
                      // if the bind succeeded set the bind state to true, update the indicator, and resolve the promise
                      _dataSources[path].bound = true;
                      this._updateBindIndicator(path);
                      resolve(true)
                  }
              })
        });
    };

    // return a promise that will unbind a specific data source
    _unbindDataSource (path) {
        return new Promise((resolve, reject) => {
            // unbind printData from the specified data source / path
            lpTag.agentSDK.unbind(path,
              printData,
              (err) => {
                  // when finished
                  if (err) {
                      // if there was an error unbinding update the bind state indicator and reject the promise
                      this._updateBindIndicator(path);
                      reject(err)
                  } else {
                      // if the unbind succeeded set the bind state to false, update the indicator, and resolve the promise
                      _dataSources[path].bound = false;
                      this._updateBindIndicator(path);
                      resolve(true)
                  }
              })
        });
    };

    // change the bind indicator button to reflect the current state
    _updateBindIndicator (path) {
        let state = this._dataSources[path].bound;
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

    // print data to log on update
    _printData (data) {
        // check whether data changed since last update
        let unchanged;
        if (_.isEqual(data.newValue, this._lastValues[data.key])) {
            unchanged = true;
        } else {
            this._lastValues[data.key] = data.newValue
        }

        // create a new line for the log
        let newEntry = $('<tr>').addClass(data.key).addClass('bindingOutputRow')
          .append($('<td>').text(Widget._timeString(new Date())))
          .append($('<td>').text(data.key))
          .append($('<td>').jsonViewer(data.newValue, this._bindJSONOptions));
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
    static expandData () {
        $('tbody#bindOutput tr:visible a.json-toggle.collapsed').click();
    };

    // collapse all visible, expanded entries
    static collapseData () {
        $('tbody#bindOutput tr:visible a.json-toggle').not('.collapsed').click();
    };

    // filter visible events
    static _filterEvents () {
        let dropdown = $('select#eventFilter');
        if (dropdown.val() === 'none') {
            $('.bindingOutputRow').show()
        } else {
            $('.bindingOutputRow').hide();
            $('.'+dropdown.val()).show()
        }

        if (!$('input#showUnchanged')[0].checked) { $('.unchanged').hide() }
    };
// </editor-fold>

// <editor-fold defaultstate="collapsed" desc="SDK Methods Tab">
    _buildMethodsTab () {
        // create get buttons
        let buttonsDiv = $('div#predefinedGetButtons');
        for (let path in this._dataSources) {
            if (this._dataSources.hasOwnProperty(path)) {
                let button = $('<button>', {
                    id: 'getButton_'+path,
                    type: 'button',
                    class: 'btn btn-primary btn-sm mb-1 mr-1',
                    text: path,
                    on: { click: function() { widget.getCommand(this.id.substr(10)) } }
                });
                buttonsDiv.append(button);
            }
        }

        // populate the sample structed content
        Widget.populateSampleSC();
    }

    static populateSampleSC () {
        $('textarea#richContent').val(JSON.stringify(sampleSC, null, 4));
        $('textarea#richContentMetadata').val(JSON.stringify(sampleSCMeta, null, 4));
    };

    getCustomPath () {
        this.getCommand($('input#customGetPath')[0].value)
    };

    getCommand (path) {
        lpTag.agentSDK.get(path, data => {
            $('#getOutput').jsonViewer(data);
            Widget._printLogLine(`[get] successfully got ${path}`)
        }, error => {
            if (error) {
                $('#getOutput').jsonViewer(error);
                Widget._printLogLine(`[get] ERROR getting ${path}: ${error}`)
            }
        })
    };

    sendRichContent () {
        let data = { json: JSON.parse($('textarea#richContent').val()) };
        let meta = $('textarea#richContentMetadata').val();
        if (meta !== '') { data.metadata = meta }
        lpTag.agentSDK.command(lpTag.agentSDK.cmdNames.writeSC, data, error => {
            if (error) Widget._printLogLine(`[command: writeSC] ERROR ${error}`);
            else Widget._printLogLine(`[command: writeSC] success`)
        });
    };

    sendChatLine () {
        lpTag.agentSDK.command(lpTag.agentSDK.cmdNames.write, {
            text: $('input#chatLine').val()
        }, error => {
            if (error) Widget._printLogLine(`[command: write] ERROR ${error}`);
            else Widget._printLogLine(`[command: write] success`)
        });
    };

    sendNotification () {
        lpTag.agentSDK.command(lpTag.agentSDK.cmdNames.notify, {}, error => {
            if (error) Widget._printLogLine(`[command: notify] ERROR ${error}`);
            else Widget._printLogLine(`[command: notify] success`)
        })
    };

    // setConsumerProfile () {
    //     let consumerData = {
    //         firstName: $('input#firstName')[0].value
    //     };
    //     lpTag.agentSDK.setConsumerProfile(consumerData, response => {
    //         console.log(response);
    //     }, error => {
    //         if (error) {
    //             Widget._printLogLine(`[setConsumerProfile] ERROR ${error.message}`)
    //         }
    //     })
    //
    // };

    sdkDispose () {
        // unbind all data sources
        this._unbindDataSources().then(() => {
            Widget._printLogLine('[sdkDispose] all data sources unbound');
        }).catch(e => {
            Widget._printLogLine(`[sdkDispose] ERROR failed to unbind data sources: ${e}`);
        }).finally(() => {
            // use the SDK 'dispose' method
            lpTag.agentSDK.dispose();
            Widget._printLogLine('[sdkDispose] SDK disposed');
            // enable the 'init' button
            $('button#init').removeAttr('disabled');
            // disable the 'dispose' button
            $('button#dispose').attr('disabled', 'disabled');
        });
    };
// </editor-fold>

// <editor-fold defaultstate="collapsed" desc="Auth Tab">
    setBearer () {
        this.bearer = $('input#bearerToken')[0].value;
        $('span#currentBearer')[0].innerText = this.bearer;
    };
// </editor-fold>
}

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

let widget = new Widget(250);