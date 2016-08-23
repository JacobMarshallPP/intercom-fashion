(function (factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof module !== "undefined" && module.exports) {
        module.exports = factory();
    } else {
        window.IntercomFashion = factory();
    }
})(function () {
    var customStylesheets = [];
    var presets = {};

    /**
     * Keep checking a certain condition until it's truthy, and then invoke callback.
     *
     * @param {function} condition
     * @param {function} callback
     * @param {number} [interval]
     */
    function checkConditionPoll(condition, callback, interval) {
        if (condition()) {
            callback();
        } else {
            setTimeout(function() {
                checkConditionPoll(condition, callback, interval);
            }, interval);
        }
    }

    /**
     * Invokes the callback argument once the Intercom messenger has booted. Continues to poll
     * every 100ms (or custom interval) until it has booted (which means this script can be included
     * before the Intercom script).
     *
     * @param {function} callback The callback to invoke once Intercom has booted
     * @param {number} [interval] A custom interval for polling (in ms)
     */
    function checkIntercomMessengerHasBooted(callback, interval) {
        checkConditionPoll(
            function () {
                return window.Intercom && window.Intercom.booted;
            },
            function () {
                callback(window.Intercom);
            },
            interval || 100
        );
    }

    function checkIntercomHasLoaded(callback) {
        checkConditionPoll(
            function () {
                return !!document.querySelector('.intercom-app-launcher-enabled');
            },
            callback,
            100
        );
    }

    /**
     * Loads an external css file and adds it to the custom stylesheet.
     *
     * @param {string} url
     */
    function loadCustomStylesheet(url) {
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('readystatechange', function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    addCustomStylesheet(xhr.responseText);
                } else {
                    console.warn('Unable to load custom stylesheet from ' + url + ' (http status: ' + xhr.status + ')');
                }
            }
        });
        xhr.open('GET', url, true);
        xhr.send();
    }

    /**
     * Adds a stylesheet (text) to the custom stylesheet.
     *
     * @param {string} stylesheet
     */
    function addCustomStylesheet(stylesheet) {
        customStylesheets.push(stylesheet);
        applyCustomStylesheets();
    }

    /**
     * Sets the presets (and applies the stylesheets).
     *
     * @param {object} obj
     */
    function setPresets(obj) {
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                presets[key] = obj[key];
            }
        }
        applyCustomStylesheets();
    }

    /**
     * Gets a custom stylesheet for all the presets.
     *
     * @returns {string}
     */
    function getPresetsStylesheet() {
        var presetsStylesheet = '';

        if (presets.tooltip) {
            addPresetsRule(
                '#intercom-container .intercom-comment-tooltip',
                getRulesString({
                    'background-color': presets.tooltip.background,
                    'color': presets.tooltip.color,
                    'border-radius': presets.tooltip.rounded ? '10px' : null
                })
            );
        }

        if (presets.conversation) {
            if (presets.conversation.background) {
                addPresetsRule(
                    '#intercom-container .intercom-conversation-background-app-color',
                    getRulesString({
                        'background-color': presets.conversation.background,
                        'opacity': 1
                    })
                );
            }
        }

        if (presets.modal) {
            if (presets.modal.background) {
                addPresetsRule(
                    '#intercom-container .intercom-modal-overlay',
                    getRulesString({
                        'background-color': presets.modal.background
                    })
                );
            }
        }

        if (presets.launcherButton) {
            if (presets.launcherButton.icon) {
                addPresetsRule(
                    '#intercom-container .intercom-launcher-open-icon',
                    getRulesString({
                        'background-image': 'url(' + presets.launcherButton.icon + ')'
                    })
                );
            }
            if (presets.launcherButton.background) {
                addPresetsRule(
                    '#intercom-container .intercom-launcher',
                    getRulesString({
                        'background-color': presets.launcherButton.background,
                        'background-size': 'contain'
                    })
                );
            }
        }

        if (presets.header) {
            if (presets.header.background) {
                addPresetsRule(
                    '#intercom-container .intercom-conversations-header,' +
                    '#intercom-container .intercom-conversation-body-profile',
                    getRulesString({
                        'background-color': presets.header.background
                    })
                );
            }
            if (presets.header.color) {
                addPresetsRule(
                    '#intercom-container .intercom-conversations-header *,' +
                    '#intercom-container .intercom-conversation-body-profile *',
                    getRulesString({
                        'color': presets.header.color
                    })
                );
            }
        }

        if (presets.newConversation) {
            addPresetsRule(
                '#intercom-container .intercom-conversations-new-conversation-button',
                getRulesString({
                    'background-color': presets.newConversation.background,
                    'color': presets.newConversation.color
                })
            );
        }

        if (presets.userBubble) {
            addPresetsRule(
                '#intercom-container .intercom-comment-container-user .intercom-comment',
                getRulesString({
                    'background-color': presets.userBubble.background,
                    'color': presets.userBubble.color,
                    'border-radius': presets.userBubble.rounded ? '30px' : null
                })
            );
        }

        if (presets.adminBubble) {
            addPresetsRule(
                '#intercom-container .intercom-comment-container-admin .intercom-comment',
                getRulesString({
                    'background-color': presets.adminBubble.background,
                    'color': presets.adminBubble.color,
                    'border-radius': presets.adminBubble.rounded ? '30px' : null
                })
            );
        }

        if (('enableEmoji' in presets) && !presets.enableEmoji) {
            addPresetsRule(
                '#intercom-container .intercom-composer-emoji-button',
                getRulesString({
                    'display': 'none'
                })
            );
        }

        function addPresetsRule(selector, styles) {
            presetsStylesheet += selector.replace(',', ',\n') + ' {' + styles + '\n}\n';
        }

        function getRulesString(rules) {
            var str = '';
            for (var property in rules) {
                if (rules.hasOwnProperty(property) && rules[property]) {
                    str += '\n\t' + property + ': ' + rules[property] + ';';
                }
            }
            return str;
        }

        return presetsStylesheet;
    }

    /**
     * Sets the custom stylesheet.
     *
     * @see {applyCustomStylesheetsToFrame}
     */
    function applyCustomStylesheets() {
        applyCustomStylesheetsToFrame(document);
        applyCustomStylesheetsToFrame(document.querySelector('.intercom-messenger-frame > iframe'));
        applyCustomStylesheetsToFrame(document.querySelector('.intercom-launcher-frame'));
    }

    function applyCustomStylesheetsToFrame(frame) {
        if (!frame) return;

        var frameDocument = frame.contentDocument || frame;
        var customStyle = frameDocument.getElementById('intercom-fashion-stylesheet');

        if (!customStyle) {
            customStyle = frameDocument.createElement('style');
            customStyle.id = 'intercom-fashion-stylesheet';
            frameDocument.head.appendChild(customStyle);
        }

        var existingIntercomStylesheet = frameDocument.getElementById('intercom-stylesheet');
        if (existingIntercomStylesheet) {
            // For the stylesheet within the host page, the stylesheet needs to be placed after the intercom stylesheet...
            existingIntercomStylesheet.parentElement.insertBefore(customStyle, existingIntercomStylesheet.nextSibling);
        }

        var stylesheet = '/* Intercom Fashion */\n';
        stylesheet += customStylesheets.join('\n') + '\n';
        stylesheet += getPresetsStylesheet();

        customStyle.innerHTML = stylesheet;
    }

    /**
     * Registers any intercom events, so we can listen to when the messenger shows/hides.
     *
     * @see {Intercom}
     */
    function registerIntercomEvents(Intercom) {
        Intercom('onShow', function () {
            setTimeout(applyCustomStylesheets);
        });
    }

    checkIntercomMessengerHasBooted(registerIntercomEvents);
    checkIntercomHasLoaded(applyCustomStylesheets);

    return {
        load: loadCustomStylesheet,
        style: addCustomStylesheet,
        config: setPresets,
        ready: checkIntercomMessengerHasBooted,
    };
});