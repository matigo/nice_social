function doShowPrefs(pref) {
    if ( pref === '' || pref === undefined ) {
        toggleClass('prefs','show','hide');
    } else {
        toggleClassIfExists('prefs','hide','show');
        if ( constructDialog('prefs') ) { fillPrefsWindow(pref); }
    }
}
function fillPrefsWindow( opt ) {
    var bgColor = '#' + readStorage('header_background'),
        frColor = '#' + readStorage('header_color');
    var html = '';

    switch ( opt ) {
        case 'main':
            var items = { 'streams': { 'label': "Streams", 'icon': "fa-bullhorn", 'action': "fillPrefsWindow('streams');" },
                          'prefs': { 'label': "Preferences", 'icon': "fa-sliders", 'action': "fillPrefsWindow('prefs');" },
                          'mutes': { 'label': "Muted Items", 'icon': "fa-microphone-slash", 'action': "fillPrefsWindow('mutes');" },
                          'logout': { 'label': "Log Out", 'icon': "fa-sign-out", 'action': "doLogout();" }
                        };
            for ( item in items ) {
                html += '<button class="btn btn-prefs" style="background-color: ' + bgColor + '; color: ' + frColor + '"' +
                               ' onClick="' + items[item].action + '">' +
                            '<i class="fa ' + items[item].icon + '"></i>' +
                            '<span>' + items[item].label + '</span>' +
                        '</button>';
            }
            break;

        case 'color':
            var items = { 'Interface Colours': { 'body_background': "Background Colour",
                                                 'header_background': "Header Background",
                                                 'header_color': "Header Colour" },
                          'Post Colours': { 'post-name_color': "Account Name Text",
                                            'post-content_color': "Post Content Text",
                                            'post-mention_color': "Post Mentions Text",
                                            'post-highlight_color': "Post Hightlight Colour" },
                          'Avatar Colours': { 'one-day_color': "Brand New Ring",
                                              'one-week_color': "New Account Ring",
                                              'mention_color': "Mentions Ring",
                                              'avatar_color': "Regular Ring" }
                         };
            var presets = getCSSPresets();
            html = '<strong class="lbltxt" style="width: 95%; text-align: justify; padding: 0 2.5%;">Choose a Colour Scheme You Like:</strong>' +
                   '<label class="lbltxt" for="preset">Presets:</label>' +
                   '<select id="preset" onChange="loadCSSPreset(this.value);">';
            for ( idx in presets ) {
                html += '<option value="' + idx + '">' + presets[idx].label + '</option>';
            }
            html +='</select>';

            for ( item in items ) {
                html += '<strong class="lbltxt" style="width: 95%; text-align: justify; padding: 0 2.5%;">' + item + '</strong>';
                for ( itm in items[item] ) {
                    html += '<label class="lbltxt" for="' + itm + '">' + items[item][itm] + ':</label>' +
                            '<input type="text" id="' + itm + '" value="' + readStorage( itm ) + '"' +
                                  ' onkeyup="validateHexColorAndPreview(\'' + itm + '\');"' +
                                  ' onchange="validateHexColorAndPreview(\'' + itm + '\');">' +
                            '<ex id="prev' + itm + '" style="background-color: #' + readStorage( itm ) + '">&nbsp;</ex>';

                }
            }
            html += '<button style="float: right;" class="btn-green" onClick="saveCSSPreferences();">Set</button>' +
                    '<button style="background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'prefs\');"><i class="fa fa-reply"></i> Back</button>';
            break;
        
        case 'font':
            var items = { '10': { 'label': "Tiny", 'icon': "fa-font" },
                          '12': { 'label': "Small", 'icon': "fa-font" },
                          '14': { 'label': "Normal", 'icon': "fa-font" },
                          '16': { 'label': "Larger", 'icon': "fa-font" },
                          '18': { 'label': "Bigger", 'icon': "fa-font" },
                          '20': { 'label': "HUGE!", 'icon': "fa-font" }
                        };
            var families = ['Helvetica', 'Arial', 'Comic Sans MS', 'Courier New', 'Geneva', 'Georgia', 'Monospace',
                            'Palatino Linotype', 'Sans Serif', 'Serif', 'Tahoma', 'Times New Roman', 'Verdana'];
            var size_px = readStorage('font_size');
            var ff = readStorage('font_family');
            html = '<strong class="lbltxt" style="width: 95%; text-align: justify; padding: 0 2.5%;">Choose Your Text Preferences.</strong>' +
                   '<label class="lbltxt" for="preset">Font Family:</label>' +
                   '<select id="preset" onChange="setFontFamily(this.value);">';
            for ( idx in families ) {
                var selText = ( families[idx] === ff ) ? ' selected' : '';
                html += '<option value="' + families[idx] + '" style="font-family: ' + families[idx] + ';"' + selText + '>' + families[idx] + '</option>';
            }
            html += '</select>';
            for ( item in items ) {
                if ( item === size_px ) {
                    var bg = '#' + readStorage('header_color'),
                        fr = '#' + readStorage('header_background');
                } else {
                    var bg = '#' + readStorage('header_background'),
                        fr = '#' + readStorage('header_color');
                }
                html += '<button id="btn-pt-' + item + '" class="btn btn-prefs" style="background-color: ' + bg + '; color: ' + fr + '"' +
                               ' onClick="setFontSize(' + item + ')">' +
                            '<i class="fa ' + items[item].icon + '" style="font-size: ' + item + 'px;"></i>' +
                            '<span>' + items[item].label + '</span>' +
                        '</button>';
            }
            html += '<button style="background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'prefs\');"><i class="fa fa-reply"></i> Back</button>';
            break;

        case 'hover':
            var items = { 'label': "Mouse Hover Options",
                          'notes': "You can have the Interaction buttons appear when your mouse hovers over a post if you&apos;d like.",
                          'items': { 'show_hover': { 'label': "Show Interactions", 'style': 'bool', 'type': "ed" },
                                     'show_hover_delay': { 'label': "Hide After (Seconds)", 'style': 'seconds', 'type': '' }
                                    }
                              };
            html += '<strong class="lbltxt" style="width: 95%; text-align: justify; padding: 0 2.5%;">' +
                        '<i class="fa fa-location-arrow"></i> ' + items.label +
                    '</strong>';
            if ( items.notes !== '' ) {
                html += '<em class="lbltxt" style="display: block; width: 95%; text-align: justify; padding: 0 2.5%;">' +
                            items.notes +
                        '</em>';
            }
            for ( i in items.items ) {
                var fr = bgColor,
                    bg = frColor,
                    tx = '<i class="fa fa-circle"></i> Enabled';
                switch ( items.items[i].style ) {
                    case 'bool':
                        var value = readStorage( i );
                        if ( value === 'N' ) {
                            fr = frColor;
                            bg = bgColor;
                            tx = '<i class="fa fa-circle-o"></i> Disabled'
                        }
                        html += '<label class="lbltxt">' + items.items[i].label + '</label>' +
                                '<button id="btn-opt-' + i + '" class="btn" style="background-color: ' + bg + '; color: ' + fr + '"' +
                                       ' onClick="toggleOption(\'' + i + '\', \'' + items.items[i].type + '\');">' + tx + '</button>';
                        break;

                    case 'seconds':
                        var value = readStorage( i );
                        value = parseInt(value) / 1000;
                        if ( value === undefined || isNaN(value) ) { value = 5; }
                        html += '<label class="lbltxt">' + items.items[i].label + '</label>' +
                                '<input type="text" id="' + i + '" value="' + value + '">';
                        break;

                    default:
                        /* Do Nothing */
                }
            }
            html += '<button style="float: right;" class="btn-green" onClick="setDelaySeconds();">Set</button>' +
                    '<button style="display: block; background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'prefs\');"><i class="fa fa-reply"></i> Back</button>';
            break;

        case 'language':
            var items = { 'en': { 'label': "English", 'icon': "fa-comments-o" },
                          'de': { 'label': "Deutsch", 'icon': "fa-comments-o" },
                          'es': { 'label': "Español", 'icon': "fa-comments-o" },
                          'fr': { 'label': "Français", 'icon': "fa-comments-o" },
                          'it': { 'label': "Italiano", 'icon': "fa-comments-o" },
                          'pr': { 'label': "Português", 'icon': "fa-comments-o" },
                          'ru': { 'label': "русский", 'icon': "fa-comments-o" },
                          'sv': { 'label': "svenska", 'icon': "fa-comments-o" },
                          'ja': { 'label': "日本語", 'icon': "fa-comments-o" },
                          'ko': { 'label': "한국어", 'icon': "fa-comments-o" }
                        };
            html += '<strong style="width: 95%; text-align: justify; padding: 0 2.5%;">Choose a Display Language:</strong>';
            for ( item in items ) {
                if ( item === 'en' ) {
                    var bg = '#' + readStorage('header_color'),
                        fr = '#' + readStorage('header_background');
                } else {
                    var bg = '#' + readStorage('header_background'),
                        fr = '#' + readStorage('header_color');
                }
                html += '<button id="btn-tl-' + item + '" class="btn btn-prefs" style="background-color: ' + bg + '; color: ' + fr + '"' +
                               ' onClick="toggleLanguage(\'' + item + '\')">' +
                            '<i class="fa ' + items[item].icon + '"></i>' +
                            '<span>' + items[item].label + '</span>' +
                        '</button>';
            }
            html += '<button style="background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'prefs\');"><i class="fa fa-reply"></i> Back</button>';
            break;
        
        case 'mutes':
            var clients = readMutedClients();
            var hashes = readMutedHashtags();
            html += '<strong class="lbltxt" style="display: block; width: 95%; text-align: justify; padding: 0 2.5%;">Muted Hashtags:</strong>';
            for ( idx in hashes ) {
                html += '<button name="hashes" class="btn btn-half" style="background-color: ' + frColor + '; color: ' + bgColor + '"' +
                               ' value="' + hashes[idx] + '" onClick="removeHashFilter(\'' + hashes[idx] + '\');">' +
                            hashes[idx] + ' <i class="fa fa-times"></i>' +
                        '</button>';
            }
            if ( hashes.length === 0 ) {
                html += '<em class="lbltxt" style="display: block; width: 90%; text-align: center; padding: 15px 5%;">' +
                            'You Have Not Muted Any Hashtags' +
                        '</em>';
            }
            html += '<strong class="lbltxt" style="display: block; margin-top: 15px; width: 95%; text-align: justify; padding: 0 2.5%;">Muted Clients:</strong>';
            for ( idx in clients ) {
                html += '<button name="hashes" class="btn btn-half" style="background-color: ' + frColor + '; color: ' + bgColor + '"' +
                               ' onClick="removeHashFilter(\'' + clients[idx] + '\');">' +
                            clients[idx] + ' <i class="fa fa-times"></i>' +
                        '</button>';
            }
            if ( clients.length === 0 ) {
                html += '<em class="lbltxt" style="display: block; width: 90%; text-align: center; padding: 15px 5%;">' +
                            'You Have Not Muted Any Clients' +
                        '</em>';
            }
            html += '<button style="display: block; background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'main\');"><i class="fa fa-reply"></i> Back</button>';
            break;

        case 'global':
            var spacer = '';
            var items = { 0: { 'label': "Basic Global Timeline Filters",
                               'notes': "Customise How You See the Global Timeline",
                               'items': { 'nicerank': { 'label': "NiceRank", 'type': "ed" },
                                          'feeds_hide': { 'label': "Feed Accounts", 'type': "vh" },
                                          'global_hide': { 'label': "Accounts I Follow", 'type': "vh" },
                                         }
                              }
                         };
            for ( idx in items ) {
                html += spacer +
                        '<strong class="lbltxt" style="width: 95%; text-align: justify; padding: 0 2.5%;">' +
                            '<i class="fa fa-filter"></i> ' + items[idx].label +
                        '</strong>';
                if ( items[idx].notes !== '' ) {
                    html += '<em class="lbltxt" style="display: block; width: 95%; text-align: justify; padding: 0 2.5%;">' + items[idx].notes + '</em>';
                }
                for ( i in items[idx].items ) {
                    html += '<label class="lbltxt">' + items[idx].items[i].label + '</label>' +
                            getButtonValue( 'btn-opt-' + i,
                                            i,
                                            items[idx].items[i].type,
                                            'toggleOption(\'' + i + '\', \'' + items[idx].items[i].type + '\');'
                                           );
                }
                spacer = '<br><br>';
            }

            html += '<button style="display: block; background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'prefs\');"><i class="fa fa-reply"></i> Back</button>';
            break;

        case 'ppcolumn':
            var items = { '50': { 'label': "Posts", 'icon': "50" },
                          '100': { 'label': "Posts", 'icon': "100" },
                          '250': { 'label': "Posts", 'icon': "250" },
                          '500': { 'label': "Posts", 'icon': "500" },
                          '1000': { 'label': "Posts", 'icon': "1000" },
                          '99999': { 'label': "Posts", 'icon': "&infin;" },
                        };
            var ppc = readStorage('column_max');
            html += '<strong class="lbltxt" style="width: 95%; text-align: justify; padding: 0 2.5%;">' +
                        'What&apos;s The Maximum Number of Posts You Want in Each Column?' +
                    '</strong>';
            for ( item in items ) {
                var bg = '#' + readStorage('header_background'),
                    fr = '#' + readStorage('header_color');

                if ( item === ppc ) {
                    bg = '#' + readStorage('header_color');
                    fr = '#' + readStorage('header_background');
                }
                html += '<button id="btn-ppc-' + item + '" class="btn btn-prefs" style="background-color: ' + bg + '; color: ' + fr + '"' +
                               ' onClick="setPostsPerColumn(' + item + ')">' +
                            '<i>' + items[item].icon + '</i>' +
                            '<span>' + items[item].label + '</span>' +
                        '</button>';
            }
            html += '<button style="display: block; background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'prefs\');"><i class="fa fa-reply"></i> Back</button>';
            break;

        case 'prefs':
            var items = { 'color': { 'label': "Colours", 'icon': "fa-paint-brush" },
                          'ppcolumn': { 'label': "Column Length", 'icon': "fa-columns" },
                          'font': { 'label': "Fonts", 'icon': "fa-font" },
                          'hover': { 'label': "Hovers", 'icon': "fa-location-arrow" },
                          'global': { 'label': "Filtering", 'icon': "fa-globe" },
                      /*    'language': { 'label': "Languages", 'icon': "fa-comments-o" }, */
                          'refresh': { 'label': "Refresh Rate", 'icon': "fa-refresh" },
                          'scroll': { 'label': "Column Widths", 'icon': "fa-arrows-h" }
                        };
            html += '<strong class="lbltxt">What Would You Like to Change?</strong>';
            for ( item in items ) {
                html += '<button id="btn-tl-' + item + '" class="btn btn-prefs" style="background-color: ' + bgColor + '; color: ' + frColor + '"' +
                               ' onClick="fillPrefsWindow(\'' + item + '\')">' +
                            '<i class="fa ' + items[item].icon + '"></i>' +
                            '<span>' + items[item].label + '</span>' +
                        '</button>';
            }
            html += '<button style="display: block; background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'main\');"><i class="fa fa-reply"></i> Back</button>';
            break;
        
        case 'refresh':
            var items = { '5': { 'label': "Seconds", 'icon': "5" },
                          '15': { 'label': "Seconds", 'icon': "15" },
                          '30': { 'label': "Seconds", 'icon': "30" },
                          '60': { 'label': "Minute", 'icon': "1" },
                          '300': { 'label': "Minutes", 'icon': "5" },
                          '99999': { 'label': "Never", 'icon': "&infin;" }
                        };
            var rrate = readStorage('refresh_rate');
            html += '<strong class="lbltxt" style="width: 95%; text-align: justify; padding: 0 2.5%;">' +
                        'How Often Should the Timelines Be Updated?' +
                    '</strong>';
            for ( item in items ) {
                var bg = '#' + readStorage('header_background'),
                    fr = '#' + readStorage('header_color');

                if ( item === rrate ) {
                    bg = '#' + readStorage('header_color');
                    fr = '#' + readStorage('header_background');
                }
                html += '<button id="btn-rr-' + item + '" class="btn btn-prefs" style="background-color: ' + bg + '; color: ' + fr + '"' +
                               ' onClick="setRefreshInterval(' + item + ')">' +
                            '<i>' + items[item].icon + '</i>' +
                            '<span>' + items[item].label + '</span>' +
                        '</button>';
            }
            html += '<button style="display: block; background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'prefs\');"><i class="fa fa-reply"></i> Back</button>';
            break;
        
        case 'scroll':
            var sb_adjust = readStorage('scrollbar_adjust');
            var sHeight = window.innerHeight || document.body.clientHeight;
            var sWidth = window.innerWidth || document.body.clientWidth;

            if ( isNaN(sb_adjust) || sb_adjust === false ) { sb_adjust = 0; } else { sb_adjust = parseInt(sb_adjust); }
            html  = '<strong class="lbltxt" style="width: 95%; text-align: justify; padding: 0 2.5%;">' +
                        'Column Widths Off a Bit? Adjust Them Here.' +
                    '</strong>' +
                    '<em class="lbltxt" style="display: block; width: 95%; text-align: justify; padding: 0 2.5%;">' +
                        'Note: Negative Numbers Expand the Columns, Positive Numbers Narrow the Columns' +
                    '</em>' +
                    '<label class="lbltxt">Width Adjustment</label>' +
                    '<input type="number" id="scroll_amt" max="50" min="-50" onChange="setColumnWidthAdjustment();" value="' + sb_adjust + '">' +
                    '<em class="lbltxt" style="display: block; width: 95%; text-align: justify; margin-top: 25px; padding: 0 2.5%;">' +
                        'Reported Screen Width: ' + sWidth + 'px / Height: ' + sHeight + 'px' +
                    '</em>';
            html += '<button style="display: block; background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'prefs\');"><i class="fa fa-reply"></i> Back</button>';
            break;


        case 'streams':
            var items = { 'home': { 'label': "Home", 'icon': "fa-home" },
                          'mentions': { 'label': "Mentions", 'icon': "fa-comment" },
                          'global': { 'label': "Filtered Global", 'icon': "fa-globe" },
                          'pms': { 'label': "PMs", 'icon': "fa-lock" },
                          'interactions': { 'label': "Interactions", 'icon': "fa-heartbeat" },
                          'add': { 'label': "Add", 'icon': "fa-plus" }
                        };
            for ( item in items ) {
                var bg = '#' + readStorage('header_background'),
                    fr = '#' + readStorage('header_color');
                if ( window.timelines[item] ) {
                    bg = '#' + readStorage('header_color');
                    fr = '#' + readStorage('header_background');
                }
                html += '<button id="btn-tl-' + item + '" class="btn btn-prefs" style="background-color: ' + bg + '; color: ' + fr + '"' +
                               ' onClick="toggleTimeline(\'' + item + '\')">' +
                            '<i class="fa ' + items[item].icon + '"></i>' +
                            '<span>' + items[item].label + '</span>' +
                        '</button>';
            }
            html += '<button style="display: block; background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'main\');"><i class="fa fa-reply"></i> Back</button>';
            break;

        default:
            /* Do Nothing */
    }
    document.getElementById('pref-list').innerHTML = html;
}
function getButtonValue( id, item, type, on_click ) {
    var bgColor = '#' + readStorage('header_background'),
        frColor = '#' + readStorage('header_color');
    var strings = { 'ed': { on: "Enabled", off: "Disabled", icon: "fa-circle", icoff: "fa-circle-o" },
                    'sh': { on: "Hidden", off: "Show", icon: "fa-circle", icoff: "fa-circle-o" },
                    'vh': { on: "Hidden", off: "Visible", icon: "fa-circle", icoff: "fa-circle-o" }
                   };
    var value = readStorage(item);
    var css = 'background-color: ' + bgColor + '; color: ' + frColor + ';';
    if ( value === 'Y' || value === true || value === 1 ) { css = 'background-color: ' + frColor + '; color: ' + bgColor + ';'; }

    var _html = '<button id="' + id + '" class="btn" style="' + css + '"';
    if ( on_click !== false && on_click !== '' ) { _html += ' onClick="' + on_click + '"'; }
    _html += '>';
    if ( value === 'Y' || value === true || value === 1 ) {
        _html += '<i class="fa ' + strings[type].icon + '"></i> ' + strings[type].on;
    } else {
        _html += '<i class="fa ' + strings[type].icoff + '"></i> ' + strings[type].off;
    }
    _html += '</button>';

    return _html;
}
function toggleTimeline( tl ) {
    if ( tl === 'add' ) {
        alert("[Debug] Sorry ... just a little more testing to do.");
        return false;
    }
    if ( tl === 'interactions' ) {
        alert("[Debug] This is *very* close, but not quite ready.");
        return false;
    }
    window.timelines[tl] = !window.timelines[tl];
    var bgColor = '#' + readStorage('header_color'),
        frColor = '#' + readStorage('header_background');
    if ( window.timelines[tl] ) {
        saveStorage('tl_' + tl, 'Y');
    } else {
        bgColor = '#' + readStorage('header_background'),
        frColor = '#' + readStorage('header_color');
        saveStorage('tl_' + tl, 'N');
    }
    document.getElementById('btn-tl-' + tl).style.backgroundColor = bgColor;
    document.getElementById('btn-tl-' + tl).style.color = frColor;
    showTimelines();
}
function getCSSPresets() {
    return  { 'current': {  'label': "Your Current Theme",
                            'style': {  'body_background': readStorage('body_background'),
                                        'header_background': readStorage('header_background'),
                                        'header_color': readStorage('header_color'),
                                        'post-name_color': readStorage('post-name_color'),
                                        'post-content_color': readStorage('post-content_color'),
                                        'post-mention_color': readStorage('post-mention_color'),
                                        'post-highlight_color': readStorage('post-highlight_color'),
                                        'avatar_color': readStorage('avatar_color'),
                                        'mention_color': readStorage('mention_color'),
                                        'one-week_color': readStorage('one-week_color'),
                                        'one-day_color': readStorage('one-day_color')
                                        }
                            },

            'default': {  'label': "Default Theme",
                            'style': {  'body_background': 'fff',
                                        'header_background': '777',
                                        'header_color': 'fff',
                                        'post-name_color': '333',
                                        'post-content_color': '000',
                                        'post-mention_color': '333',
                                        'post-highlight_color': 'eee',
                                        'avatar_color': 'ccc',
                                        'mention_color': '00f',
                                        'one-week_color': 'd9534f',
                                        'one-day_color': 'ff0'
                                        }
                            },

            'jextxadore': { 'label': "@jextxadore Dark",
                            'style': {  'body_background': '333333',
                                        'header_background': '1f1f1f',
                                        'header_color': 'fff',
                                        'post-name_color': 'd1d1d1',
                                        'post-content_color': 'b4b4b4',
                                        'post-mention_color': 'd1d1d1',
                                        'post-highlight_color': '4c4c4c',
                                        'avatar_color': '999999',
                                        'mention_color': '297acc',
                                        'one-week_color': 'd9534f',
                                        'one-day_color': 'cc99ff'
                                        }
                            },

            'pme': {        'label': "@pme Preferred",
                            'style': {  'body_background': 'eff',
                                        'header_background': '77e',
                                        'header_color': 'fff',
                                        'post-name_color': '333',
                                        'post-content_color': '000',
                                        'post-mention_color': '333',
                                        'post-highlight_color': 'eee',
                                        'avatar_color': 'd95',
                                        'mention_color': '00f',
                                        'one-week_color': 'd9534f',
                                        'one-day_color': 'ff0'
                                        }
                            },

            'hotdog': {     'label': "Hotdog Stand",
                            'style': {  'body_background': 'f00',
                                        'header_background': '000',
                                        'header_color': 'fff',
                                        'post-name_color': 'ff0',
                                        'post-content_color': '000',
                                        'post-mention_color': 'ff0',
                                        'post-highlight_color': 'd9534f',
                                        'avatar_color': '000',
                                        'mention_color': 'ff0',
                                        'one-week_color': 'd9534f',
                                        'one-day_color': '0f0'
                                        }
                            }
            };
}
function loadCSSPreset( preset ) {
    var presets = getCSSPresets();
    for ( i in presets[preset].style ) {
        document.getElementById(i).value = presets[preset]['style'][i];
        validateHexColorAndPreview(i);
    }
}
function setCSSPreferences() {
    jss.set('body', { 'background-color': '#' + readStorage('body_background') });
    jss.set('.header', { 'background-color': '#' + readStorage('header_background') });
    jss.set('.header', { 'color': '#' + readStorage('header_color') });
    jss.set('.post-name', { 'color': '#' + readStorage('post-name_color') });
    jss.set('.post-content', { 'color': '#' + readStorage('post-content_color') });
    jss.set('.post-mention', { 'color': '#' + readStorage('post-mention_color') });
    jss.set('.chat .post-item.post-grey', { 'background-color': '#' + readStorage('post-highlight_color') });
    jss.set('.chatbox', { 'background-color': '#' + readStorage('body_background') });
    jss.set('.chatbox', { 'border-color': '#' + readStorage('header_background') });
    jss.set('.chatbox .title', { 'background-color': '#' + readStorage('header_background') });
    jss.set('.chatbox .title', { 'color': '#' + readStorage('header_color') });
    jss.set('.chatbox .lbltxt', { 'color': '#' + readStorage('post-content_color') });
    jss.set('.profile', { 'background-color': '#' + readStorage('body_background') });
    jss.set('.profile', { 'border-color': '#' + readStorage('header_background') });
    jss.set('.profile .info', { 'color': '#' + readStorage('post-content_color') });
    jss.set('.profile .numbers', { 'color': '#' + readStorage('post-content_color') });
    jss.set('.profile .actions span', { 'color': '#' + readStorage('mention_color') });
    jss.set('.profile .names h4', { 'color': '#' + readStorage('header_color') });
    jss.set('.post-list .post-item .post-actions span', { 'color': '#' + readStorage('post-content_color') });
    jss.set('.post-list .post-item .post-avatar img.avatar-round', { 'border-color': '#' + readStorage('avatar_color') });
    jss.set('.post-list .post-item .post-avatar img.avatar-round.mention', { 'border-color': '#' + readStorage('mention_color') });
    jss.set('.post-list .post-item .post-avatar img.avatar-round.recent-acct', { 'border-color': '#' + readStorage('one-week_color') });
    jss.set('.post-list .post-item .post-avatar img.avatar-round.new-acct', { 'border-color': '#' + readStorage('one-day_color') });
}
function saveCSSPreferences() {
    var items = ['body_background', 'header_background', 'header_color',
                 'post-name_color', 'post-content_color', 'post-mention_color', 'post-highlight_color',
                 'avatar_color', 'mention_color', 'one-week_color', 'one-day_color'];
    for ( var i = 0; i < items.length; i++ ) {
        var hex = document.getElementById(items[i]).value.replaceAll('#', '');
        var isOk  = /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(hex);
        if ( isOk ) { saveStorage( items[i], hex ); }
    }
    setCSSPreferences();
}
function validateHexColorAndPreview( elID ) {
    var hex = document.getElementById(elID).value.replaceAll('#', '');
    var isOk  = /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(hex);
    if ( isOk ) { document.getElementById('prev' + elID).style.backgroundColor = '#' + hex; }
}
function setRefreshInterval( interval ) {
    var options = [5, 15, 30, 60, 300, 10000];
    var bgColor = '#' + readStorage('header_color'),
        frColor = '#' + readStorage('header_background');
    var rrate = parseInt(interval);
    if ( rrate === undefined || isNaN(interval) ) { rrate = 15; }
    var old_val = readStorage('refresh_rate');
    saveStorage('refresh_rate', rrate);

    var elementExists = document.getElementById('btn-rr-' + old_val);
    if ( elementExists !== null && elementExists !== undefined ) {
        document.getElementById('btn-rr-' + old_val).style.backgroundColor = frColor;
        document.getElementById('btn-rr-' + old_val).style.color = bgColor;
        document.getElementById('btn-rr-' + rrate).style.backgroundColor = bgColor;
        document.getElementById('btn-rr-' + rrate).style.color = frColor;
    }
}
function setPostsPerColumn( posts ) {
    var options = [50, 100, 250, 500, 1000, 99999];
    var bgColor = '#' + readStorage('header_color'),
        frColor = '#' + readStorage('header_background');
    var pcnt = parseInt(posts);
    if ( pcnt === undefined || isNaN(pcnt) ) { pcnt = 250; }
    var old_val = readStorage('column_max');
    saveStorage('column_max', pcnt);

    var elementExists = document.getElementById('btn-ppc-' + old_val);
    if ( elementExists !== null && elementExists !== undefined ) {
        document.getElementById('btn-ppc-' + old_val).style.backgroundColor = frColor;
        document.getElementById('btn-ppc-' + old_val).style.color = bgColor;
        document.getElementById('btn-ppc-' + pcnt).style.backgroundColor = bgColor;
        document.getElementById('btn-ppc-' + pcnt).style.color = frColor;
    }
    trimPosts();
}
function setFontFamily( family ) {
    document.body.style.fontFamily = family;
    saveStorage('font_family', family);
}
function setFontSize( size_px ) {
    var options = [10, 12, 14, 16, 18, 20];
    var bgColor = '#' + readStorage('header_color'),
        frColor = '#' + readStorage('header_background');
    size_px = parseInt(size_px);
    if ( size_px === undefined || isNaN(size_px) ) { size_px = 14; }
    document.body.style.fontSize = size_px + "px";
    document.body.style.lineHeight = (size_px + 6) + "px";
    var old_val = readStorage('font_size');
    saveStorage('font_size', size_px);

    var elementExists = document.getElementById('btn-pt-' + old_val);
    if ( elementExists !== null && elementExists !== undefined ) {
        document.getElementById('btn-pt-' + old_val).style.backgroundColor = frColor;
        document.getElementById('btn-pt-' + old_val).style.color = bgColor;
        document.getElementById('btn-pt-' + size_px).style.backgroundColor = bgColor;
        document.getElementById('btn-pt-' + size_px).style.color = frColor;
    }
}
function setGlobalShow( type ) {
    var options = ['e', 'n'];
    var show_type = ( type === 'n' ) ? 'n' : 'e';
    saveStorage('global_show', show_type);
}
function setDelaySeconds() {
    var sec = parseInt( document.getElementById('show_hover_delay').value );
    if ( sec === undefined || isNaN(sec) ) {
        alert( "Whoops. Please Enter a Value Between 1 and 15." );
        return false;
    }
    if ( sec < 1 || sec > 15 ) {
        alert( "Whoops. Please Enter a Value Between 1 and 15." );
        return false;
    }
    saveStorage('show_hover_delay', (sec * 1000));
}
function setColumnWidthAdjustment() {
    var px = parseInt( document.getElementById('scroll_amt').value )
    if ( px === undefined || isNaN(px) || px === false ) { px = 0; }
    saveStorage('scrollbar_adjust', px);
    setWindowConstraints();
}
function toggleOption( item, txt ) {
    var bgColor = '#' + readStorage('header_color'),
        frColor = '#' + readStorage('header_background');
    var txtOpts = { 'ed': {'enabled': "Enabled", 'disabled': "Disabled"},
                    'sh': {'enabled': "Hidden", 'disabled': "Show"},
                    'vh': {'enabled': "Hidden", 'disabled': "Visible"}
                   };
    var value = readStorage(item);
    if ( value === 'Y' ) { value = false; } else { value = true; }
    saveStorage(item, ((value) ? 'Y' : 'N'));

    var elementExists = document.getElementById('btn-opt-' + item);
    if ( elementExists !== null && elementExists !== undefined ) {
        document.getElementById('btn-opt-' + item).style.backgroundColor = (( value ) ? bgColor : frColor);
        document.getElementById('btn-opt-' + item).style.color = (( value ) ? frColor : bgColor);
        document.getElementById('btn-opt-' + item).innerHTML = (( value ) ? '<i class="fa fa-circle"></i> ' + txtOpts[txt]['enabled']
                                                                          : '<i class="fa fa-circle-o"></i> ' + txtOpts[txt]['disabled']);
    }
}
function removeHashFilter( name ) {
    if ( unmuteHashtag(name) ) {
        var btns = document.getElementsByName('hashes');
        for ( i in btns ) {
            if ( btns[i].value === name ) { btns[i].innerHTML = 'Scrubbed'; }
        }
    }
}