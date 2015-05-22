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
                                            'post-mention_color': "Post Mentions Text" }
                         };

            html = '<strong>Preset</strong>' +
                   '<label for="preset">Presets:</label>' +
                   '<select id="color_themes" onChange="loadCSSPreset(this.value);">' +
                        '<option value="default">Default</option>' +
                        '<option value="jextxadore">@jextxadore Dark</option>' +
                        '<option value="pme">@pme Preferred</option>' +
                        '<option value="hotdog">Hotdog Stand</option>' +
                   '</select>';

            for ( item in items ) {
                html += '<strong>' + item + '</strong>';
                for ( itm in items[item] ) {
                    html += '<label for="body_background">' + items[item][itm] + ':</label>' +
                            '<input type="text" id="' + itm + '" value="' + readStorage( itm ) + '"' +
                                  ' onkeyup="validateHexColorAndPreview(\'' + itm + '\');"' +
                                  ' onchange="validateHexColorAndPreview(\'' + itm + '\');">' +
                            '<ex id="prev' + itm + '" style="background-color: #' + readStorage( itm ) + '">&nbsp;</ex>';

                }
            }
            html += '<button style="background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'prefs\');"><i class="fa fa-reply"></i> Back</button>' +
                    '<button style="float: right;" class="btn-green" onClick="saveCSSPreferences();">Save</button>';
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
        
        case 'other':
            var items = { 'livetime': { 'label': "Show Live Timestamps", 'icon': "fa-toggle-off" },
                          'hide_img': { 'label': "Show Inline Images", 'icon': "fa-toggle-off" },
                          'nicerank': { 'label': "Use NiceRank Global Filter", 'icon': "fa-toggle-on" }
                        };
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
            html += '<strong style="width: 95%; text-align: justify; padding: 0 2.5%;">' +
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
            html += '<button style="background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'prefs\');"><i class="fa fa-reply"></i> Back</button>';
            break;

        case 'prefs':
            var items = { 'color': { 'label': "Colours", 'icon': "fa-paint-brush" },
                          'language': { 'label': "Languages", 'icon': "fa-comments-o" },
                          'ppcolumn': { 'label': "Column Length", 'icon': "fa-columns" },
                          'refresh': { 'label': "Refresh Rate", 'icon': "fa-refresh" }
                        };
            html += '<strong>What Would You Like to Change?</strong>';
            for ( item in items ) {
                html += '<button id="btn-tl-' + item + '" class="btn btn-prefs" style="background-color: ' + bgColor + '; color: ' + frColor + '"' +
                               ' onClick="fillPrefsWindow(\'' + item + '\')">' +
                            '<i class="fa ' + items[item].icon + '"></i>' +
                            '<span>' + items[item].label + '</span>' +
                        '</button>';
            }
            html += '<button style="background-color: ' + bgColor + '; color: ' + frColor + '"' +
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
            html += '<strong style="width: 95%; text-align: justify; padding: 0 2.5%;">' +
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
            html += '<button style="background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'prefs\');"><i class="fa fa-reply"></i> Back</button>';
            break;

        case 'streams':
            var items = { 'home': { 'label': "Home", 'icon': "fa-home" },
                          'mentions': { 'label': "Mentions", 'icon': "fa-comment" },
                          'global': { 'label': "Filtered Global", 'icon': "fa-globe" },
                          'pms': { 'label': "PMs", 'icon': "fa-lock" }
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
            html += '<button style="background-color: ' + bgColor + '; color: ' + frColor + '"' +
                           ' onClick="fillPrefsWindow(\'main\');"><i class="fa fa-reply"></i> Back</button>';
            break;

        default:
            /* Do Nothing */
    }
    document.getElementById('pref-list').innerHTML = html;
}
function toggleLanguage( la ) {
    alert( "Whoops! This Hasn't Been Completed Yet!" );
}
function toggleTimeline( tl ) {
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
function loadCSSPreset( preset ) {
    var presets = { 'default': { 'body_background': 'fff',
                                 'header_background': '777',
                                 'header_color': 'fff',
                                 'post-name_color': '333',
                                 'post-content_color': '000',
                                 'post-mention_color': '333' },
                    'jextxadore': { 'body_background': 'b4b4b4',
                                    'header_background': '777',
                                    'header_color': 'fff',
                                    'post-name_color': '4d94ff',
                                    'post-content_color': '1f1f1f',
                                    'post-mention_color': '4d94ff' },
                    'pme': { 'body_background': 'eff',
                             'header_background': '77e',
                             'header_color': 'fff',
                             'post-name_color': '333',
                             'post-content_color': '000',
                             'post-mention_color': '333' },
                    'hotdog': { 'body_background': 'f00',
                                'header_background': '000',
                                'header_color': 'fff',
                                'post-name_color': 'ff0',
                                'post-content_color': '000',
                                'post-mention_color': 'ff0' }
                    };
    for ( i in presets[preset] ) {
        document.getElementById(i).value = presets[preset][i];
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
}
function saveCSSPreferences() {
    var items = ['body_background', 'header_background', 'header_color', 'post-name_color', 'post-content_color', 'post-mention_color'];
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

function setFontSize( size_px ) {
    var options = [12, 14, 16, 20];
    size_px = parseInt(size_px);
    if ( size_px === undefined || isNaN(size_px) ) { size_px = 14; }
    document.body.style.fontSize = size_px + "px";
    saveStorage('font_size', size_px);
}
function setGlobalShow( type ) {
    var options = ['e', 'n'];
    var show_type = ( type === 'n' ) ? 'n' : 'e';
    saveStorage('global_show', show_type);
}
