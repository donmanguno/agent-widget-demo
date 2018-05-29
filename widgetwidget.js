"use strict";

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
        customVariables: { bound: null },
        splitSession: { bound: null }
    },
    sampleSC = {
        "type": "vertical",
        "elements": [
            {
                "type": "image",
                "url": "https://www.crixeo.com/wp-content/uploads/2017/08/RickMorty_PickleRickle.jpg",
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
    },
    sampleSCMeta = [	//metadata is optional
        {"type":"ExternalId","id":"running364"},
        {"type":"ExternalId","id":"soccer486"}
    ],
	initDelay = 500,
	selected = 2,
	urlParams = {},
	lastValue = {},
    bindJSONOptions = {
        collapsed: true
    };

// global

const hideAllTabs = () => {
    $('div.tab').hide();
    $('li.navtab').removeClass('active');
};

const sdkInit = () => {
    lpTag.agentSDK.init({
        notificationCallback: notificationCallback,
        visitorFocusedCallback: visitorFocusedCallback,
        visitorBlurredCallback: visitorBlurredCallback
    });
    $('button#init').attr('disabled', 'disabled');
    $('button#dispose').removeAttr('disabled');
    bindDataSources().then(() => {
        printLogLine(`[sdkInit] all data sources bound`)
    }).catch(e => {
        printLogLine(`[sdkInit] ERROR failed to bind data sources: ${e}`);
    });
};

const sdkDispose = () => {
    unbindDataSources().then(() => {
        printLogLine('[sdkDispose] all data sources unbound');
    }).catch(e => {
        printLogLine(`[sdkDispose] ERROR failed to unbind data sources: ${e}`);
    }).finally(() => {
        lpTag.agentSDK.dispose();
        printLogLine('[sdkDispose] SDK disposed');
        $('button#init').removeAttr('disabled');
        $('button#dispose').attr('disabled', 'disabled');
    });
};

const switchToTab = (num) => {
    hideAllTabs();
    $('li#btn_'+num).addClass('active');
    $('div#tab_'+num).show()
};

const visitorFocusedCallback = () => {
    lpTag.agentSDK.get('visitorInfo.visitorName', (visitorName) => {
        printLogLine(`[visitorFocusedCallback] focused on ${visitorName}`)
    })
};

const visitorBlurredCallback = () => {
    lpTag.agentSDK.get('visitorInfo.visitorName', (visitorName) => {
        printLogLine(`[visitorBlurredCallback] ${visitorName} unfocused`)
    })
};

const notificationCallback = (notificationData) => {
    printLogLine(`[notificationCallback] data: ${JSON.stringify(notificationData)}`)
};

// query params tab

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

// binding log tab

const addBindIndicators = () => {
    let buttonGroup = $('div#bindIndicators');

    for (let path in dataSources) {
        buttonGroup.append($('<button>', {
            id: path,
            type: 'button',
            class: 'btn btn-default btn-sm',
            text: path,
            on: { click: function() { toggleDataBind(this.id) } }
        }))
    }
};

const bindDataSources = () => {
    return Promise.all(Object.keys(dataSources).map(source => {
        return bindDataSource(source)
    }));
};

const unbindDataSources = () => {
    return Promise.all(Object.keys(dataSources).map(source => {
        return unbindDataSource(source)
    }));
};

const addFilterDropDown = () => {
    let dropdown = $('select#eventFilter');
    dropdown.append($('<option>').val('none').text('all'));
    for (let path in dataSources) {
        dropdown.append($('<option>').val(path).text(path))
    }
    dropdown.change(filterEvents)
};

const bindUnchangedFilter = () => {
    $('input#showUnchanged').change(filterEvents)
};

const printData = (data) => {
    // check whether data changed since last update
    //TODO: figure out why this doesn't work after toggling bind?!
    let unchanged;
    if (data.newValue === lastValue[data.key]) {
        unchanged = true;
    } else {
        lastValue[data.key] = data.newValue
    }

	let d = new Date();
	let timeString = d.getHours()+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2)+'.'+d.getMilliseconds();
	let newEntry = $('<tr>').addClass(data.key).addClass('bindingOutputRow')
		.append($('<td>').text(timeString))
		.append($('<td>').text(data.key))
		// .append($('<td>').css('padding','0').html(formatDataValue(data)));
        .append($('<td>').jsonViewer(data.newValue, bindJSONOptions));
	if (unchanged) newEntry.addClass('unchanged');
	let eventFilterValue = $('select#eventFilter').val();
	if ((eventFilterValue !== data.key && eventFilterValue !== 'none') || (unchanged && !$('input#showUnchanged')[0].checked)) { newEntry.hide() }
	$('table#bindOutput tr:first').after(newEntry)
};

const bindToggleCollapse = () => {
    bindJSONOptions.collapsed = !bindJSONOptions.collapsed;
    $('table#bindOutput a.json-toggle').click();
    $('button#toggleCollapse').text(bindJSONOptions.collapsed ? 'Expand All' : 'Collapse All')
};

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

const bindDataSource = (path) => {
    updateBindIndicator(path);
    return new Promise((resolve, reject) => {
        lpTag.agentSDK.bind(path,
            printData,
            (err) => {
                if (err) {
                    updateBindIndicator(path, 0);
                    reject(err);
                } else {
                    dataSources[path].bound = true;
                    updateBindIndicator(path, 1);
                    resolve(true)
                }
            })
    });
};

const unbindDataSource = (path) => {
    updateBindIndicator(path);
    return new Promise((resolve, reject) => {
        lpTag.agentSDK.unbind(path,
            printData,
            (err) => {
                if (err) {
                    updateBindIndicator(path, 1);
                    reject(err)
                } else {
                    dataSources[path].bound = false;
                    updateBindIndicator(path, 0);
                    resolve(true)
                }
            })
    });
};

const toggleDataBind = (path) => {
    if (dataSources[path].bound) {
        unbindDataSource(path).then(() => {
            printLogLine(`[unbind] unbound ${path}`)
        }).catch(e => {
            printLogLine(`[unbind] ERROR unbinding ${path}: ${e}`)
        })
    } else {
        bindDataSource(path).then(() => {
            printLogLine(`[unbind] bound ${path}`)
        }).catch(e => {
            printLogLine(`[unbind] ERROR binding ${path}: ${e}`)
        })
    }
};

const updateBindIndicator = (path, state) => {
    let btn = $('button#'+path);
    btn.removeClass('btn-default btn-success btn-warning');
    if (state === 0) {
        btn.addClass('btn-warning')
    } else if (state === 1) {
        btn.addClass('btn-success')
    } else {
        btn.addClass('btn-default')
    }
};

// sdk methods tab

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
            class: 'btn btn-primary btn-sm',
            text: path,
            on: { click: function() { getCommand(this.id.substr(10)) } }
        });
        buttonsDiv.append(button);
    }

};

const getCommand = (path) => {
    lpTag.agentSDK.get(path, data => {
        $('pre#getOutput').jsonViewer(data);
        printLogLine(`[get] successfully got ${path}`)
    }, error => {
        if (error) {
            $('pre#getOutput').jsonViewer(error);
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

// widget log tab

const printLogLine = (logLine) => {
    let timestamp = new Date().toLocaleTimeString('en-gb');
    let line = $('<span>').text(timestamp+' '+logLine+'\n');
    $('pre#logOutput').prepend(line)
};

// init

const init = () => {
	sdkInit();
    addBindIndicators();
	addFilterDropDown();
	bindUnchangedFilter();
	getQueryStringParams();
	printQueryStringParams();
	populateSampleSC();
	createGetButtons();
    switchToTab(selected);
	printLogLine(`[widget] initialized SDK version ${lpTag.agentSDK.v}`);
};

$(function(){
	hideAllTabs();
	printLogLine('[widget] initializing in '+initDelay+' ms...');
	setTimeout(init,initDelay);
});