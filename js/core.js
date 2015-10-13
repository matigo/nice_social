String.prototype.replaceAll = function(str1, str2, ignore) {
   return this.replace(new RegExp(str1.replace(/([\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, function(c){return "\\" + c;}), "g"+(ignore?"i":"")), str2);
};
String.prototype.ireplaceAll = function(strReplace, strWith) {
    var reg = new RegExp(strReplace, 'ig');
    return this.replace(reg, strWith);
};
String.prototype.hashCode = function() {
    var hash = 0, i, chr, len;
    if (this.length == 0) return hash;
    for (i = 0, len = this.length; i < len; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
};
if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] === needle) { return i; }
        }
        return -1;
    };
}
jQuery.fn.scrollTo = function(elem, speed) { 
    $(this).animate({
        scrollTop:  $(this).scrollTop() - $(this).offset().top + $(elem).offset().top 
    }, speed === undefined ? 1000 : speed); 
    return this; 
};
jQuery(function($) {
    window.store = new Object();
    window.coredata = {};
    window.users = {};
    window.files = {};
    window.activate = false;
    window.timelines = { home     : false,
                         mentions : false,
                         global   : true,
                         pms      : false,
                         interact : false
                        };
    window.tl_order = { 1: 'home',
                        2: 'mentions',
                        3: 'global',
                        4: 'pms',
                        5: 'interact'
                       };
    loadConfigFile();
    window.KEY_ENTER = 13;
    window.KEY_ESCAPE = 27;
    window.KEY_N = 78;
    window.KEY_P = 80;
    window.KEY_F2 = 113;
    window.KEY_F3 = 114;
    window.KEY_DOWNARROW = 40;

    $('#doAction').click(function() { doPostOrAuth(); });
    $('#rpy-kill').click(function() { killPost(); });
    $('#rpy-send').click(function() { sendPost(); });
    $("#rpy-text").keyup(function() {
        var caret = getCaretPos(this);
        var result = /\S+$/.exec(this.value.slice(0, caret));
        var lastWord = result ? result[0] : null;
        if ( lastWord !== undefined && lastWord !== '' && lastWord !== null ) {
            if ( lastWord.length >= 4 && lastWord.charAt(0) === '@' ) {
                listNames( lastWord );
            } else {
                if( $('#autocomp').hasClass('show') ) { $('#autocomp').removeClass('show').addClass('hide') }
            }
        }
        doHandyTextSwitch();
    });
    $("#rpy-text").keydown(function (event) { 
        if ( (event.metaKey || event.ctrlKey) && event.keyCode === KEY_ENTER ) { 
            sendPost();
        }
        if ( $('#autocomp').hasClass('show') && event.keyCode === KEY_DOWNARROW) {
            $('#autocomp > .autobox > span:first-child').trigger("click");
            return false;
        } 
    });
    $(document).keyup(function(e) {
        if( $('#response').hasClass('hide') ) {
            if ( readStorage('shortkey_n') == 'Y' ) { if ( e.keyCode === KEY_N ) { showHideResponse(); } }
            if ( e.keyCode >= 49 && e.keyCode <= 53 ) { showHideTL( window.tl_order[e.keyCode - 48] ); }
        }
        if ( e.keyCode === KEY_F2 ) { $('#autocomp').removeClass('show').addClass('hide'); }
    });
    $(document).keydown(function(e) {
        var cancelKeyPress = false;
        if (e.keyCode === KEY_ESCAPE && readStorage('shortkey_esc') == 'Y' ) {
            var items = ['conversation', 'gallery', 'hashbox', 'dialog', 'okbox', 'prefs'];
            for ( idx in items ) {
                toggleClassIfExists(items[idx], 'show', 'hide');
            }
            cancelKeyPress = true;
            killPost();
        }
        if ( readStorage('shortkey_f3') == 'Y' ) {
            if ( e.keyCode === KEY_F3 ) { doShowPrefs('main'); cancelKeyPress = true; }
        }
        if (cancelKeyPress) { return false; }
    });
    document.addEventListener('focusout', function(e) {window.scrollTo(0, 0)});
    $( window ).resize(function() { setWindowConstraints(); });
});
window.addEventListener('load', function(){
    var touchsurface = document.getElementById('rpy-text'),
        touchMenu = document.getElementById('header_bar'),
        startX,
        startY,
        dist,
        threshold = 150,
        allowedTime = 1000,
        elapsedTime,
        startTime;
    function handleswipe(isRightSwipe, isLeftSwipe) {
        if ( isRightSwipe === true ) { setCursorPosition( 1 ); }
        if ( isLeftSwipe === true ) { setCursorPosition( -1 ); }
    }
    function handleMenuSwipe(isRightSwipe, isLeftSwipe) {
        if ( isRightSwipe === true ) { rotateTimelines(); }
        if ( isLeftSwipe === true ) { rotateTimelines(); }
    }
    function rotateTimelines() {
        var els = document.getElementsByClassName("post-list");
        var showNext = false;
        var cnt = 0;

        for (i in window.timelines) {
            if ( showNext ) {
                if ( window.timelines.hasOwnProperty(i) ) {
                    window.timelines[i] = true;
                    if ( window.timelines[i] ) { saveStorage('tl_' + i, 'Y'); } else { saveStorage('tl_' + i, 'N'); }
                    break;
                }
            }
            if ( els[0].id === i ) {
                if ( window.timelines.hasOwnProperty(i) ) {
                    window.timelines[i] = !window.timelines[i];
                    if ( window.timelines[i] ) { saveStorage('tl_' + i, 'Y'); } else { saveStorage('tl_' + i, 'N'); }
                    showNext = true;
                }
            } else {
                window.timelines[i] = false;
            }
        }
        for (i in window.timelines) { if ( window.timelines[i] ) { cnt++; } }
        if ( cnt == 0 ) { window.timelines['home'] = true; }
        showTimelines();
    }
    function setCursorPosition( PlusMinus ) {
        var txtBox = document.getElementById('rpy-text');
        setCaretToPos(txtBox, txtBox.selectionEnd + PlusMinus);
    }
    touchMenu.addEventListener('touchstart', function(e) {
        var touchobj = e.changedTouches[0];
        dist = 0;
        startX = touchobj.pageX;
        startY = touchobj.pageY;
        startTime = new Date().getTime();
    }, false);
    touchMenu.addEventListener('touchend', function(e){
        var touchobj = e.changedTouches[0];
        dist_r = touchobj.pageX - startX;
        dist_l = startX - touchobj.pageX;
        elapsedTime = new Date().getTime() - startTime;
        var isRightSwipe = (elapsedTime <= allowedTime && dist_r >= threshold && Math.abs(touchobj.pageY - startY) <= 100),
            isLeftSwipe = (elapsedTime <= allowedTime && dist_l >= threshold && Math.abs(touchobj.pageY - startY) <= 100);
        handleMenuSwipe(isRightSwipe, isLeftSwipe);
        if ( isRightSwipe || isLeftSwipe ) { e.preventDefault(); }
    }, false);

    touchsurface.addEventListener('touchstart', function(e) {
        touchsurface.innerHTML = '';
        var touchobj = e.changedTouches[0];
        dist = 0;
        startX = touchobj.pageX;
        startY = touchobj.pageY;
        startTime = new Date().getTime();
    }, false);
    touchsurface.addEventListener('touchmove', function(e){ e.preventDefault(); }, false);
    touchsurface.addEventListener('touchend', function(e){
        var touchobj = e.changedTouches[0];
        dist_r = touchobj.pageX - startX;
        dist_l = startX - touchobj.pageX;
        elapsedTime = new Date().getTime() - startTime;
        var isRightSwipe = (elapsedTime <= allowedTime && dist_r >= threshold && Math.abs(touchobj.pageY - startY) <= 100),
            isLeftSwipe = (elapsedTime <= allowedTime && dist_l >= threshold && Math.abs(touchobj.pageY - startY) <= 100);
        handleswipe(isRightSwipe, isLeftSwipe);
        if ( isRightSwipe || isLeftSwipe ) { e.preventDefault(); }
    }, false); 
}, false);
document.getElementById('file').addEventListener('change', function(e) {
    var access_token = readStorage('access_token');
    if ( access_token === undefined || access_token === false || access_token === '' ) { return false; }

    var file = this.files[0];
    var xhr = new XMLHttpRequest();
    var url = window.apiURL + '/files';
    var fileObj = getFileObjectByType( file );

    xhr.onreadystatechange = function(e) { if ( 4 == this.readyState ) { parseFileUpload( e.target.response, file, fileObj.anno ); } };
    xhr.open('post', url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + access_token);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(fileObj));
}, false);
function loadConfigFile() {
    if ( readConfigFile( 'config.json' ) ) { return true; }
}
function getFileObjectByType( file ) {
    var fileObj = false;
    
    switch ( file.type ) {
        case 'audio/x-m4a':
        case 'audio/mpeg':
        case 'audio/mp4':
        case 'audio/mp3':
            fileObj = { 'anno': "social.nice.audio",
                        'kind': "audio",
                        'type': "rich",
                        'mime_type': file.type,
                        'name': file.name,
                        'public': true
                       };
            break;
        
        default:
            fileObj = { 'anno': "net.app.core.oembed",
                        'kind': "photo",
                        'type': "photo",
                        'mime_type': file.type,
                        'name': file.name,
                        'public': true
                       };
    }
    return fileObj;
}
function continueLoadProcess() {
    if ( prepApp() ) {
        window.setInterval(function(){
            getGlobalItems();
            redrawList();
        }, 1000);
        window.setInterval(function(){ collectRankSummary(); }, 60*60*1000);
        window.setInterval(function(){ updateTimestamps(); }, 15000);
        window.setInterval(function(){ testInfiniteLoop(); }, 1000);

        /* Add the Moment.js Resources if Required */
        loadMomentIfRequired();

        getPMSummary();
        showTimelines();
        collectRankSummary();
        getGlobalRecents();
    }
}
function testInfiniteLoop() {
    last_ts = readStorage('last_global_query', true);
    if ( last_ts !== false ) {
        var refresh_rate = parseInt(readStorage('refresh_rate'));
        var curr_ts = new Date().getTime();
        if ( (curr_ts - last_ts) > (refresh_rate * 1000) ) {
            if ( (curr_ts - last_ts) >= (refresh_rate * 2000) ) {
                var ts = new Date().getTime();
                saveStorage('last_global_query', ts, true);
                window.setInterval(function(){ getGlobalItems(); }, 1000);
                console.log('[' + curr_ts + '] Restarting getGlobalItems');
            }
        }
    }
}
function loadMomentIfRequired( override ) {
    if ( readStorage('absolute_times') === 'Y' || override === true ) {
        var items = { 0: { el: 'script', type: 'text/javascript', url: 'js/moment-with-locales.js' },
                      1: { el: 'script', type: 'text/javascript', url: 'js/moment-timezone-with-data.js' }
        }

        for ( idx in items ) {
            if ( window.srclist.hasOwnProperty( items[idx].url ) === false ) {
                var link = document.createElement( items[idx].el );
                    link.src = items[idx].url;
                    link.type = items[idx].type;
                document.getElementsByTagName("head")[0].appendChild( link );
                window.srclist[items[idx].url] = true;
            }
        }
    }
}
function setSplashMessage( msg ) {
    if ( msg === undefined || msg === '' ) {
        toggleClassIfExists('splash','show','hide');
    } else {
        toggleClassIfExists('splash','hide','show');
        document.getElementById('prog-msg').innerHTML = msg;
    }
}
function getURLHash(name) {
    var hash = window.location.hash.replace('#', '');
    var items = hash.split('=');

    if ( items[0] === name ) { return items[1] || false; } else { return false; }
}
function doPostOrAuth() {
    var isGood = readStorage('isGood', true);
    if ( isGood === 'Y' ) { showHideResponse(); } else { getAuthorisation(); }
}
function doReply( post_id ) {
    var _id = parseInt(post_id);
    if ( _id > 0 ) { saveStorage('in_reply_to', _id); }
    doPostOrAuth();
}
function doQuote( post_id ) {
    var _id = parseInt(post_id);
    if ( _id > 0 ) {
        saveStorage('in_reply_to', _id);
        saveStorage('is_quote', 'Y', true);
    }
    doPostOrAuth();
}
function testADNAccessToken() {
    var params = { access_token: readStorage('access_token') };
    setSplashMessage('Testing App.Net Token');
    doJSONQuery( '/users/me', false, 'GET', params, parseMyToken, '' );
}
function parseMyToken( data ) {
    if ( data ) {
        document.getElementById('mnu-avatar').style.backgroundImage = 'url("' + data.avatar_image.url + '")';
        document.getElementById('doAction').innerHTML = getLangString('new_post');
        setSplashMessage('Parsing Token Information');
        saveStorage('long_length', 8000, true );
        saveStorage('chan_length', 2048, true);
        saveStorage('post_length', 256, true);
        saveStorage('_refresher', '0', true);
        saveStorage('isGood', 'Y', true);

        saveStorage('username', data.username);
        saveStorage('avatar', data.avatar_image.url);
        saveStorage('locale', data.locale);
        saveStorage('user_id', data.id);
        saveStorage('name', data.name);

        var key_name = 'acct_' + data.id;
        var items = { 'account': data.username,
                       'avatar': data.avatar_image.url,
                         'name': data.name,
                           'id': data.id,
                        'token': readStorage('access_token')
                     };
        saveStorage(key_name, JSON.stringify(items));

        var col_count = 0;
        for (i in window.timelines) {
            if ( readStorage('tl_' + i) === 'Y' ) { col_count++; }
        }
        if ( col_count <= 1 ) {
            window.timelines.mentions = true;
            saveStorage('tl_mentions', 'Y', true);
            window.timelines.home = true;
            saveStorage('tl_home', 'Y', true);
        }
        setSplashMessage('Collecting Timeline Data');
        showTimelines();
    }
}
function getAuthorisation() {
    var params = { client_id: window.apiToken,
                   response_type: 'token',
                   redirect_uri: window.location.href,
                   scope : 'basic stream write_post follow update_profile public_messages messages files'
                  }
    window.location = buildUrl('https://account.app.net/oauth/authorize', params);
}
function getADNAccessToken() {
    var token = readStorage('access_token');
    if ( token === false ) {
        token = getURLHash('access_token') || false;
        if ( token !== false ) { saveStorage('access_token', token); }
    }
    return token;
}
function prepApp() {
    setSplashMessage('Getting Nice Ready ...');
    document.title = window.sitename.replace(/<(?:.|\n)*?>/gm, '');
    var seconds = new Date().getTime() / 1000;
    var items = {  0: { 'key': 'show_live_timestamps', 'value': 'Y', 'useStore': false },
                   1: { 'key': 'refresh_rate', 'value': 15, 'useStore': false },
                   2: { 'key': 'max_post_age', 'value': 4, 'useStore': false },
                   3: { 'key': 'global_show', 'value': 'e', 'useStore': false },
                   4: { 'key': 'global_hide', 'value': 'N', 'useStore': false },
                   5: { 'key': 'feeds_hide', 'value': 'Y', 'useStore': false },
                   6: { 'key': 'column_max', 'value': 250, 'useStore': false },
                   7: { 'key': 'show_hover_delay', 'value': 5000, 'useStore': false },
                   8: { 'key': 'show_hover', 'value': 'N', 'useStore': false },
                   9: { 'key': 'hide_audio', 'value': 'N', 'useStore': false },
                  10: { 'key': 'hide_images', 'value': 'N', 'useStore': false },
                  11: { 'key': 'hide_geodata', 'value': 'N', 'useStore': false },
                  12: { 'key': 'hide_avatars', 'value': 'N', 'useStore': false },
                  13: { 'key': 'hide_longpost', 'value': 'N', 'useStore': false },
                  14: { 'key': 'hide_muted', 'value': 'N', 'useStore': false },
                  15: { 'key': 'expand_links', 'value': 'N', 'useStore': false },
                  16: { 'key': 'show_24h_timestamps', 'value': 'N', 'useStore': false },
                  17: { 'key': 'romanise_time', 'value': 'N', 'useStore': false },
                  18: { 'key': 'debug_on', 'value': 'N', 'useStore': false },

                  20: { 'key': 'refresh_last', 'value': seconds, 'useStore': true },
                  21: { 'key': 'is_uploading', 'value': 'N', 'useStore': true },
                  22: { 'key': 'post_length', 'value': 256, 'useStore': true },
                  23: { 'key': 'chan_length', 'value': 2048, 'useStore': true },
                  24: { 'key': 'long_length', 'value': 8000, 'useStore': true },
                  25: { 'key': 'nice_proxy', 'value': 'N', 'useStore': false },
                  26: { 'key': 'nicerank', 'value': 'Y', 'useStore': false },
                  27: { 'key': 'min_rank', 'value': 2.1, 'useStore': true },
                  28: { 'key': 'limit', 'value': 250, 'useStore': true },
                  29: { 'key': 'since', 'value': '0', 'useStore': true },

                  30: { 'key': 'absolute_times', 'value': 'N', 'useStore': false },
                  31: { 'key': 'keep_timezone', 'value': 'N', 'useStore': false },
                  32: { 'key': 'display_nrscore', 'value': 'N', 'useStore': false },
                  33: { 'key': 'display_details', 'value': 'N', 'useStore': false },
                  34: { 'key': 'display_usage', 'value': 'N', 'useStore': false },
                  35: { 'key': 'blended_mentions', 'value': 'N', 'useStore': false },
                  36: { 'key': 'named_columns', 'value': 'N', 'useStore': false },

                  40: { 'key': 'shortkey_cmdk', 'value': 'Y', 'useStore': false },
                  41: { 'key': 'shortkey_down', 'value': 'Y', 'useStore': false },
                  42: { 'key': 'shortkey_esc', 'value': 'Y', 'useStore': false },
                  43: { 'key': 'shortkey_f3', 'value': 'Y', 'useStore': false },
                  44: { 'key': 'shortkey_n', 'value': 'Y', 'useStore': false },

                  50: { 'key': 'body_background', 'value': 'fff', 'useStore': false },
                  51: { 'key': 'header_background', 'value': '777', 'useStore': false },
                  52: { 'key': 'header_color', 'value': 'fff', 'useStore': false },
                  53: { 'key': 'post-name_color', 'value': '333', 'useStore': false },
                  54: { 'key': 'post-content_color', 'value': '000', 'useStore': false },
                  55: { 'key': 'post-mention_color', 'value': '333', 'useStore': false },
                  56: { 'key': 'post-highlight_color', 'value': 'eee', 'useStore': false },
                  57: { 'key': 'mention_color', 'value': '00f', 'useStore': false },
                  58: { 'key': 'one-week_color', 'value': 'd9534f', 'useStore': false },
                  59: { 'key': 'one-day_color', 'value': 'ff0', 'useStore': false },
                  60: { 'key': 'avatar_color', 'value': 'ccc', 'useStore': false },

                  70: { 'key': 'lang_cd', 'value': 'en', 'useStore': false },
                  71: { 'key': 'font_family', 'value': 'Helvetica', 'useStore': false },
                  72: { 'key': 'font_size', 'value': 14, 'useStore': false },

                  90: { 'key': 'net.app.global-ts', 'value': 0, 'useStore': true }
                 };
    for ( idx in items ) {
        if ( readStorage( items[idx].key, items[idx].useStore ) === false ) { saveStorage( items[idx].key, items[idx].value, items[idx].useStore ); }
    }
    readLangFile( readStorage('lang_cd') );
    setCSSPreferences();

    if ( !readStorage('tl_home') ) {
        for (i in window.timelines) {
            if ( window.timelines.hasOwnProperty(i) ) {
                if ( window.timelines[i] ) { saveStorage('tl_' + i, 'Y'); } else { saveStorage('tl_' + i, 'N'); }
            }
        }
    } else {
        for (i in window.timelines) {
            if ( window.timelines.hasOwnProperty(i) ) {
                window.timelines[i] = ( readStorage('tl_' + i) === 'Y' ) ? true : false;
                if ( window.timelines[i] ) { saveStorage('tl_' + i, 'Y'); } else { saveStorage('tl_' + i, 'N'); }
            }
        }
    }

    /* Set the Navigation Checkmarks Where Appropriate */
    setRefreshInterval( readStorage('refresh_rate') );
    setPostsPerColumn( readStorage('column_max') );
    setHideImages( readStorage('hide_images') );
    setGlobalShow( readStorage('global_show') );
    setFontFamily( readStorage('font_family') );
    setFontSize( readStorage('font_size') );
    setHeaderNav();

    var token = getADNAccessToken();
    if ( token !== false ) { testADNAccessToken(); } else { window.activate = true; }
    return true;
}
function sendPost() {
    var max_length = parseInt( readStorage('post_length', true) ),
        max_default = 256,
        rpy_length = getReplyCharCount();
    if ( checkHasClass('rpy-box', 'longpost') ) {
        max_length = parseInt( readStorage('long_length', true) );
        max_default = 2048;
    }
    if ( checkHasClass('rpy-box', 'pm') ) {
        max_length = parseInt( readStorage('chan_length', true) );
        max_default = 2048;
    }
    if ( max_length === NaN || max_length === undefined ) { max_length = max_default; }
    var reply_to = parseInt(readStorage('in_reply_to'));

    if ( rpy_length > 0 && rpy_length <= max_length ) {
        if ( checkHasClass('rpy-box', 'pm') ) {
            writeChannelPost( document.getElementById('rpy-text').value.trim(),
                              document.getElementById('rpy-sendto').placeholder.trim(),
                              document.getElementById('rpy-sendto').value.trim(),
                              reply_to
                             );
        } else {
            writePost( document.getElementById('rpy-text').value.trim(), reply_to );
        }
    } else {
        if ( rpy_length === 0 ) {
            saveStorage('msgTitle', 'Umm ...', true);
            saveStorage('msgText', 'There Doesn&apos;t Seem To Be a Message. Please Write at Least One Character.', true);
        } else {
            saveStorage('msgTitle', 'Hold On There ...', true);
            saveStorage('msgText', 'This Post Is a Bit Too Long. Please Keep It Within ' + addCommas(max_length) + ' Characters.', true);
        }
        if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
    }
}
function writePost( text, in_reply_to ) {
    if ( checkIfRepeat(text) === false ) { return false; }
    var access_token = readStorage('access_token');

    if ( access_token !== false ) {
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("Authorization", "Bearer " + access_token);
                xhr.setRequestHeader("Content-Type", "application/json");
                return true;
            }
        });
        $.ajax({
            url: window.apiURL + '/posts?include_annotations=1',
            crossDomain: true,
            data: buildJSONPost(text, in_reply_to),
            type: 'POST',
            success: function( data ) {
                if ( parseMeta(data.meta) ) {
                    saveStorage('last_posttext', text, true);
                    saveStorage('in_reply_to', '0');

                    showHideResponse();
                    window.coredata[ 'net.app.global' ][ data.data.id ] = data.data;
                    window.coredata[ 'net.app.global-ts' ] = Math.floor(Date.now() / 1000);
                    if ( parseInt(in_reply_to) > 0 ) { showHideActions( in_reply_to, '*' ); }
                    window.store['location'] = false;
                }
            },
            error: function (xhr, ajaxOptions, thrownError){
                saveStorage('msgTitle', 'Post Error', true);
                if ( xhr.status > 0 ) {
                    saveStorage('msgText', 'App.Net Returned a ' + xhr.status + ' Error (' + thrownError + ').<br>' +
                                        'Please let @matigo know if this problem persists more than a few minutes.', true);
                } else {
                    saveStorage('msgText', 'There Was a Problem Sending Your Post to ADN.', true);
                }
                if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
            }
        });
    }
}
function checkIfRepeat( text ) {
    var last_posttext = readStorage('last_posttext', true);
    if ( text === last_posttext ) {
        saveStorage('msgTitle', 'Duplicate Post', true);
        saveStorage('msgText', 'This post looks like your last one.<br>' +
                               ' Give me a moment. ADN might be slow.', true);
        if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
    } 
    return ( text !== last_posttext );
}
function buildJSONPost( text, in_reply_to ) {
    var access_token = readStorage('access_token');
    var rVal = false;
    var oembed = false;

    if ( access_token !== false ) {
        /* Parse the Text for Images */
        for ( idx in window.files ) {
            if ( text.indexOf('_' + idx + '_') > -1 ) {
                text = text.replaceAll('_' + idx + '_', window.files[idx].url_permanent);
                if ( oembed === false ) { oembed = []; }
                switch ( window.files[idx].anno ) {
                    case 'social.nice.audio':
                        oembed.push({ "type": window.files[idx].anno,
                                      "value": { "filename": window.files[idx].name,
                                                 "filetype": window.files[idx].type,
                                                 "mimetype": window.files[idx].mime,
                                                 "permanent_url": window.files[idx].url_permanent,
                                                 "short_url": window.files[idx].url_short
                                                }
                                    });
                        break;
                    
                    default:
                        oembed.push({ "type": window.files[idx].anno,
                                      "value": { "+net.app.core.file": { "file_id": window.files[idx].id,
                                                                         "file_token": window.files[idx].file_token,
                                                                         "format": "oembed" }
                                                }
                                    });
                }
            }
        }

        /* Is This a LongPost? */
        if ( checkHasClass('rpy-box', 'longpost') ) {
            if ( oembed === false ) { oembed = []; }
            var post_title = document.getElementById('rpy-title').value,
                post_body = text;
            oembed.push({ "type": "net.jazzychad.adnblog.post",
                          "value": { "title": post_title.replace(/^\s+|\s+$/gm,''),
                                     "body": text,
                                     "tstamp": (Date.now() | 0)
                                    }
                        });
            
            /* Build the Public-facing Post */
            text = '';
            if ( post_title !== '' ) {
                text = 'New Post: [' + post_title + '](http://longposts.com/{post_id}) #adnblog';
            } else {
                var idx = 0,
                    max = 235;
                if ( post_body.length > max ) {
                    while ( idx < max ) {
                        if ( post_body.indexOf(' ', idx + 1) < max ) { idx = post_body.indexOf(' ', idx + 1); } else { break; }
                    }
                }
                if ( idx === 0 || idx > max ) { idx = max; }
                text = post_body.substring(0, idx) + '… [Read More](http://longposts.com/{post_id}) #adnblog';
            }
        }

        /* Do We Have Location Data? */
        if ( window.store['location'] !== undefined && window.store['location'] !== false ) {
            if ( oembed === false ) { oembed = []; }
            oembed.push(window.store['location']);
        }

        var params = {
            access_token: access_token,
            include_post_annotations: 1,
            include_annotations: 1,
            include_html: 1,
            text: text,
            entities: {
                parse_markdown_links: true,
                parse_links: true             
            }
        };
        if ( oembed !== false ) { params['annotations'] = oembed; }
        if ( parseInt(in_reply_to) > 0 ) { params.reply_to = in_reply_to; }
        rVal = JSON.stringify(params);
    }
    return rVal;
}
function getUserProfile( user_id ) {
    if ( parseInt(user_id) <= 0 ) { return false; }
    var access_token = readStorage('access_token');
    var params = {
        include_deleted: 0,
        include_machine: 0,
        include_muted: 1,
        include_html: 1,
        count: 50
    };
    if ( access_token !== false ) { params.access_token = access_token; }
    toggleClassIfExists('dialog','hide','show');
    showWaitState('usr-info', 'Accessing App.Net');
    doJSONQuery( '/users/' + user_id, false, 'GET', params, parseUserProfile, '' );
}
function getUserPosts( user_id ) {
    if ( parseInt(user_id) <= 0 ) { return false; }
    var access_token = readStorage('access_token');
    var params = {
        include_deleted: 0,
        include_machine: 0,
        include_muted: 1,
        include_html: 1,
        count: 50
    };
    if ( access_token !== false ) { params.access_token = access_token; }
    toggleClassIfExists('dialog','hide','show');
    showWaitState('usr-info', 'Accessing App.Net');
    doJSONQuery( '/users/' + user_id + '/posts', false, 'GET', params, parseUserPosts, '' );
}
function getUserUsage( user_id ) {
    if ( parseInt(user_id) <= 0 ) { return false; }
    var params = { account_id: user_id };
    doJSONQuery( '/user/list_activity', true, 'GET', params, parseUserUsage, '' );
}
function parseUserUsage( data ) {
    if ( data ) {
        var ds = data.counts;
        var html = '',
            col_max = (data.max_count <= 0) ? 1 : data.max_count,
            pst_max = 0,
            col_pct = 0;

        for ( var i = 0; i < ds.length; i++ ) {
            col_pct = ((ds[i].post_count + ds[i].broadcasts) / col_max) * 100;
            pst_max = ((ds[i].post_count + ds[i].broadcasts) <= 0 ) ? 1 : (ds[i].post_count + ds[i].broadcasts);
            html += '<span class="item" style="height: ' + col_pct + '%;">' +
                        '<red style="height: ' + ((ds[i].broadcasts / pst_max) * 100) + '%;">&nbsp;</red>' +
                        '<blue>&nbsp;</blue>' +
                    '</span>';
        }
        
        if ( readStorage('display_nrscore') === 'Y' ) { document.getElementById( 'history-score' ).innerHTML = 'NiceRank Score: ' + data.nicerank; }
        if ( readStorage('display_usage') === 'Y' ) {
            if ( html != '' ) { document.getElementById( 'history-bars' ).innerHTML = html; }
        }
    }
}
function getUserProfileActions( data ) {
    var _html = '';
    if ( data.id === readStorage('user_id') ) {
        _html = '<ul>' +
                    '<li id="profile-drop" class="hide" onclick="toggleProfileDrop();">' +
                        '<i class="fa fa-cog"></i>' +
                        '<ul>' +
                            '<li onClick="editProfile();">' + getLangString('edit_profile') + '</li>' +
                        '</ul>' +
                    '</li>' +
                '</ul>';
    } else {
        _html = '<ul>' +
                    '<li id="profile-drop" class="hide" onclick="toggleProfileDrop();">' +
                        '<i class="fa fa-cog"></i>' +
                        '<ul>' +
                            '<li onClick="blockAccount(' + data.you_blocked + ', ' + data.id + ');">' + 
                                ((data.you_blocked) ? getLangString('unblock') : getLangString('block')) + 
                            '</li>' +
                            '<li onClick="muteAccount(' + data.you_muted + ', ' + data.id + ');">' + 
                                ((data.you_muted) ? getLangString('unmute') : getLangString('mute')) +
                            '</li>' +
                            '<li onClick="reportAccount(' + data.id + ');">' + getLangString('spammer') + '</li>' +
                        '</ul>' +
                    '</li>' +
                '</ul>';
    }
    return _html;
}
function getUserProfileNumbers( data ) {
    var html = '';
    if ( readStorage('display_nrscore') === 'Y' ) { html += '<div id="history-score" class="score">&nbsp;</div>'; }
    if ( readStorage('display_usage') === 'Y' ) { html += '<div id="history-bars" class="history">&nbsp;</div>'; }
    html += '<div class="detail" style="border-right: 1px solid #ccc;" onclick="doShowUser(' + data.id + ');">' +
                '<strong>' + getLangString('count_posts') + '</strong><p>' + addCommas( data.counts.posts ) + '</p>' +
            '</div>' +
            '<div class="detail" style="border-right: 1px solid #ccc;" onclick="showUserList(\'following\', ' + data.id + ');">' +
                '<strong>' + getLangString('count_follows') + '</strong><p>' + addCommas( data.counts.following ) + '</p>' +
            '</div>' +
            '<div class="detail" onclick="showUserList(\'followers\', ' + data.id + ');">' +
                '<strong>' + getLangString('count_followers') + '</strong><p>' + addCommas( data.counts.followers ) + '</p>' +
            '</div>';
    return html;
}
function parseUserProfile( data ) {
    if ( data ) {
        var html = '',
            action_html = '';
        var my_id = readStorage('user_id');
        var h4color = readStorage('post-content_color');
        var verified = '';
        parseAccountNames( data );

        // Set the Header Information
        document.getElementById( 'usr-banner' ).style.backgroundImage = 'url("' + data.cover_image.url + '")';
        document.getElementById( 'usr-avatar' ).innerHTML = '<img class="avatar-square" src="' + data.avatar_image.url + '">';
        document.getElementById( 'usr-names' ).innerHTML =  '<h3>' + data.username + '</h3>' +
                                                            '<h4 style="color:#' + h4color + '">' + data.name + '</h4>' +
                                                            '<h5>' + getUserProfileActions( data ) + '</h5>';
        if ( data.hasOwnProperty('verified_domain') && data.hasOwnProperty('verified_link') ) {
            verified = '<verified>' +
                           '<i class="fa fa-check-circle"></i> ' + getLangString('verified') +
                           ' <a href="' + data.verified_link + '" target="_blank">' + data.verified_domain + '</a>' +
                       '</verified>';
        }
        document.getElementById( 'usr-info' ).innerHTML = verified + parseText( data.description );
        document.getElementById( 'usr-numbers' ).innerHTML = getUserProfileNumbers( data );

        if ( data.follows_you ) { action_html += '<em>' + getLangString('follows_you') + '</em>'; }
        if ( data.you_follow ) {
            action_html += '<button onclick="doFollow(' + data.id + ', true)" class="btn-red">' + getLangString('unfollow') + '</button>';
        } else {
            if ( data.id !== my_id ) {
                if ( data.you_can_follow ) {
                    action_html += '<button onclick="doFollow(' + data.id + ', false)" class="btn-green">' + getLangString('follow') + '</button>';
                } else {
                    action_html = '&nbsp;';
                }
                
            } else {
                action_html += '<span>' + getLangString('is_you') + '</span>';
            }
        }
        document.getElementById( 'usr-actions' ).innerHTML = action_html;
        if ( readStorage('display_usage') === 'Y' || readStorage('display_nrscore') === 'Y' ) { getUserUsage( data.id ); }

        // Write the Post History
        if ( data.counts.posts > 0 ) {
            getUserPosts( data.id );
        } else {
            document.getElementById( 'user_posts' ).innerHTML = '<div class="post-item">' + getLangString('no_posts') + '</div>';
        }
        toggleClassIfExists('dialog','hide','show');
    }
}
function parseUserPosts( data ) {
    if ( data ) {
        var html = '';

        // Write the Post History
        for ( var i = 0; i < data.length; i++ ) {
            html += '<div id="' + data[i].id + '-u" class="post-item">' +
                        buildHTMLSection( data[i] ) +
                    '</div>';
        }
        document.getElementById( 'user_posts' ).innerHTML = html.replaceAll('[TL]', '-u');
        toggleClassIfExists('dialog','hide','show');
    }
}
function getTimeline() {
    var access_token = readStorage('access_token');
    if ( access_token !== false ) {
        var params = {
            include_directed_posts: 1,
            include_annotations: 1,
            include_deleted: 0,
            include_machine: 0,
            include_muted: 1,
            access_token: access_token,
            include_html: 1,
            count: 200
        };
        doJSONQuery( '/posts/stream', false, 'GET', params, parseItems, '' );
    }
}
function getMentions() {
    var access_token = readStorage('access_token');

    if ( access_token !== false ) {
        setSplashMessage('Getting Your Mentions');
        var params = {
            include_annotations: 1,
            include_deleted: 0,
            include_machine: 0,
            include_muted: 1,
            access_token: access_token,
            include_html: 1,
            count: 50
        }; 
        doJSONQuery( '/users/me/mentions', false, 'GET', params, parseItems, '' );
    }
}
function canRefreshGlobal() {
    var rrate = parseInt(readStorage('refresh_rate')),
        rlast = parseInt(readStorage('refresh_last', true));
    var seconds = new Date().getTime() / 1000;
    if ( rlast === undefined || isNaN(rlast) ) { rlast = 0; }
    if ( (seconds-rlast) >= rrate ) {
        saveStorage('refresh_last', seconds, true);
        return true;
    }
    return false;
}
function getGlobalRecents( since_id ) {
    if ( since_id === undefined || isNaN(since_id) ) { since_id = 0; }
    var recents = parseInt(readStorage('recents', true));
    if ( recents === undefined || isNaN(recents) ) { recents = 0; }
    saveStorage('recents', (recents + 1) , true);
    if ( recents >= 5 ) { return false; }

    var seconds = new Date().getTime() / 1000;
    saveStorage('refresh_last', seconds, true);

    var api_url = ( readStorage('nice_proxy') === 'Y' ) ? window.niceURL + '/proxy' : window.apiURL;
    var access_token = readStorage('access_token');
    var params = {
        include_annotations: 1,
        include_deleted: 0,
        include_machine: 0,
        include_muted: 1,
        include_html: 1,
        count: 200
    }

    if ( access_token !== false ) { params.access_token = access_token; }
    if ( since_id > 0 ) { params.before_id = since_id; }

    $.ajax({
        url: api_url + '/posts/stream/global',
        crossDomain: true,
        data: params,
        success: function( data ) {
            since_id = parseSinceID( data.meta );
            parseItems( data.data );
            getGlobalRecents( since_id );
        },
        error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
        dataType: "json"
    });
}
function parseSinceID( meta ) {
    var rVal = 0;
    if ( meta ) { rVal = parseInt(meta.min_id); }
    return rVal;
}
function getGlobalItems() {
    if ( window.activate === false ) { return false; }
    if ( canRefreshGlobal() === false ) { return false; }
    if ( readStorage('adn_action', true) === 'Y' ) { return false; }
    var ts = new Date().getTime();
    saveStorage('last_global_query', ts, true);

    var access_token = readStorage('access_token');
    var params = {
        include_annotations: 1,
        include_deleted: 1,
        include_machine: 0,
        include_muted: 1,
        include_html: 1,
        since_id: readStorage( 'since', true),
        count: 200        
    };
    if ( access_token !== false ) { params.access_token = access_token; }
    saveStorage('adn_action', 'Y', true);
    doJSONQuery( '/posts/stream/global', false, 'GET', params, parseItems, '' );
    getInteractions();
    getPMUnread();
}
function parseMeta( meta ) {
    var rVal = false;
    if ( meta ) {
        switch ( meta.code ) {
            case 200:
                rVal = true;
                break;

            default:
                alert( "Uh Oh. We've Got a [" + meta.code + "] from App.Net" );
        }
    }
    return rVal;
}
function parseItems( data ) {
    if ( data ) {
        saveStorage('adn_action', 'N', true);

        /* Prep the CoreData Element If Needs Be */
        if ( window.coredata.hasOwnProperty( 'net.app.global' ) === false ) {
            window.coredata[ 'net.app.global-ts' ] = 0;
            window.coredata[ 'net.app.global' ] = {};
        }

        if ( readStorage('nice_proxy') === 'Y' ) {
            for ( var i = 0; i < data.length; i++ ) {
                window.coredata[ 'net.app.global' ][ data[i].id ] = data[i];
                if ( data[i].is_deleted === true ) { setDelete( data[i].id ); }
                if ( data[i].hasOwnProperty('repost_of') ) {
                    if ( window.coredata['net.app.global'].hasOwnProperty(data[i].repost_of.id) === false ) {
                        window.coredata[ 'net.app.global' ][ data[i].repost_of.id ] = data[i].repost_of;
                    }
                }
                window.coredata[ 'net.app.global-ts' ] = Math.floor(Date.now() / 1000);
                parseAccountNames( data[i].user );
            }

        } else {
            var is_mention = false,
                followed = false;
            var account_rank = 0,
                show_time = readStorage('show_live_timestamps'),
                use_nice = readStorage('nicerank');
            var min_rank = (use_nice === 'N') ? 0 : parseInt( readStorage('min_rank', true) );
            var my_id = readStorage('user_id');

            for ( var i = 0; i < data.length; i++ ) {
                followed = data[i].user.you_follow || (data[i].user.id === my_id) || false;
                account_rank = parseInt( readStorage( data[i].user.id + '_rank', true) );
                if ( isNaN(account_rank) ) { account_rank = 0.1; }
                is_human = (use_nice === 'N') ? 'Y' : readStorage( data[i].user.id + '_human', true);
                if ( readStorage('feeds_hide') === 'N' && data[i].user.type === 'feed' ) {
                    account_rank = 2.1;
                    is_human = 'Y';
                }

                if ( data[i].is_deleted === true ) { setDelete( data[i].id ); }
                if ( (account_rank >= min_rank && is_human == 'Y') || (data[i].user.id === my_id) || followed ) {
                    var item_hash = JSON.stringify(data[i]).hashCode();
                    if ( window.coredata[ 'net.app.global' ].hasOwnProperty( data[i].id ) === false ) {
                        savePostToCore(data[i], item_hash);
                    } else {
                        if ( item_hash !== window.coredata['net.app.global'][data[i].id].hash ) {
                            savePostToCore(data[i], item_hash);
                        }
                    }
                }
            }
        }
        saveStorage('_refresher', -1, true)
        trimPosts();
    }
}
function savePostToCore( post, hash ) {
    var unshorten_links = readStorage('expand_links', false);
    if ( unshorten_links === 'Y' && post.entities.links.length > 0 ) {
        for ( var lnk = 0; lnk < post.entities.links.length; lnk++ ) { unshorten( post.entities.links[lnk].url ); }
    }
    post.hash = hash;
    window.coredata[ 'net.app.global' ][ post.id ] = post;
    if ( post.hasOwnProperty('repost_of') ) {
        if ( window.coredata['net.app.global'].hasOwnProperty(post.repost_of.id) === false ) {
            var rp_hash = JSON.stringify(post.repost_of).hashCode();
            post.repost_of.hash = rp_hash;
            window.coredata['net.app.global'][post.repost_of.id] = post.repost_of;
        }
    }
    window.coredata['net.app.global-ts'] = Math.floor(Date.now() / 1000);
    parseAccountNames(post.user);
}
function buildHTMLSection( post ) {
    var show_time = readStorage('show_live_timestamps');
    var avatarClass = 'avatar-round',
        account_age = 999,
        post_time = '';
    var is_repost = false,
        repost_by = '';
    var data = post;
    var _html = '';
    
    // Is this Machine-Only?
    if ( data.machine_only === true ) { return ''; }

    // Is This a Repost?
    if ( post.hasOwnProperty('repost_of') ) {
        data = post.repost_of;
        repost_by = ' <i style="float: right;">(<i class="fa fa-retweet"></i> ' + post.user.username + ')</i>';
        is_repost = true;
    }
    
    // Do We Have No Text Object?
    if ( data.text === undefined ) { return ''; }

    /* Get the First Character of the Post */
    var words = data.text.split(" ");
    switch ( words[0] ) {
        case '/me':
        case '/slap':
        case '/slaps':
            _html = '<div id="' + data.id + '-dtl" class="post-content" onClick="showHideActions(' + data.id + ', \'[TL]\');"' +
                        ' onMouseOver="doMouseOver(' + data.id + ', \'[TL]\');" onMouseOut="doMouseOut(' + data.id + ', \'[TL]\');"' +
                        ' style="width: 90%;">' +
                        parseText( data ) +
                    '</div>' +
                    buildRespondBar( data );
            break;

        default:
            post_time = getTimestamp( post.created_at );
            account_age = Math.floor(( new Date() - Date.parse(data.user.created_at) ) / 86400000);
            if ( account_age <= 7 ) { avatarClass = 'avatar-round recent-acct'; }
            if ( account_age <= 1 ) { avatarClass = 'avatar-round new-acct'; }
            if ( isMention( data ) ) { avatarClass = 'avatar-round mention'; }
            _html = '<div id="' + data.id + '-po" class="post-avatar' + ((is_repost) ? ' repost' : '') + '">' +
                        '<img class="' + avatarClass + '"' +
                            ' onClick="doShowUser(' + data.user.id + ');"' +
                            ' src="' + data.user.avatar_image.url + '">' +
                    '</div>' +
                    '<div id="' + data.id + '-dtl" class="post-content' + ((is_repost) ? ' repost' : '') + '"' +
                        ' onClick="showHideActions(' + data.id + ', \'[TL]\');"' +
                        ' onMouseOver="doMouseOver(' + data.id + ', \'[TL]\');" onMouseOut="doMouseOut(' + data.id + ', \'[TL]\');">' +
                        '<h5 class="post-name' + ((is_repost) ? ' repost' : '') + '"><span>' + data.user.username + repost_by + '</span></h5>' +
                        parseText( data ) +
                        '<p class="post-client"><em>' + data.source.name + '</em></p>' +
                        '<p class="post-time"><em id="' + post.id + '-time[TL]" name="' + post.id + '-time">' + post_time + '</em></p>' +
                    '</div>' +
                    buildRespondBar( post ) +
                    parseEmbedded( data );
    }

    return _html;
}
function isValidClient( post ) {
    var account_age = Math.floor(( new Date() - Date.parse(post.user.created_at) ) / 86400000);
    var post_client = post.source.name || 'unknown';
    var mute_client = ['IFTTT', 'Buffer', 'PourOver', 'im-fluss', post.user.username];
    var use_nice = readStorage('nicerank');
    if ( use_nice === 'N' ) { return true; }
    var rVal = true;

    if ( account_age <= 7 ) { if ( mute_client.indexOf(post_client) >= 0 ) { rVal = false; } }
    return rVal;
}
function buildNode( post_id, tl_ref, data, type, html ) {
    var elem = document.createElement("div");
    elem.setAttribute('id', post_id + tl_ref);
    elem.setAttribute('name', post_id);
    elem.setAttribute('class', type + '-item');
    elem.setAttribute('data-content', data);
    elem.innerHTML = html;

    return elem;
}
function parseText( post ) {
    if ( post === undefined || post === false ) { return '&nbsp;'; }
    var html = ( post.hasOwnProperty('html') ) ? post.html.replaceAll('<a href=', '<a target="_blank" href=', '') + ' ' : getLangString('post_gone'),
        name = '',
        cStr = ' class="post-mention" style="font-weight: bold; cursor: pointer;"';
    var highlight = readStorage('post-highlight_color');
    var replaceHtmlEntites = (function() {
        var translate_re = /&(#128406|#127996|[\u1F3FB-\u1F3FF]);/g,
            translate = {
                '#128406': '<i class="fa fa-hand-spock-o"></i>',
                '#127996': '',
                '\u1F3FB': '',
                '\u1F3FC': '',
                '\u1F3FD': '',
                '\u1F3FE': '',
                '\u1F3FF': ''
            },
            translator = function($0, $1) { return translate[$1]; };

        return function(s) { return s.replace(translate_re, translator); };
    })();
    var words = (post.text !== undefined) ? post.text.split(" ") : '';

    switch ( words[0] ) {
        case '/me':
            html = '<i class="fa fa-dot-circle-o"></i> ' +
                   html.replace(words[0], '<em onClick="doShowUser(' + post.user.id + ');">' + post.user.username + '</em>' );
            break;

        case '/slap':
        case '/slaps':
        case '/bitchslap':
        case '/bitchslaps':
            html = '<i class="fa fa-hand-paper-o"></i> <em onClick="doShowUser(' + post.user.id + ');">' + post.user.username + '</em> slaps ';
            var ptxt = post.text.ireplaceAll(words[0], ''),
                tool = 'a large trout';
            if ( post.entities.mentions.length > 0 ) {
                for ( var i = 0; i < post.entities.mentions.length; i++ ) {
                    if ( i > 0 && i < (post.entities.mentions.length - 1) ) { html += ', '; }
                    if ( i > 0 && i == (post.entities.mentions.length - 1) ) { html += ' and '; }
                    html += '<span class="post-mention" style="font-weight: bold; cursor: pointer;"' +
                                 ' onclick="doShowUser(' + post.entities.mentions[i].id + ');">@' + post.entities.mentions[i].name + '</span>';
                    ptxt = ptxt.ireplaceAll('@' + post.entities.mentions[i].name, '');
                }
            }
            if ( ptxt.trim() !== '' ) { tool = ptxt.trim(); }
            html += ' around a bit with ' + tool;
            break;

        default:
            /* Do Nothing */
    }

    /* Is This a Long Post? */
    if ( post.hasOwnProperty('annotations') ) {
        for ( var i = 0; i < post.annotations.length; i++ ) {
            switch ( post.annotations[i].value.type || post.annotations[i].type ) {
                case 'net.jazzychad.adnblog.post':
                    var hide_longpost = readStorage('hide_longpost')
                    if ( hide_longpost === 'N' || hide_longpost === false ) {
                        var post_body = post.annotations[i].value.body.ireplaceAll('\n\n', '<br><br>');
                            post_body = post_body.ireplaceAll('\r\r', '<br>');
                            post_body = post_body.ireplaceAll('\n', '<br>');
                            post_body = post_body.ireplaceAll('&#13;', '<br>');
                            post_body = post_body.replace(/\[([^\[]+)\]\(([^\)]+)\)/g, '<a target="_blank" href="$2">$1</a>');
                            post_body = post_body.replace(/(^|\s)@(\w+)/g, '<em onclick="doShowUserByName(\'$2\');">@$2</em>');
                            post_body = post_body.replace(/(^|\s)#(\w+)/g, '<em onclick="doShowHash(\'$2\');">#$2</em>');
                        html = ((post.annotations[i].value.title !== '') ? '<h6>' + post.annotations[i].value.title + '</h6>' : '') +
                               '<span>' + post_body + '</span>';
                    }
                    break;

                default:
                    /* Do Nothing */
            }
        }
    }

    /* Parse the HTML for Characters Like the Vulcan Salute */
    html = replaceHtmlEntites(html);

    /* Are there Mentions or Hashtags? */
    if ( post.entities.mentions.length > 0 ) {
        for ( var i = 0; i < post.entities.mentions.length; i++ ) {
            name = '>@' + post.entities.mentions[i].name + '<';
            html = html.ireplaceAll(name, cStr + ' onClick="doShowUser(' + post.entities.mentions[i].id + ');"' + name);
        }
    }
    if ( post.entities.hashtags.length > 0 ) {
        for ( var i = 0; i < post.entities.hashtags.length; i++ ) {
            name = '>#' + post.entities.hashtags[i].name + '<';
            var searchRegex = new RegExp('(>#' + post.entities.hashtags[i].name + '<)' , 'ig');
            html = html.replace(searchRegex, cStr + ' onClick="doShowHash(\'' + post.entities.hashtags[i].name + '\');"$1');
        }
    }
    
    /* Do Any of the HTML Links Need to be Changed? */
    if ( post.entities.links.length > 0 ) {
        for ( var i = 0; i < post.entities.links.length; i++ ) {
            var clean_url = readLink( post.entities.links[i].url );
            if ( clean_url !== undefined && plainURL(clean_url) !== plainURL(post.entities.links[i].url) ) {
                html = html.ireplaceAll('"' + post.entities.links[i].url + '"', '"' + clean_url + '"');
                html = html.ireplaceAll('>' + post.entities.links[i].text + '<', '>' + readLink(post.entities.links[i].text) + '<');
            }
        }
    }

    html = parseMarkdown( html );
    return html;
}
function plainURL( url ) {
    var rVal = url.toLowerCase();
        rVal = rVal.ireplaceAll('https:', '');
        rVal = rVal.ireplaceAll('http:', '');
    return rVal;
}
function fixReturns(text) {
    var rVal = text.ireplaceAll('\n\n', '<br><br>');
        rVal = rVal.ireplaceAll('\r\r', '<br>');
        rVal = rVal.ireplaceAll('\n', '<br>');
        rVal = rVal.ireplaceAll('&#13;', '<br>');
        rVal = rVal.ireplaceAll('<br><br><br><br>', '<br><br>');
    return rVal;
}
function parseMarkdown( html ) {
    var highlight = readStorage('post-highlight_color');
        html = fixReturns(html);
    var lines = html.split('<br>'),
        _line = '';
    var _html = '',
        _gaps = true;
    for ( i = 0; i < lines.length; i++ ) {
        _line = ' ' + lines[i] + ' ';

        /* Parse the Inline Markdown (Only Bold, Italics, Code) Line by Line */
        _line = _line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        _line = _line.replace(/\*(.*?)\*/g, '<i>$1</i>');
        _line = _line.replace(/`(.*?)`/g, '<code style="background-color:#' + highlight + ';padding:0 5px;">$1</code>');
        _line = _line.replace(/ _(.*?)_/g, ' <u>$1</u>');
        _line = _line.replace(/\/llap/g, '<i class="fa fa-hand-spock-o"></i>');

        if ( _html.trim() !== '' || _gaps === false ) { _html += '<br>'; }
        if ( _line.trim() !== '' ) {
            _html += _line.trim();
            _gaps = false;
        } else {
            _gaps = true;
        }
    }
    return _html;
}
function showHideTL( tl ) {
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) {
            if ( tl === i ) { window.timelines[i] = !window.timelines[i]; }
            if ( window.timelines[i] ) { saveStorage('tl_' + i, 'Y'); } else { saveStorage('tl_' + i, 'N'); }
            showTimelines();
        }
    }
}
function showTimelines() {
    var buffer = '<div id="0[TL]" class="post-item" style="border: 0; min-height: 75px;" data-content="2000-01-01T00:00:00Z"></div>';
    var redraw = false;
    if ( checkElementExists('userlist') ) {
        var elem = document.getElementById('userlist');
        elem.parentNode.removeChild(elem);
        redraw = true;
    }
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) {
            if ( window.timelines[i] ) {
                if ( checkElementExists( i ) === false ) {
                    /* Should We Append the Column, Or Insert It At A Set Location? */
                    var next_tl = '';
                    var do_next = false;
                    for ( itl in window.tl_order ) {
                        if ( do_next && checkElementExists( window.tl_order[itl] ) ) {
                            next_tl = window.tl_order[itl];
                            do_next = false;
                            break;
                        }
                        if ( i === window.tl_order[itl] ) { do_next = true; }
                    }

                    if ( next_tl === '' ) {
                        $('#tl-space').append( '<div id="' + i + '" class="post-list tl-' + i + '" style="overflow-x: hidden;">' +
                                                   buffer.replaceAll('[TL]', '-' + i.charAt(0), '') +
                                               '</div>' );
                    } else {
                        var elem = document.createElement("div");
                        elem.setAttribute('id', i);
                        elem.setAttribute('class', 'post-list tl-' + i);
                        elem.setAttribute('style', 'overflow-x: hidden;');
                        elem.innerHTML = buffer.replaceAll('[TL]', '-' + i.charAt(0), '');

                        document.getElementById('tl-space').insertBefore( elem, document.getElementById(next_tl) );
                    }
                    redraw = true;
                }
            } else {
                if ( checkElementExists( i ) ) {
                    var elem = document.getElementById( i );
                    elem.parentNode.removeChild(elem);
                }
            }
        }
    }
    if ( redraw === true ) {
        saveStorage('net.app.interactions-ts', '1000', true);
        saveStorage('net.app.core.pm-ts', '1000', true);
        saveStorage('net.app.global-ts', '1000', true);
        saveStorage('_refresher', '100', true);
    }
    setWindowConstraints();
}
function showMutedPost( post_id, tl ) {
    var postText = getPostText(post_id, true);
    if ( postText !== '' ) {
        var _html = '<div id="' + post_id + tl + '" name="' + post_id + '" class="post-item">' +
                        postText.replaceAll('[TL]', tl, '') +
                    '</div>';
        $('#' + post_id + tl ).replaceWith( _html );
    }
}
function redrawList() {
    var counter = parseInt( readStorage('_refresher', true) );
    if ( counter > 0 && counter <= 5 ) {
        saveStorage( '_refresher', (counter + 1), true);
        return false;
    } else { 
        saveStorage( '_refresher', '1', true);
    }

    var global_showall = ( readStorage('global_show') === 'e' ) ? true : false;
    if ( readStorage('global_hide') === 'Y' ) { global_showall = false; }
    if ( window.activate === false ) {
        var _home = readStorage('home_done', true),
            _ment = readStorage('ment_done', true);

        if ( _home === 'Y' && _ment === 'Y' ) { setSplashMessage(''); }
        window.activate = true;
    }

    /* Draw the SoundCloud Items (If Required) */
    if ( window.coredata.hasOwnProperty('com.soundcloud') ) {
        var els = getElementsByName('soundcloud');
        for ( _url in window.coredata['com.soundcloud'] ) {
            for ( i in els ) {
                if ( els[i].innerHTML === '[' + _url + ']' ) { els[i].innerHTML = window.coredata['com.soundcloud'][_url].html; }
            }
        }
    }

    /* Draw the Various Timelines (If Required) */
    redrawInteractions();
    redrawPosts();
    redrawPMs();

    setWindowConstraints();
    updateTimestamps();
}
function redrawInteractions() {
    if ( window.timelines.interact === true ) {
        if ( window.coredata.hasOwnProperty('net.app.interactions') ) {
            var last_ts = readStorage('net.app.interactions-ts', true);
            if ( last_ts !== window.coredata[ 'net.app.interactions-ts' ] ) {
                for ( _id in window.coredata['net.app.interactions'] ) {
                    if ( checkElementExists( _id + '-i') === false ) {
                        var event_at = window.coredata['net.app.interactions'][ _id ].event_date;
                        var last_id = getPreviousElementByTime( event_at, 'interact', '-i' );
                        var html = buildInteractionItem( _id );
                        document.getElementById('interact').insertBefore( buildNode( _id, '-i', event_at, 'pulse', html),
                                                                          document.getElementById(last_id) );
                    }
                }
                saveStorage( 'net.app.interactions-ts', window.coredata[ 'net.app.interactions-ts' ], true );
            }
        }
    }
}
function redrawPMs() {
    if ( window.timelines.pms === true ) {
        var cnt = 0;
        if ( window.coredata.hasOwnProperty('net.app.core.pm') ) {
            var last_ts = readStorage('net.app.core.pm-ts', true);
            var pm_list = sortPMList();

            if ( last_ts !== window.coredata['net.app.core.pm-ts'] ) {
                for ( var idx = 0; idx < pm_list.length; idx++ ) {
                    var post_id = '';
                    for ( _id in window.coredata['net.app.core.pm'] ) {
                        if ( window.coredata['net.app.core.pm'][ _id ].recent_message.created_at === pm_list[idx] ) {
                            post_id = _id;
                            break;
                        }
                    }

                    if ( post_id !== '' ) {
                        if ( checkElementExists(post_id + '-pms') ) {
                            /* Check to see if the PM Object's Timestamp Is The Same */
                            var objTime = $('#' + post_id + '-pms').data("content");
                            if ( window.coredata['net.app.core.pm'][ post_id ].recent_message.created_at != objTime ) {
                                var elem = document.getElementById( post_id + '-pms' );
                                elem.parentNode.removeChild(elem);

                                var html = buildPMItem('net.app.core.pm', post_id);
                                var last_id = getPreviousElementByTime(pm_list[idx], 'pms', '-pms' );
                                if ( last_id !== false ) {
                                    document.getElementById('pms').insertBefore( buildNode(post_id, '-pms', pm_list[idx], 'post', html),
                                                                                 document.getElementById(last_id) );
                                }
                            }

                        } else {
                            /* Draw the PM Object */
                            var html = buildPMItem('net.app.core.pm', post_id);
                            var last_id = getPreviousElementByTime(pm_list[idx], 'pms', '-pms' );
                            if ( last_id !== false ) {
                                document.getElementById('pms').insertBefore( buildNode(post_id, '-pms', pm_list[idx], 'post', html),
                                                                             document.getElementById(last_id) );
                            }
                        }
                        cnt++;
                    }
                }
                saveStorage('net.app.core.pm-ts', window.coredata['net.app.core.pm-ts'], true);
            }
        }
    }
}
function redrawPosts() {
    var postText = '';
    var last_id = '';
    var action_at = '0';
    var last_ts = readStorage('net.app.global-ts', true);
    var global_showall = ( readStorage('global_show') === 'e' ) ? true : false;
    if ( readStorage('global_hide') === 'Y' ) { global_showall = false; }

    if ( last_ts != window.coredata[ 'net.app.global-ts' ] ) {
        var my_id = readStorage('user_id');
        var is_mention = false,
            is_follow = false,
            you_muted = false;

        for ( post_id in window.coredata['net.app.global'] ) {
            if ( window.coredata['net.app.global'][post_id] !== false ) {
                action_at = window.coredata['net.app.global'][post_id].created_at;
                is_mention = isMention( window.coredata['net.app.global'][post_id] );
                is_follow = (window.coredata['net.app.global'][post_id].user.you_follow
                            || (window.coredata['net.app.global'][post_id].user.id === my_id)
                            || false);
                you_muted = (window.coredata['net.app.global'][post_id].user.id === my_id) ? false : window.coredata['net.app.global'][post_id].user.you_muted;
                postText = '';

                if ( window.timelines.home ) {
                    if ( checkElementExists(post_id + '-h') === false ) {
                        if ( is_mention || (is_follow && you_muted === false) ) {
                            last_id = getPreviousElement(post_id, 'home', '-h');
                            if ( last_id !== false ) {
                                if ( postText === '' ) { postText = getPostText(post_id); }
                                if ( postText !== '' ) {
                                    document.getElementById('home').insertBefore( buildNode(post_id, '-h',
                                                                                            action_at, 'post', 
                                                                                            postText.replaceAll('[TL]', '-h', '')),
                                                                                  document.getElementById(last_id) );

                                }
                            }
                        }
                    }
                }

                if ( window.timelines.mentions ) {
                    if ( checkElementExists(post_id + '-m') === false ) {
                        if ( is_mention ) {
                            last_id = getPreviousElementByTime( action_at, 'mentions', '-m' );
                            if ( last_id !== false ) {
                                if ( postText === '' ) { postText = getPostText(post_id); }
                                if ( postText !== '' ) {
                                    document.getElementById('mentions').insertBefore( buildNode( post_id, '-m',
                                                                                                 action_at, 'post',
                                                                                                 postText.replaceAll('[TL]', '-m', '')),
                                                                                      document.getElementById(last_id) );
                                }
                            }
                        }
                    }

                    var im_blend = readStorage('blended_mentions');
                    if ( im_blend === 'Y' ) {
                        if ( window.coredata.hasOwnProperty('net.app.interactions') ) {
                            for ( _id in window.coredata['net.app.interactions'] ) {
                                if ( checkElementExists( _id + '-m') === false ) {
                                    var event_at = window.coredata['net.app.interactions'][ _id ].event_date;
                                    var last_id = getPreviousElementByTime( event_at, 'mentions', '-m' );
                                    var html = buildInteractionItem( _id );
                                    document.getElementById('mentions').insertBefore( buildNode( _id, '-m', event_at, 'pulse', html),
                                                                                      document.getElementById(last_id) );
                                }
                            }
                        }
                    }
                    saveStorage('net.app.global-ts', window.coredata['net.app.global-ts'], true);
                }

                if ( window.timelines.global ) {
                    if ( checkElementExists(post_id + '-g') === false ) {
                        if ( (global_showall || is_follow === false) && you_muted === false ) {
                            last_id = getPreviousElement(post_id, 'global', '-g');
                            if ( last_id !== false ) {
                                if ( postText === '' ) { postText = getPostText(post_id); }
                                if ( postText !== '' ) {
                                    document.getElementById('global').insertBefore( buildNode(post_id, '-g',
                                                                                              action_at, 'post',
                                                                                              postText.replaceAll('[TL]', '-g', '')),
                                                                                    document.getElementById(last_id) );
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
function getPostText( post_id, override ) {
    if ( override === undefined ) { override = false; }
    var muted = isMutedItem(post_id);
    var _html = '';

    if ( muted === false || override ) {
        _html = buildHTMLSection( window.coredata['net.app.global'][post_id] );
    } else {
        if ( muted !== true ) {
            _html = '<span onClick="showMutedPost(' + post_id + ', \'[TL]\');" class="post-muted">' +
                        '@' + window.coredata['net.app.global'][post_id].user.username + ' - ' + muted +
                    '</span>';
        }
    }
    return _html;
}
function getPreviousElement( post_id, timeline, tl_ref ) {
    var elems = document.getElementById(timeline);
    var c_max = parseInt(readStorage('column_max'));
    for ( var idx = 0; idx < elems.children.length; idx++ ) {
        if ( idx >= (c_max - 5) ) { return false; }
        if ( parseInt(elems.children[idx].id.replaceAll(tl_ref, '', '')) < parseInt(post_id) ) { return elems.children[idx].id; }
    }
    return '0' + tl_ref;
}
function getPreviousElementByTime( time_str, timeline, tl_ref ) {
    var elems = document.getElementById(timeline);
    if ( elems === null || elems === undefined ) { return '0' + tl_ref; }
    var c_max = parseInt(readStorage('column_max'));
    var comTime = new Date( time_str );
    for ( var idx = 0; idx < elems.children.length; idx++ ) {
        if ( idx >= (c_max - 5) ) { return '0' + tl_ref; }
        var objTime = new Date( $('#' + elems.children[idx].id).data("content") );        
        if ( objTime < comTime ) { return elems.children[idx].id; }
    }
    return '0' + tl_ref;
}
function checkElementExists( div_id ) {
    var element =  document.getElementById( div_id );
    if (typeof(element) !== 'undefined' && element !== null) { return true; } else { return false; }
}
function setWindowConstraints() {
    var sHeight = window.innerHeight || document.body.clientHeight;
    var sWidth = window.innerWidth || document.body.clientWidth;
    var cWidth = 0,
        vCols = 1;
        
    if ( document.getElementById('tl-space').innerHTML === '' ) { return false; }

    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) { if ( window.timelines[i] ) { vCols++; } }
    }
    if ( checkElementExists('userlist') ) { vCols = 1; }

    while ( cWidth < 280 ) {
        vCols--;
        if ( vCols > 6 ) { vCols = 6; }
        if ( vCols <= 0 ) { vCols = 1; }
        if ( sWidth <= 1024 && vCols > 3 ) { vCols = 3; }
        if ( sWidth <=  768 && vCols >= 2 ) { vCols = 2; }
        if ( sWidth <=  500 && vCols >= 1 ) { vCols = 1; }
        cWidth = ( vCols > 1 ) ? Math.floor(sWidth / vCols): sWidth;
    }

    var sb_adjust = readStorage('scrollbar_adjust');
    if ( isNaN(sb_adjust) || sb_adjust === false ) { sb_adjust = 0; } else { sb_adjust = parseInt(sb_adjust); }

    sBar = scrollbarWidth( cWidth );
    if ( sBar > 0 && sBar <= 40 ) {
        sBar = Math.floor(sBar / vCols) + 1;
        cWidth = cWidth - sBar;
    }
    if ( sBar === 0 ) { cWidth = cWidth - vCols - sb_adjust; }
    setColumnsWidth( cWidth, vCols );

    var tl = document.getElementById('tl-content');
    if ( tl.getAttribute('style') !== 'min-height:' + sHeight + 'px' ) { tl.setAttribute('style','min-height:' + sHeight + 'px'); }
}
function scrollbarWidth( cWidth ) {
    var outer_css = 'width:' + cWidth + 'px; height:150px; position: absolute; top: 0; left: 0; visibility: hidden; overflow: hidden;';
    var $inner = jQuery('<div style="width: 100%; height:200px;">test</div>'),
        $outer = jQuery('<div style="' + outer_css + '"></div>').append($inner),
        inner = $inner[0],
        outer = $outer[0];

    /* Get the Best Guess from the Browser */
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) {
            if ( window.timelines[i] ) {
                jQuery('#'+i).append(outer);
                var width1 = inner.offsetWidth;
                $outer.css('overflow', 'scroll');
                var width2 = outer.clientWidth;
                $outer.remove();

                return (width1 - width2);
            }
        }
    }
    return 0;
}
function setColumnsWidth( cWidth, cCount ) {
    var css_style = 'overflow-x: hidden; width:' + cWidth + 'px;';
    var named_columns = readStorage('named_columns');
    var nav = document.getElementById('tl-names'),
        nav_html = '';
    var vCols = 0,
        idx = 1;
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) { if ( window.timelines[i] ) { vCols++; } }
    }
    css_style += (cCount === 1) ? ' max-width: 480px;' : ' max-width: ' + parseFloat(100 / cCount).toFixed(3) + '%;';
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) {
            if ( window.timelines[i] ) {
                nav_html += '<nav style="' + css_style + '">' + getLangString(i) + '</nav>';
                if ( idx === vCols ) { css_style = 'border-right: 0; ' + css_style; }
                if ( document.getElementById( i ).getAttribute('style') !== css_style ) {
                    document.getElementById( i ).setAttribute('style', css_style);
                }
                idx++;
            }
        }
    }
    if ( nav.innerHTML !== nav_html && named_columns === 'Y' ) { nav.innerHTML = nav_html; }
    if ( checkElementExists('userlist') ) {
        if ( document.getElementById('userlist').getAttribute('style') !== css_style ) {
            document.getElementById('userlist').setAttribute('style', css_style);
        }
    }
}
function toProperCase( str ) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
function constructDialog( dialog_id ) {
    var _html = '';
    switch ( dialog_id ) {
        case 'autocomp':
            _html = '';
            break;
        
        case 'channel':
            dialog_id = 'conversation';
            _html = '<div class="chatbox">' +
                        '<div class="title" onclick="doShowConv();">' +
                            getLangString('conv_view') + ' <em id="chat_count">&nbsp;</em>' +
                            '<span><i class="fa fa-times-circle-o"></i></span>' +
                        '</div>' +
                        '<div class="title_btn"><button onclick="doConvReply();">' + getLangString('reply') + '</button></div>' +
                        '<div id="chat_posts" class="chat"></div>' +
                    '</div>';
            break;

        case 'conversation':
            _html = '<div class="chatbox">' +
                        '<div class="title" onclick="doShowConv();">' +
                            getLangString('conv_view') + ' <em id="chat_count">&nbsp;</em>' +
                            '<span><i class="fa fa-times-circle-o"></i></span>' +
                        '</div>' +
                        '<div class="title_bg">&nbsp;</div>' +
                        '<div id="chat_posts" class="chat"></div>' +
                    '</div>';
            break;

        case 'dialog':
            _html = '<div id="usr-profile" class="profile">' +
                        '<div class="close" onclick="showHideDialog();"></div>' +
                        '<div id="usr-banner" class="banner"></div>' +
                        '<div class="sight">' +
                            '<div id="usr-avatar" class="avatar"></div>' +
                            '<div id="usr-names" class="names"></div>' +
                        '</div>' +
                        '<div id="usr-info" class="info">&nbsp;</div>' +
                        '<div id="usr-actions" class="actions">&nbsp;</div>' +
                        '<div id="usr-numbers" class="numbers">&nbsp;</div>' +
                        '<div id="user_posts"></div>' +
                    '</div>';
            break;

        case 'draftbox':
            _html = '<div class="msgbox">' +
                        '<div class="title">' + getLangString('draft_title') + '</div>' +
                        '<div id="msg" class="message">' + getLangString('draft_qyest') + '</div>' +
                        '<div class="buttons">' +
                            '<button onclick="showSaveDraft();" class="btn-red">' + getLangString('draft_no') + '</button>' +
                            '<button onclick="saveDraft();" class="btn-green">' + getLangString('draft_yes') + '</button>' +
                        '</div>' +
                    '</div>';
            break;

        case 'hashbox':
            _html = '<div class="chatbox">' +
                        '<div class="title" onclick="doShowHash();">' +
                            getLangString('hash_view') + ' <em id="hash_count">&nbsp;</em>' +
                            '<span><i class="fa fa-times-circle-o"></i></span>' +
                        '</div>' +
                        '<div id="mute_hash" class="title_btn">' +
                            '<button onclick="doMuteHash(\'hashtag\');">' + getLangString('hash_mute') + '</button>' +
                        '</div>' +
                        '<div id="hash_posts" class="chat"></div>' +
                    '</div>';
            break;

        case 'okbox':
            _html = '<div class="msgbox">' +
                        '<div class="title">' + readStorage('msgTitle', true) + '</div>' +
                        '<div id="msg" class="message">' + readStorage('msgText', true) + '</div>' +
                        '<div class="buttons">' +
                            '<button onclick="dismissOKbox();" class="btn-green">' + getLangString('ok') + '</button>' +
                        '</div>' +
                    '</div>';
            break;

        case 'prefs':
            _html = '<div class="chatbox">' +
                        '<div class="title" onclick="doShowPrefs();">' +
                            getLangString('setting_title') + ' <em id="hash_count">&nbsp;</em>' +
                            '<span><i class="fa fa-times-circle-o"></i></span>' +
                        '</div>' +
                        '<div id="pref-list" class="chat"></div>' +
                    '</div>';
            break;

        case 'response':
            _html = '<div class="reply">' +
                        '<textarea id="rpy-text" class="mention"></textarea>' +
                        '<div class="actions">' +
                            '<span id="rpy-length">256</span>' +
                            '<span id="rpy-draft" style="display: inline-block; font-size: 160%; margin: 4px 0 0 25px;" onclick="loadDraft();"></span>' +
                            '<button id="rpy-kill" class="btn-red">' + getLangString('cancel') + '</button>' +
                            '<button id="rpy-send" class="btn-grey">' + getLangString('send') + '</button>' +
                        '</div>' +
                    '</div>';
            break;

        default:
            /* Do Nothing */
    }
    document.getElementById(dialog_id).innerHTML = _html;
    return true;
}
function dismissOKbox() {
    document.getElementById('okbox').innerHTML = '';
    toggleClass('okbox','show','hide');        
}
function doShowChan( chan_id ) {
    if ( chan_id === '' || chan_id === undefined ) {
        toggleClass('channel','show','hide');        
    } else {
        toggleClassIfExists('channel','hide','show');
        if ( constructDialog('channel') ) {
            showWaitState('chat_posts', 'Collecting Private Conversation');
            getChannelMessages(chan_id);
        }
    }
}
function parseAccountNames( data ) {
    if ( data ) {
        for ( var i = 0; i < ((data.length === undefined) ? 1 : data.length); i++ ) {
            var ds = (data.length === undefined) ? data : data[i];
            window.users[ ds.id ] = { avatar_url: ds.avatar_image.url,
                                      name: ds.name,
                                      username: ds.username,
                                      score: (( ds.follows_you ) ? 2 : 0) + (( ds.is_follower ) ? 2 : 0) + 1
                                     }
        }
    }
}
function listNames( startWith ) {
    var filter = startWith.replaceAll('@', '');
    var my_id = readStorage('user_id');
    var users = {};
    var _html = '';

    for ( id in window.users ) {
        if ( id !== my_id ) {
            if ( window.users[id].username.indexOf(filter) === 0 ) { users[ window.users[id].username ] = window.users[id].score + 5; }
            if ( window.users[id].username.indexOf(filter) > 0 ) { users[ window.users[id].username ] = window.users[id].score; }
        }
    }

    var cnt = 0;
    var _onClick = '';
    for ( var i = 10; i >= 0; i-- ) {
        for ( name in users ) {
            if ( users[name] === i ) {
                _onClick = 'onClick="doCompleteName(\'' + startWith + '\', \'' + name + '\');"';
                _html += '<span ' + _onClick + '>@' + name + '</span>';
                users[name] = -1;
                cnt++;
            }
            if ( cnt >= 3 ) { i = -1; }
        }
    }

    if ( _html != '' ) {
        document.getElementById('autocomp').innerHTML = '<div class="autobox">' + _html + '</div>';
        toggleClassIfExists('autocomp','hide','show');
    } else {
        toggleClassIfExists('autocomp','show','hide');
    }
}
function doCompleteName( fragment, name ) {
    var el = document.getElementById('rpy-text');
    var caret_pos = getCaretPos(el);
    var orig_text = el.value;
    var new_text = orig_text.replaceAll(fragment, '@' + name + ' ', '');

    if ( orig_text !== new_text ) {
        el.value = new_text;
        caret_pos = caret_pos - fragment.length + name.length + 2;
        setCaretToPos(document.getElementById('rpy-text'), caret_pos);
    }
    toggleClassIfExists('autocomp','show','hide');
    calcReplyCharacters();
}
function buildRespondBar( post, is_convo ) {
    var my_id = readStorage('user_id');
    var css_r = ( post.you_reposted ) ? 'highlight' : 'plain';
    var css_s = ( post.you_starred ) ? 'highlight' : 'plain';
    var icn_s = ( post.you_starred ) ? 'fa-star' : 'fa-star-o';
    if ( is_convo !== true ) { is_convo = false; }
    
    var post_id = post.id;
    if ( post.hasOwnProperty('repost_of') ) { post_id = post.repost_of.id; }

    var html =  '<div id="' + post_id + '-rsp[TL]" class="post-actions hide">' +
                    '<span onclick="doReply(' + post.id + ');"><i class="fa fa-reply-all"></i></span>';
    if ( post.user.id !== my_id ) {
        html += '<span id="' + post.id + '-repost[TL]" name="' + post.id + '-repost" onclick="doRepost(' + post.id + ');" class="' + css_r + '">' +
                    '<i class="fa fa-retweet"></i>' +
                '</span>';
    } else {
        html += '<span onclick="doDelete(' + post.id + ');"><i class="fa fa-trash"></i></span>';
    }
    if ( is_convo === false ) { html += '<span onclick="doShowConv(' + post_id + ');"><i class="fa fa-comments-o"></i></span>'; }
    html += '<span id="' + post_id + '-star[TL]" name="' + post_id + '-star" onclick="doStar(' + post_id + ');" class="' + css_s + '">' +
                '<i class="fa ' + icn_s + '"></i>' +
            '</span>';
    if ( is_convo ) {
        var post_source = post.source.name || 'unknown';
        var pdid = makeID(6);
        html += '<span onclick="toggleRBarDrop(\'' + pdid + '\');">' +
                    '<i class="fa fa-bars"></i>' +
                    '<ul id="' + pdid + '" class="rbdrop hide">' +
                        '<li onclick="doQuote(' + post_id + ');">Quote <i class="fa fa-quote-right"></i></li>' +
                        '<li onclick="doOpenPost(\'' + post.user.username + '\', ' + post_id + ');">Open in Alpha <i class="fa fa-object-ungroup"></i></li>' +
                        '<li onclick="doShowConv(' + post_id + ');">Show Previous <i class="fa fa-comments-o"></i></li>' +
                        '<li onclick="muteClient(\'' + post_source + '\');"">Mute Client <i class="fa fa-microphone-slash"></i></li>' +
                    '</ul>' +
                '</span>';
    }
    html += '</div>';
    return html;
}
function toggleRBarDrop( id ) {
    toggleClassIfExists( id , 'hide', 'show', true);
}
function doOpenPost( account_name, post_id ) {
    var w = window.open('https://alpha.app.net/' + account_name + '/post/' + post_id, '_blank');
    w.focus();
}
function isMention( post ) {
    var my_id = readStorage('user_id');
    var rVal = false;
    if ( post.entities.mentions.length > 0 ) {
        for ( var i = 0; i < post.entities.mentions.length; i++ ) {
            if ( post.entities.mentions[i].id === my_id && post.user.id !== my_id ) { rVal = true; }
        }
    }
    return rVal;
}
function getAccountNames( ids ) {
    var access_token = readStorage('access_token');

    if ( access_token !== false ) {
        var id_list = '';
        for ( var i = 0; i < ids.length; i++ ) {
            if ( id_list !== '' ) { id_list += ','; }
            id_list += ids[i];
        }

        var params = {
            access_token: access_token,
            ids: id_list 
        };
        doJSONQuery( '/users', false, 'GET', params, parseAccountNames, '' );
    }
}

function updateTimestamps() {
    if ( readStorage('absolute_times') === 'Y' ) { return false; }
    var im_blend = readStorage('blended_mentions');
    if ( readStorage('show_live_timestamps') === 'Y' ) {
        if ( window.timelines.home || window.timelines.mentions || window.timelines.global ) {
            for ( post_id in window.coredata['net.app.global'] ) {
                    var itms = document.getElementsByName( post_id + "-time" );
                    var tStr = humanized_time_span( window.coredata['net.app.global'][post_id].created_at ),
                        html = '';
        
                    for ( var i = 0; i < itms.length; i++ ) {
                        html = document.getElementById( itms[i].id ).innerHTML;
                        if ( html != tStr ) { document.getElementById( itms[i].id ).innerHTML = tStr; } else { break; }
                    }
            }
        }
        if ( window.timelines.pms ) {
            for ( post_id in window.coredata['net.app.core.pm'] ) {
                    var itms = document.getElementsByName( post_id + "-time" );
                    var tStr = humanized_time_span( window.coredata['net.app.core.pm'][post_id].recent_message.created_at ),
                        html = '';
    
                    for ( var i = 0; i < itms.length; i++ ) {
                        html = document.getElementById( itms[i].id ).innerHTML;
                        if ( html != tStr ) { document.getElementById( itms[i].id ).innerHTML = tStr; } else { break; }
                    }            
            }
        }
        if ( window.timelines.interact || im_blend === 'Y' ) {
            if ( window.coredata.hasOwnProperty('net.app.interactions') ) {
                for ( _id in window.coredata['net.app.interactions'] ) {
                    var itms = document.getElementsByName( _id + "-time" );
                    var tStr = humanized_time_span( window.coredata['net.app.interactions'][ _id ].event_date ).toLowerCase(),
                        html = '';

                    for ( var i = 0; i < itms.length; i++ ) {
                        html = document.getElementById( itms[i].id ).innerHTML;
                        if ( html != tStr ) { document.getElementById( itms[i].id ).innerHTML = tStr; } else { break; }
                    }
                }
            }
        }
    }
}
function collectRankSummary() {
    if ( readStorage('nice_proxy') === 'Y' ) {
        fillTLs();
        return false;
    }
    setSplashMessage('Collecting NiceRank Scores');
    var params = { nicerank: 0.1 };
    doJSONQuery( '/user/nicesummary', true, 'GET', params, parseRankSummary, parseRankSummary );
}
function parseRankSummary( data ) {
    if ( data ) {
        for ( var i = 0; i < data.length; i++ ) {
            setSplashMessage('Reading Scores (' + (i + 1) + '/' + data.length + ')');
            saveStorage( data[i].user_id + '_rank', data[i].rank, true );
            saveStorage( data[i].user_id + '_human', data[i].is_human, true );
        }
        fillTLs();
    }
}
function fillTLs() {
    getMentions();
    getTimeline();
    getInteractions();
    setSplashMessage('');
}
function doDelete( post_id ) {
    var access_token = readStorage('access_token');
    if ( access_token !== false ) {
        var params = { access_token: access_token };
        doJSONQuery( '/posts/' + post_id, false, 'DELETE', params, setDelete, '' );
    }
}
function setDelete( data ) {
    var post_id = data.id;
    var itms = document.getElementsByName( post_id );
    for ( var i = 0; i < itms.length; i++ ) {
        var elem = document.getElementById( itms[i].id );
        elem.parentNode.removeChild(elem);
    }
    window.coredata['net.app.global'][post_id] = false;
}
function doRepost( post_id ) {
    var access_token = readStorage('access_token');
    var action_type = ( window.coredata['net.app.global'][post_id].you_reposted ) ? 'DELETE' : 'POST';

    if ( access_token !== false ) {
        var params = { access_token: access_token };
        doJSONQuery( '/posts/' + post_id + '/repost', false, action_type, params, setRepost, '' );
    } else {
        getAuthorisation();
    }
}
function setRepost( data ) {
    var post_id = (data.repost_of === undefined) ? data.id : data.repost_of.id;
    if ( post_id > 0 ) {
        var itms = document.getElementsByName( post_id + "-repost" );
        window.coredata['net.app.global'][post_id].you_reposted = !window.coredata['net.app.global'][post_id].you_reposted;

        for ( var i = 0; i < itms.length; i++ ) {
            if ( window.coredata['net.app.global'][post_id].you_reposted ) {
                toggleClassIfExists(itms[i].id,'plain','highlight');
            } else {
                toggleClassIfExists(itms[i].id,'highlight','plain');
            }
        }
    }
}
function doStar( post_id ) {
    var access_token = readStorage('access_token');
    var action_type = ( window.coredata['net.app.global'][post_id].you_starred ) ? 'DELETE' : 'POST';

    if ( access_token !== false ) {
        var params = { access_token: access_token };
        doJSONQuery( '/posts/' + post_id + '/star', false, action_type, params, setStar, '' );
    } else {
        getAuthorisation();
    }
}
function setStar( data ) {
    var post_id = data.id;
    if ( post_id > 0 ) {
        var itms = document.getElementsByName( post_id + "-star" );
        window.coredata['net.app.global'][post_id].you_starred = !window.coredata['net.app.global'][post_id].you_starred;

        for ( var i = 0; i < itms.length; i++ ) {
            if ( window.coredata['net.app.global'][post_id].you_starred ) {
                if( $('#' + itms[i].id).hasClass('plain') ) {
                    toggleClass(itms[i].id,'plain','highlight');
                    document.getElementById( itms[i].id ).innerHTML = '<i class="fa fa-star"></i>';
                }
            } else {
                if( $('#' + itms[i].id).hasClass('highlight') ) {
                    toggleClass(itms[i].id,'highlight','plain');
                    document.getElementById( itms[i].id ).innerHTML = '<i class="fa fa-star-o"></i>';
                }
            }
        }
    }
}
function doFollow( user_id, unfollow ) {
    var access_token = readStorage('access_token');
    var action_type = ( unfollow === true ) ? 'DELETE' : 'POST';
    if ( parseInt(user_id) <= 0 ) { return false; }

    if ( access_token !== false ) {
        var params = { access_token: access_token };
        doJSONQuery( '/users/' + user_id + '/follow', false, action_type, params, setFollow, '' );
    } else {
        getAuthorisation();
    }
}
function setFollow( data ) {
    if ( data ) {
        var my_id = readStorage('user_id');
        var html = '';

        var elementExists = document.getElementById('btn-follow-' + data.id);
        if ( elementExists ) {
            document.getElementById('btn-follow-' + data.id).innerHTML = ((data.you_follow === true) ? 'Unfollow' : 'Follow');
            document.getElementById('btn-follow-' + data.id).onclick = function() { doFollow(data.id, data.you_follow); }
            toggleClassIfExists('btn-follow-' + data.id, 'btn-green', 'btn-red', true);
        } else {
            if ( data.follows_you ) { html += '<em>Follows You</em>'; }
            if ( data.you_follow ) {
                html += '<button onclick="doFollow(' + data.id + ', true)" class="btn-red">' + getLangString('unfollow') + '</button>';
            } else {
                if ( data.id !== my_id ) {
                    html += '<button onclick="doFollow(' + data.id + ', false)" class="btn-green">' + getLangString('follow') + '</button>';
                } else {
                    html += '<span>' + getLangString('is_you') + '</span>';
                }
            }
            document.getElementById( 'usr-actions' ).innerHTML = html;
        }
    }
}
function doShowConv( post_id ) {
    if ( post_id === '' || post_id === undefined ) {  
        toggleClass('conversation','show','hide');
    } else {
        toggleClassIfExists('conversation','hide','show');
        if ( constructDialog('conversation') ) {
            showWaitState('chat_posts', 'Collecting Conversation');
            getConversation(post_id);
        }
    }
}
function getConversation( post_id ) {
    if ( parseInt(post_id) <= 0 ) { return false; }
    var access_token = readStorage('access_token');

    if ( access_token !== false ) {
        showWaitState('chat_posts', 'Accessing App.Net');
        saveStorage('this_post_id', post_id, true);
        var params = {
            access_token: access_token,
            include_annotations: 1,
            include_deleted: 0,
            include_muted: 1,
            include_html: 1,
            count: 200
        };
        doJSONQuery( '/posts/' + post_id + '/replies', false, 'GET', params, parseConversation, '' );
    } else {
        getAuthorisation();
    }
}
function parseConversation( data ) {
    post_id = readStorage('this_post_id', true);
    if ( data ) {
        var respond = '',
            sname = '',
            _html = '';
        var is_mention = false,
            followed = false;
        var reply_to = 0,
            this_id = 0;
        var post_mentions = [],
            post_reposted = false,
            post_starred = false,
            post_source = '',
            post_client = '',
            post_time = '',
            post_by = '';
        var my_id = readStorage('user_id');
        var show_ids = [post_id];
        var post_min = 0,
            post_max = 0,
            post_cnt = 0;

        document.getElementById( 'chat_count' ).innerHTML = '(' + data.length + ' Posts)';
        for ( var i = 0; i < data.length; i++ ) {
            showWaitState('chat_posts', 'Reading Posts (' + (i + 1) + '/' + data.length + ')');
            respond = buildRespondBar( data[i], true );
            respond = respond.replaceAll('doShowConv(' + data[i].id, 'doGreyConv(' + data[i].id + ', ' + (data[i].reply_to || 0), '');
            this_id = parseInt(data[i].id);
            sname = '';
            if ( this_id === post_id ) {
                reply_to = parseInt(data[i].reply_to) || 0;
                sname = ' post-grey';
            }

            followed = data[i].user.you_follow || (data[i].user.id === my_id) || false;
            post_by = data[i].user.username;
            post_reposted = data[i].you_reposted || false;
            post_starred = data[i].you_starred || false;
            parseAccountNames( data[i].user );
            post_mentions = [];
            is_mention = isMention( data[i] );

            if ( data[i].entities.hasOwnProperty('mentions') ) {
                if ( data[i].entities.mentions.length > 0 ) {
                    for ( var idx = 0; idx < data[i].entities.mentions.length; idx++ ) {
                        post_mentions.push( data[i].entities.mentions[idx].name );
                    }
                }
            }

            post_time = getTimestamp( data[i].created_at, true );
            post_source = ' via ' + data[i].source.name || 'unknown';
            post_client = data[i].source.name || 'unknown';

            if ( show_ids.indexOf(this_id) >= 0 ) { show_ids.push(parseInt(data[i].reply_to)); }
            if ( show_ids.indexOf(this_id) < 0 ) { sname = ' post-minimum'; }
            if ( this_id === reply_to || this_id === post_id ) { sname = ' post-grey'; }
            
            if ( show_ids.indexOf(this_id) >= 0 ) {
                if ( post_min > 0 ) {
                    var lbl = (( post_cnt == 1 ) ? ' Post' : ' Posts');
                    _html = '<div id="ph-' + post_min + '" class="post-item post-collapsed" data-min="' + post_min + '">' +
                                '<div class="post-content" style="text-align: center;" onClick="showConvPosts(' + post_min + ');">' +
                                    '<span class="item">' + addCommas(post_cnt) + lbl + ' Collapsed <i class="fa fa-expand"></i></span>' +
                                '</div>' +
                            '</div>' + _html;
                    post_min = post_cnt = 0;
                }
            } else {
                if ( post_min == 0 ) { post_min = this_id; }
                post_cnt++;
            }

            _html = '<div id="conv-' + data[i].id + '" name="' + data[i].id + '" class="post-item' + sname + '" data-min="' + post_min + '">' +
                        '<div id="' + data[i].id + '-po" class="post-avatar">' +
                            '<img class="avatar-round"' +
                                ' onClick="doShowUser(' + data[i].user.id + ');"' +
                                ' src="' + data[i].user.avatar_image.url + '">' +
                        '</div>' +
                        '<div id="' + data[i].id + '-dtl" class="post-content" onClick="showHideActions(' + data[i].id + ', \'-c\');">' +
                            '<h5 class="post-name"><span>' + data[i].user.username + '</span></h5>' +
                            parseText( data[i] ) +
                            '<p class="post-time">' +
                                '<em>' + post_time + post_source + '</em>' +
                            '</p>' +
                        '</div>' +
                        respond.replaceAll('[TL]', '-c') +
                    '</div>' + _html;
        }
        document.getElementById( 'chat_posts' ).innerHTML = _html;
        toggleClassIfExists('conversation','hide','show');
        document.getElementById('conv-' + post_id).scrollIntoView();
    }
}
function showConvPosts( min ) {
    var elems = document.getElementById('chat_posts');
    var min_id = 0;
    for ( var idx = 0; idx < elems.children.length; idx++ ) {
        min_id = $('#' + elems.children[idx].id).data("min");
        if ( parseInt(min_id) === min ) { removeClassIfExists(elems.children[idx].id, 'post-minimum'); }
    }
    var element = document.getElementById('ph-' + min);
    element.parentNode.removeChild(element);
}
function checkVisible( elm, evalType ) {
    evalType = evalType || "visible";
    var vpH = $(window).height(),
        st = $(window).scrollTop(),
        y = $('#' + elm).offset().top,
        elementHeight = $('#' + elm).height();

    if (evalType === "visible") return ((y < (vpH + st)) && (y > (st - elementHeight)));
    if (evalType === "above") return ((y < (vpH + st)));
}
function showHideActivity( active ) {
    if ( active ) {
        if( $('#hd-activity').hasClass('hide') ) {
            toggleClass('hd-activity','hide','show');
            toggleClass('hd-spacer','show','hide');
        }
    } else {
        if( $('#hd-activity').hasClass('show') ) {
            toggleClass('hd-activity','show','hide');
            toggleClass('hd-spacer','hide','show');
        }
        setSplashMessage('');
    }
}

function showHideDialog() {
    toggleClassIfExists('dialog','hide','show',true);
}
function showHideGallery() {
    toggleClassIfExists('gallery','hide','show',true);
}
function showHideActions( post_id, tl ) {
    if ( tl === '*' ) {
        var tls = ['h', 'm', 'g', 'c', 'x', 'u'];
        var div = '';
        for ( var i = 0; i <= tls.length; i++ ) {
            div = '#' + post_id + '-rsp-' + tls[i];
            if ($(div).length) { toggleClassIfExists(post_id + '-rsp-' + tls[i],'show','hide'); }
        }
    } else {
        if ( tl === '-c' ) {
            if ( checkHasClass('conv-' + post_id, 'post-minimum') === false ) { toggleClassIfExists(post_id + '-rsp' + tl,'hide','show',true); }
        } else {
            toggleClassIfExists(post_id + '-rsp' + tl,'hide','show',true);
        }
    }
}
function showHideResponse() {
    if( $('#response').hasClass('hide') ) {
        toggleClass('response','hide','show');
        var reply_text = getReplyText(),
            draft_text = readStorage('draft');
        var txt_length = 256;

        if ( checkHasClass('rpy-box', 'pm') ) {
            document.getElementById('rpy-draft').innerHTML = '';
            txt_length = readStorage('chan_length', true);
        } else {
            document.getElementById('rpy-draft').innerHTML = ( draft_text ) ? '<i class="fa fa-inbox"></i>' : '&nbsp;';
            txt_length = readStorage('post_length', true);
        }
        document.getElementById('rpy-length').innerHTML = addCommas(txt_length);
        document.getElementById('rpy-text').value = reply_text;
        document.getElementById('rpy-text').focus();
        if ( reply_text !== '' ) {
            if ( readStorage('is_quote', true) === 'Y' ) {
                setCaretToPos(document.getElementById("rpy-text"), 0);
            } else {
                var caret_pos = reply_text.indexOf("\n");
                if ( caret_pos < 1 ) { caret_pos = reply_text.length; }
                setCaretToPos(document.getElementById("rpy-text"), caret_pos);
            }
        }
        calcReplyCharacters();

    } else {
        document.getElementById('rpy-title').value = '';
        toggleClassIfExists('autocomp','show','hide');
        removeClassIfExists('rpy-box', 'longpost');
        removeClassIfExists('rpy-box', 'pm');
        toggleClass('response','show','hide');        
        saveStorage('in_reply_to', '0');
        saveStorage('is_quote', 'N', true);
    }
}
function getReplyText() {
    var _id = readStorage('in_reply_to'),
        _iq = readStorage('is_quote', true);
    var txt = '',
        suffix = '';

    if ( _id > 0 ) {
        if ( _iq !== 'Y' ) {
            var my_id = readStorage('user_id');
            var mentions = false;
            var data = window.coredata['net.app.global'][_id];
            if ( data.hasOwnProperty('repost_of') ) {
                if ( data.user.id != my_id ) { suffix = '@' + data.user.username + ' '; }
                data = data.repost_of;
            }
            if ( data.entities.hasOwnProperty('mentions') ) { mentions = data.entities.mentions; }
            if ( data.user.id != my_id ) { txt = '@' + data.user.username + ' '; }
            if ( mentions !== false ) {
                for ( var i = 0; i < mentions.length; i++ ) {
                    if ( mentions[i].id !== my_id ) {
                        if ( (txt + ' ' + suffix).indexOf('@' + mentions[i].name) < 0 ) {
                            if ( suffix != '' ) { suffix += ' '; }
                            suffix += '@' + mentions[i].name;
                        }
                    }
                }
            }
            if ( suffix !== '' ) { txt += "\n\n// " + suffix; }
        } else {
            txt = ' >> @' + window.coredata['net.app.global'][_id].user.username + ': ' + window.coredata['net.app.global'][_id].text;
        }
    }

    return txt;
}
function showImage( image_url ) {
    if ( image_url != '' ) {
        var screen_height = window.innerHeight || docuemnt.body.clientHeight;
        var max_height = Math.floor(screen_height * 0.8 ) - 40;
        var css_style = 'max-height: ' + max_height + 'px;';

        document.getElementById('img-show').innerHTML = '<img src="' + image_url + '" style="' + css_style + '" />';
        $('#gallery').css('height', (max_height + 50) + 'px');
        toggleClass('gallery','hide','show');
    }
}
function doLogout() {
    var _key = 'acct_' + readStorage('user_id');
    deleteStorage( 'access_token' );
    deleteStorage( 'username' );
    deleteStorage( 'user_id' );
    deleteStorage( 'avatar' );
    deleteStorage( 'name' );
    deleteStorage( _key );

    for ( i in window.timelines ) {
        window.timelines[i] = ( i === 'global' );
        saveStorage('tl_' + i, (( i === 'global' ) ? 'Y' : 'N'));
    }

    window.location = window.location.protocol + '//' + window.location.hostname;
}
function loadDraft() {
    var draft_text = readStorage('draft'),
        reply_to = parseInt(readStorage('draft_reply_to'));
        saveStorage( 'draft_reply_to', readStorage('in_reply_to') );

    if ( draft_text ) {
        document.getElementById('rpy-draft').innerHTML = '&nbsp;';
        document.getElementById('rpy-text').value = draft_text;
        saveStorage('in_reply_to', reply_to);
        calcReplyCharacters();

        deleteStorage('draft_reply_to');
        deleteStorage('draft');
    }
}
function killPost() {
    if( $('#response').hasClass('show') ) {
        if ( document.getElementById( 'rpy-text' ).value.trim().length > 0 ) { showSaveDraft(); } else { showHideResponse(); }
    }
}
function setHideImages( do_hide ) {
    var hide_img = 'N';
    if ( do_hide === '' || do_hide === undefined ) {
        hide_img = readStorage('hide_images');
        saveStorage('hide_images', (( hide_img === 'N' ) ? 'Y' : 'N'));
    } else {
        hide_img = ( do_hide === 'Y' ) ? 'Y' : 'N';
    }
}
function parseEmbedded( post ) {
    var html = '';
    if ( post.hasOwnProperty('annotations') ) {
        for ( var i = 0; i < post.annotations.length; i++ ) {
            switch ( post.annotations[i].value.type || post.annotations[i].type ) {
                case 'net.app.core.oembed':
                case 'photo':
                case 'rich':
                    if ( post.annotations[i].value.mime_type !== undefined && post.annotations[i].value.mime_type !== false ) {
                        switch ( post.annotations[i].value.mime_type ) {
                            case 'audio/mpeg':
                            case 'audio/mp4':
                            case 'audio/mp3':
                                if ( readStorage('hide_audio') === 'N' ) {
                                    html += '<div id="' + post.id + '-audio-' + i + '" class="post-audio">' +
                                                '<audio controls>' +
                                                    '<source src="' + post.annotations[i].value.url + '"' +
                                                           ' type="' + post.annotations[i].value.mime_type + '">' +
                                                    getLangString('err_invalid_audio') +
                                                '</audio>' +
                                            '</div>';
                                }
                                break;

                            default:
                                if ( readStorage('hide_images') === 'N' ) {
                                    if ( post.annotations[i].value.url !== undefined && post.annotations[i].value.url !== '' ) {
                                        html += '<div id="' + post.id + '-img-' + i + '" class="post-image"' +
                                                    ' style="background: url(\'' + post.annotations[i].value.url + '\');' +
                                                           ' background-size: cover; background-position: center center;"' +
                                                    ' onclick="showImage(\'' + post.annotations[i].value.url + '\');">&nbsp;</div>';
                                    }
                                }
                        }
                    } else {
                        if ( readStorage('hide_images') === 'N' ) {
                            html += '<div id="' + post.id + '-img-' + i + '" class="post-image"' +
                                        ' style="background: url(\'' + post.annotations[i].value.url + '\');' +
                                               ' background-size: cover; background-position: center center;"' +
                                        ' onclick="showImage(\'' + post.annotations[i].value.url + '\');">&nbsp;</div>';
                            }
                    }
                    break;

                case 'social.nice.audio':
                    if ( readStorage('hide_audio') === 'N' ) {
                        html += '<div id="' + post.id + '-audio-' + i + '" class="post-audio">' +
                                    '<audio controls>' +
                                        '<source src="' + post.annotations[i].value.short_url + '"' +
                                               ' type="' + post.annotations[i].value.mimetype + '">' +
                                        getLangString('err_invalid_audio') +
                                    '</audio>' +
                                    '<p>' +
                                        '<a href="' + post.annotations[i].value.short_url + '" title="' + post.annotations[i].value.filename + '">' +
                                            '<i class="fa fa-cloud-download"></i> ' + getLangString('download_file') +
                                        '</a>' +
                                    '</p>' +
                                '</div>';
                    }
                    break;

                case 'net.app.core.geolocation':
                case 'net.app.ohai.location':
                    if ( readStorage('hide_geodata') === 'N' ) {
                        var lat_long = post.annotations[i].value.latitude + ',' + post.annotations[i].value.longitude;
                        var map_url = 'http://staticmap.openstreetmap.de/staticmap.php?center=' + lat_long + '&zoom=12&size=865x512';
                        html += '<div id="' + post.id + '-img-' + i + '" class="post-geo"' +
                                    ' style="background: url(\'' + map_url + '\');' +
                                           ' background-size: cover; background-position: center center;"' +
                                    ' onclick="showMap(' + lat_long + ');">&nbsp;</div>';
                    }
                    break;

                case 'net.vidcast-app.track-request':
                    if ( readStorage('hide_images') === 'N' ) {
                        var _innerHTML = ( post.annotations[i].value.title || false ) ? post.annotations[i].value.title : '';
                        var _vidid = post.annotations[i].value.link;
                        var _type = 'youtube';
                        if ( _vidid.indexOf('soundcloud.com') >= 0 ) { _type = 'soundcloud'; }
                        if ( _vidid.indexOf('vimeo.com') >= 0 ) { _type = 'vimeo'; }
                        switch ( _type ) {
                            case 'youtube':
                                var _blanks = ['http://youtu.be/', 'https://youtu.be/',
                                               'https://www.youtube.com/watch?v=', 'https://m.youtube.com/watch?v='];
                                for ( itm in _blanks ) {
                                    _vidid = _vidid.replace(_blanks[itm], '');
                                    _vidid = _vidid.substring(0, _vidid.indexOf('&') != -1 ? _vidid.indexOf('&') : _vidid.length);
                                }
        
                                if ( post.annotations[i].value.track || false ) {
                                    if ( _innerHTML != '' ) { _innerHTML += ' - '; }
                                    _innerHTML += post.annotations[i].value.track;
                                }
                                html += '<div id="' + post.id + '-vid-' + i + '" class="post-video">' +
                                            '<a href="' + post.annotations[i].value.link + '" title="' + _innerHTML + '" target="_blank">' +
                                                '<img src="//img.youtube.com/vi/' + _vidid + '/0.jpg" />' +
                                            '</a>' +
                                        '</div>';
                                break;

                            default:
                                /* Do Nothing */
                        }
                    }
                    break;

                default:
                    /* Do Nothing (Other Types Not Yet Supported) */
            }
        }
    }
    return html;
}
function doShowUserByName( user_name ) {
    if ( user_name === '' || user_name === undefined ) {
        toggleClass('dialog','show','hide');
    } else {
        // Get a UserID From the User List
        for ( var id in window.users ) {
            if ( window.users[ id ].username === user_name ) {
                doShowUser( id );
                break;
            }
        }
    }    
}
function doShowUser( user_id ) {
    if ( user_id === '' || user_id === undefined ) {
        toggleClass('dialog','show','hide');
    } else {
        toggleClassIfExists('dialog','hide','show');        
        if ( constructDialog('dialog') ) {
            showWaitState('user_posts', 'Collecting User Information');
            getUserProfile( user_id );
        }
    }
}
function doShowHash( name ) {
    if ( name === '' || name === undefined ) {
        toggleClass('hashbox','show','hide');
    } else {
        toggleClassIfExists('hashbox','hide','show');
        if ( constructDialog('hashbox') ) {
            showWaitState('hash_posts', 'Collecting Posts With #' + name);
            getHashDetails(name);
        }
    }
}
function getHashDetails( name ) {
    if ( name === undefined || name === '' ) { return false; }
    var access_token = readStorage('access_token');
    saveStorage('this_hash_name', name, true);

    if ( access_token !== false ) {
        showWaitState('hash_posts', 'Accessing App.Net');
        var api_url = ( readStorage('nice_proxy') === 'Y' ) ? window.niceURL + '/proxy' : window.apiURL;
        var params = {
            access_token: access_token,
            include_annotations: 1,
            include_html: 1,
            hashtags: name,
            count: 200
        };
        doJSONQuery( '/posts/search', false, 'GET', params, parseHashDetails, '' );
    } else {
        getAuthorisation();
    }
}
function parseHashDetails( data ) {
    name = readStorage('this_hash_name', true);
    if ( data ) {
        var respond = '',
            html = '';
        var is_mention = false,
            followed = false;
        var nicerank = 0.1;
        var post_mentions = [],
            post_reposted = false,
            post_starred = false,
            post_source = '',
            post_client = '',
            post_time = '',
            post_by = '';
        var my_id = readStorage('user_id');
        showWaitState('hash_posts', 'Reading Posts');

        document.getElementById( 'hash_count' ).innerHTML = '(' + data.length + ((data.length === 200) ? '+' : '') + ' Posts)';
        document.getElementById('mute_hash').innerHTML = '<button onclick="doMuteHash(\'' + name + '\');">' + getLangString('hash_mutetag') + name + '</button>';
        for ( var i = 0; i < data.length; i++ ) {
            showWaitState('hash_posts', 'Reading Posts (' + (i + 1) + '/' + data.length + ')');
            nicerank = ( readStorage('nice_proxy') === 'Y' ) ? data[i].nicerank : parseInt( readStorage( data[i].user.id + '_rank', true) );
            
            if ( nicerank >= 1.75 ) {
                respond = buildRespondBar( data[i] );
    
                followed = data[i].user.you_follow || (data[i].user.id === my_id) || false;
                post_by = data[i].user.username;
                post_reposted = data[i].you_reposted || false;
                post_starred = data[i].you_starred || false;
                post_mentions = [];
                is_mention = isMention( data[i] );

                if ( data[i].entities.hasOwnProperty('mentions') ) {
                    if ( data[i].entities.mentions.length > 0 ) {
                        for ( var idx = 0; idx < data[i].entities.mentions.length; idx++ ) {
                            post_mentions.push( data[i].entities.mentions[idx].name );
                        }
                    }
                }

                post_time = humanized_time_span(data[i].created_at);
                post_source = ' via ' + data[i].source.name || 'unknown';
                post_client = data[i].source.name || 'unknown';

                html += '<div id="conv-' + data[i].id + '" class="post-item">' +
                            '<div id="' + data[i].id + '-po" class="post-avatar">' +
                                '<img class="avatar-round"' +
                                    ' onClick="doShowUser(' + data[i].user.id + ');"' +
                                    ' src="' + data[i].user.avatar_image.url + '">' +
                            '</div>' +
                            '<div id="' + data[i].id + '-dtl" class="post-content">' +
                                '<h5 class="post-name"><span>' + data[i].user.username + '</span></h5>' +
                                parseText( data[i] ) +
                                '<p class="post-time">' +
                                    '<em onClick="showHideActions(' + data[i].id + ', \'-x\');">' + post_time + post_source + '</em>' +
                                '</p>' +
                            '</div>' +
                            respond.replaceAll('[TL]', '-x') +
                            parseEmbedded( data[i] ) +
                        '</div>';
            }
        }
        document.getElementById( 'hash_posts' ).innerHTML = html;
        toggleClassIfExists('hashbox','hide','show');        
    }
}
function getReplyCharCount() {
    var post_text = document.getElementById( 'rpy-text' ).value.trim();
        post_text = post_text.replace(/([^"])(https?:\/\/([^\s"]+))/g, '').replace('[', '').replace(']', '');
    return post_text.length;        
}
function calcReplyCharacters() {
    var max_length = parseInt( readStorage('post_length', true) ),
        max_default = 256,
        txt_length = getReplyCharCount();
    if ( checkHasClass('rpy-box', 'longpost') ) {
        max_length = parseInt( readStorage('long_length', true) );
        max_default = 2048;
    }
    if ( checkHasClass('rpy-box', 'pm') ) {
        max_length = parseInt( readStorage('chan_length', true) );
        max_default = 2048;
    }
    if ( max_length === NaN || max_length === undefined ) { max_length = max_default; }
    var rpy_length = (max_length - txt_length);
    document.getElementById('rpy-length').innerHTML = addCommas(rpy_length);
    var is_upload = readStorage('is_uploading', true);

    if ( rpy_length >= 0 && rpy_length <= max_length && is_upload === 'N' ) {
        removeClass('rpy-length','red');
        if ( rpy_length <= max_length ) { toggleClassIfExists('rpy-send','btn-grey','btn-green'); }
        if ( rpy_length == max_length ) { toggleClassIfExists('rpy-send','btn-green','btn-grey'); }
    } else {
        addClass('rpy-length','red');
        toggleClassIfExists('rpy-send','btn-green','btn-grey');        
    }
}
function doMuteHash( name ) { muteHashtag(name); }
function showSaveDraft() {
    if( $('#draftbox').hasClass('hide') ) {
        toggleClass('draftbox','hide','show');
    } else {
        toggleClass('draftbox','show','hide');
        document.getElementById('rpy-text').value = '';
        showHideResponse();
    }
}
function saveDraft() {
    var post_text = document.getElementById('rpy-text').value.trim();
    if ( post_text !== '' ) {
        saveStorage( 'draft_reply_to', readStorage('in_reply_to') );
        saveStorage( 'draft', post_text );
    }
    showSaveDraft();
}
function getCaretPos(el) {
    if (el.selectionStart) { 
        return el.selectionStart; 
    } else if (document.selection) { 
        el.focus();
        var r = document.selection.createRange();
        if (r == null) { return 0; }

        var re = el.createTextRange(),
        rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);
        return rc.text.length;
    }
    return 0;
}
function setCaretToPos (input, pos) { setSelectionRange(input, pos, pos); }
function setSelectionRange(input, selectionStart, selectionEnd) {
    if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
    } else if (input.createTextRange) {
        var range = input.createTextRange();
        range.collapse(true);
        range.moveEnd('character', selectionEnd);
        range.moveStart('character', selectionStart);
        range.select();
    }
}
function doGreyConv( first_id, reply_id ) {
    if ( reply_id === 0 ) { return true; }
    [].forEach.call(document.getElementById("chat_posts").children, function(element) {
        removeClass(element.id, 'post-grey');
    });
    addClass('conv-' + first_id,'post-grey');
    removeClass('conv-' + first_id, 'post-minimum');
    if ( reply_id > 0 ) {
        addClass('conv-' + reply_id,'post-grey');
        removeClass('conv-' + reply_id, 'post-minimum');
        document.getElementById('conv-' + reply_id).scrollIntoView();
    }
}
function doHandyTextSwitch() {
    if ( readStorage('is_quote', true) === 'N' ) {
        var el = document.getElementById('rpy-text');
        var caret_pos = getCaretPos(el);
        var orig_text = el.value;
        var new_text = orig_text.replaceAll('...', '…', '');
        if ( orig_text !== new_text ) {
            el.value = new_text;
            setCaretToPos(document.getElementById('rpy-text'), (caret_pos - 2));
        }
    }
    calcReplyCharacters();
}
function trimPosts() {
    var col_limit = (parseInt(readStorage('column_max')) + 1);
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) {
            if ( window.timelines[i] ) {
                var elems = document.getElementById(i);
                if ( elems !== null && elems !== undefined ) {
                    if ( elems.children.length > col_limit ) {
                        while ( elems.children.length > col_limit ) {
                            var e = document.getElementById(elems.children[(elems.children.length - 2)].id);
                            e.parentNode.removeChild(e);
                        }
                    }
                }
            }
        }
    }
}
function getGeoPosition() {
    if (navigator.geolocation) {
        setSplashMessage('Requesting Current Location');
        navigator.geolocation.getCurrentPosition(function(position) {
            var data = { "latitude": position.coords.latitude,
                        "longitude": position.coords.longitude
                        };
            if ( isNaN(position.coords.altitude) === false && position.coords.altitude !== null ) {
                data["altitude"] = position.coords.altitude;
            }
            window.store['location'] = { "type": "net.app.core.geolocation",
                                        "value": data
                                        };
            console.log( JSON.stringify(window.store['location']) );
            setSplashMessage('');
        }, function(error) {
            saveStorage('msgTitle', getLangString('err_geotitle'), true);
            switch ( error.code ) {
                case 1:
                    saveStorage('msgText', getLangString('err_geocase1'), true);
                    break;

                case 3:
                    saveStorage('msgText', getLangString('err_geocase3'), true);
                    break;

                default:
                    saveStorage('msgText', getLangString('err_geodeflt'), true);
            }
            if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
            setSplashMessage('');
        },
        { maximumAge: 600000, timeout: 10000 });
    } else {
        saveStorage('msgTitle', getLangString('err_geotitle'), true);
        saveStorage('msgText', getLangString('err_geosorry'), true);
        if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
        setSplashMessage('');
    }
}
function triggerFileUpload() { $('#file').trigger('click'); }
function triggerGeoTagging() { getGeoPosition(); }
function triggerLongPost() {
    var max_length = parseInt( readStorage('long_length', true) ),
        max_default = 2048;
    if ( max_length === NaN || max_length === undefined ) { max_length = max_default; }
    document.getElementById('rpy-length').innerHTML = addCommas(max_length);
    addClassIfNotExists('rpy-box', 'longpost');
}
function showMap( Latitude, Longitude ) {
    var osm_url = 'https://www.openstreetmap.org/#map=16/' + Latitude + '/' + Longitude;
    var new_tab = window.open(osm_url, '_blank');
    new_tab.focus();
}
function showWaitState( div_id, msg ) {
    var _html = '';
    if ( $('#' + div_id).length === 0 ) { return false; }
    if ( msg === undefined || msg === '' ) {
        document.getElementById(div_id).innerHTML = _html;
    } else {
        if ( document.getElementById(div_id).innerHTML === '' ) {
            _html = '<div style="padding: 30% 0; text-align: center;">' +
                        '<div style="font-size: 200%;"><i class="fa fa-spinner fa-pulse"></i></div>' +
                        '<div id="wait-msg" style="font-size: 125%; padding: 15px 0;">' + msg  + '</div>' +
                    '</div>';
            toggleClass(div_id, 'hide','show');
            document.getElementById(div_id).innerHTML = _html;
        } else {
            document.getElementById('wait-msg').innerHTML = msg;
        }
    }
}
function doMouseOver( post_id, TL ) {
    if ( readStorage('show_hover') === 'N' ) { return false; }
    if ( window.store['hover_over'] === undefined || window.store['hover_over'] != post_id ) {
        if( $('#' + post_id + '-rsp' + TL).hasClass('hide') ) { $('#' + post_id + '-rsp' + TL).removeClass('hide').addClass('show') }
        window.store['hover_over'] = post_id;
    }
}
function doMouseOut( post_id, TL ) {
    if ( readStorage('show_hover') === 'N' ) { return false; }
    var dt = parseInt( readStorage('show_hover_delay') );
    if ( dt >= 10000 ) { dt = 15000; }
    if ( dt <= 1000 ) { dt = 1000; }
    setTimeout(function() {
        if ( window.store['hover_over'] === undefined || window.store['hover_over'] != post_id ) {
            if( $('#' + post_id + '-rsp' + TL).hasClass('show') ) { $('#' + post_id + '-rsp' + TL).removeClass('show').addClass('hide') }
        }
    }, dt);
}
function htmlEntities(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}
function isHidden(elID) {
    if( $( elID ).css('display') == 'none' ) { return true; }
    return false;
}
function addCommas(str) {
    var orig = parseInt(str);
    if ( orig < 0 ) { str = (orig * -1); }
    var parts = (str + "").split("."),
        main = parts[0],
        len = main.length,
        i = len - 1,
        rVal = '';

    while(i >= 0) {
        rVal = main.charAt(i) + rVal;
        if ((len - i) % 3 === 0 && i > 0) { rVal = "," + rVal; }
        --i;
    }
    if (parts.length > 1) { rVal += "." + parts[1]; }
    return ((orig < 0) ? '-' : '') + rVal;
}
function buildUrl(url, parameters) {
    var qs = '';
    for(var key in parameters) {
        var value = parameters[key];
        if ( qs != '' ) { qs += '&'; }
        qs += encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }
    if (qs.length > 0) { url = url + "?" + qs; }
    return url;
}
function parseFileUpload( response, file, anno_type ) {
    var access_token = readStorage('access_token');
    if ( access_token === undefined || access_token === false || access_token === '' ) { return false; }

    var rslt = jQuery.parseJSON( response );
    var meta = rslt.meta;
    var showMsg = false;
    switch ( meta.code ) {
        case 400:
        case 507:
            var msg = getLangString('err_upload01');
            saveStorage('msgText', msg.replaceAll('[CODE]', meta.code).replaceAll('[MESSAGE]', meta.error_message), true);
            saveStorage('is_uploading', 'N', true);
            showMsg = true;
            break;

        case 200:
            var data = rslt.data;
            var xhr = new XMLHttpRequest();
            var url = window.apiURL + '/files/' + data.id + '/content';

            if ( xhr.upload ) {
                xhr.upload.onprogress = function(e) {
                    var done = e.loaded, total = e.total;
                    var progress = (Math.floor(done/total*1000)/10);
                    var msg = getLangString('file_progress');
                    if ( progress > 0 && progress <= 99.99999 ) { setSplashMessage(msg.replaceAll('[PROGRESS]', progress)); }
                    if ( progress === 100 ) { setSplashMessage( getLangString('file_validate') ); }
                    if ( progress <= 0 || progress > 100 ) { setSplashMessage(''); }
                    saveStorage('is_uploading', 'Y', true);
                    calcReplyCharacters();
                };
            }
            xhr.onreadystatechange = function(e) {
                if ( 4 == this.readyState ) {
                    switch ( e.target.status ) {
                        case 204:
                            if ( !window.files.hasOwnProperty( data.id ) ) {
                                window.files[data.id] = { id: data.id,
                                                          file_token: data.file_token,
                                                          name: data.name,
                                                          type: data.type,
                                                          mime: file.type,
                                                          anno: anno_type,
                                                          url_permanent: data.url_permanent,
                                                          url_short: data.url_short
                                                         }
                            }
                            var txt = document.getElementById('rpy-text').value.trim();
                            if ( txt !== '' ) { txt += ' '; }
                            txt += '[' + data.name + '](_' + data.id + '_)';
                            document.getElementById('rpy-text').value = txt;
                            break;

                        case 507:
                            var msg = getLangString('err_upload01');
                            saveStorage('msgText', msg.replaceAll('[CODE]', meta.code).replaceAll('[MESSAGE]', meta.error_message), true);
                            showMsg = true;
                            break;

                        default:
                            /* Do Nothing */
                    }
                    saveStorage('is_uploading', 'N', true);
                    calcReplyCharacters();
                }
            };

            xhr.open('put', url, true);
            xhr.setRequestHeader("Authorization", "Bearer " + access_token);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.send(file);
            break;

        default:
            /* Do Nothing */
    }
    if ( showMsg ) { if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); } }
}
function humanized_time_span(date, ref_date, date_formats, time_units) {
    date_formats = date_formats || {
        past: [
            { ceiling: 60, text: getLangString('ago_seconds') },
            { ceiling: 3600, text: getLangString('ago_minutes') },
            { ceiling: 86400, text: getLangString('ago_hours') },
            { ceiling: 2629744, text: getLangString('ago_days') },
            { ceiling: 31556926, text: getLangString('ago_months') },
            { ceiling: null, text: getLangString('ago_years') }
        ],
        future: [
            { ceiling: 60, text: getLangString('ago_seconds') },
            { ceiling: 3600, text: "in $minutes minutes" },
            { ceiling: 86400, text: "in $hours hours" },
            { ceiling: 2629744, text: "in $days days" },
            { ceiling: 31556926, text: "in $months months" },
            { ceiling: null, text: "in $years years" }
        ]
    };
    time_units = time_units || [
        [31556926, 'years'],
        [2629744, 'months'],
        [86400, 'days'],
        [3600, 'hours'],
        [60, 'minutes'],
        [1, 'seconds']
    ];
  
    date = new Date(date);
    ref_date = ref_date ? new Date(ref_date) : new Date();
    var seconds_difference = (ref_date - date) / 1000;

    var tense = 'past';
    if (seconds_difference < 0) {
        tense = 'future';
        seconds_difference = 0-seconds_difference;
    }

    function get_format() {
        for (var i=0; i<date_formats[tense].length; i++) {
            if (date_formats[tense][i].ceiling == null || seconds_difference <= date_formats[tense][i].ceiling) {
                return date_formats[tense][i];
            }
        }
        return null;
    }

    function get_time_breakdown() {
        var seconds = seconds_difference;
        var breakdown = {};
        for(var i=0; i<time_units.length; i++) {
            var occurences_of_unit = Math.floor(seconds / time_units[i][0]);
            seconds = seconds - (time_units[i][0] * occurences_of_unit);
            breakdown[time_units[i][1]] = occurences_of_unit;
        }
        return breakdown;
    }

    function render_date(date_format) {
        var breakdown = get_time_breakdown();
        var time_ago_text = date_format.text.replace(/\$(\w+)/g, function() {
            return breakdown[arguments[1]];
        });
        return depluralize_time_ago_text(time_ago_text, breakdown);
    }

    function depluralize_time_ago_text(time_ago_text, breakdown) {
        var do_roman = readStorage('romanise_time');
        for(var i in breakdown) {
            if (breakdown[i] == 1) {
                var repl_str = getLangString('depl_' + i);
                if ( repl_str !== '' ) { time_ago_text = time_ago_text.replaceAll(repl_str[0], repl_str[1]); }
            }
            if ( do_roman === 'Y' ) { time_ago_text = time_ago_text.replace(breakdown[i], romanize(breakdown[i])); }
        }
        return time_ago_text;
    }

    return render_date(get_format());
}
function readMutedHashtags() {
    var hashes = readStorage('muted_hashes');
    if ( hashes === false ) { hashes = []; } else { hashes = JSON.parse(hashes); }
    return hashes;
}
function muteHashtag( name ) {
    var hashes = readMutedHashtags();
    var name = name.trim();
    if ( name === undefined || name === '' ) { return false; }

    for ( var idx = 0; idx <= hashes.length; idx++ ) { if ( hashes[idx] === name ) { return true; } }
    hashes.push(name);
    saveStorage('muted_hashes', JSON.stringify(hashes));
    saveStorage('msgTitle', getLangString('mute_title').replaceAll('[NAME]', name), true);
    saveStorage('msgText', getLangString('hash_mutemsg').replaceAll('[NAME]', name), true);
    if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
    return true;
}
function unmuteHashtag( name ) {
    var hashes = readMutedHashtags();
    var name = name.trim();
    if ( name === undefined || name === '' ) { return false; }

    for ( var idx = 0; idx <= hashes.length; idx++ ) {
        if ( hashes[idx] === name ) {
            hashes.splice(idx, 1);
            saveStorage('muted_hashes', JSON.stringify(hashes));
            break;
        }
    }
    return true;
}
function readMutedClients() {
    var clients = readStorage('muted_clients');
    if ( clients === false ) { clients = []; } else { clients = JSON.parse(clients); }
    return clients;
}
function muteClient( name ) {
    var clients = readMutedClients();
    var name = name.trim();
    if ( name === undefined || name === '' ) { return false; }

    for ( var idx = 0; idx <= clients.length; idx++ ) { if ( clients[idx] === name ) { return true; } }
    clients.push(name);
    saveStorage('muted_clients', JSON.stringify(clients));

    saveStorage('msgTitle', 'Muted ' + name, true);
    saveStorage('msgText', 'Posts from "' + name + '" will now be muted.', true);
    if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
    return true;
}
function isMutedItem( post_id ) {
    var clients = readMutedClients();
    var hide_muted = readStorage('hide_muted', false);
    if ( window.coredata['net.app.global'][post_id].source.name === undefined || window.coredata['net.app.global'][post_id].source.name === '' ) {
        return 'Unknown Client';
    }
    var name = window.coredata['net.app.global'][post_id].source.name.trim();
    for ( var idx = 0; idx <= clients.length; idx++ ) { 
        if ( clients[idx] === name ) { 
            var mm = getLangString('muted_client');
            return ( hide_muted === 'Y' ) ? true : mm.replaceAll('[NAME]', name);
        }
    }

    if ( window.coredata['net.app.global'][post_id].entities.hashtags.length > 0 ) {
        var hashes = readMutedHashtags();
        if ( hashes.length > 0 ) {
            var tags = window.coredata['net.app.global'][post_id].entities.hashtags;
            for ( n in tags ) {
                for ( idx in hashes ) {
                    var hh = getLangString('muted_hashtag');
                    if ( hashes[idx] === tags[n].name ) { return ( hide_muted === 'Y' ) ? true : hh.replaceAll('[NAME]', tags[n].name); }
                }
            }
        }
    }
    return false;
}
function muteAccount( ismuted, account_id ) {
    var access_token = readStorage('access_token');
    var action_type = ( ismuted ) ? 'DELETE' : 'POST';

    if ( access_token !== false ) {
        var params = { access_token: access_token };
        doJSONQuery( '/users/' + account_id + '/mute', false, action_type, params, parseMuteAction, '' );
    } else {
        getAuthorisation();
    }
}
function blockAccount( isblocked, account_id ) {
    var access_token = readStorage('access_token');
    var action_type = ( isblocked ) ? 'DELETE' : 'POST';

    if ( access_token !== false ) {
        var params = { access_token: access_token };
        doJSONQuery( '/users/' + account_id + '/block', false, action_type, params, parseBlockAction, '' );
    } else {
        getAuthorisation();
    }
}
function parseMuteAction( data ) {
    var mute_text = (data.you_muted) ? getLangString('mute_start') : getLangString('mute_finish');
    showHidePostsFromAccount(data.id, data.you_muted);
    saveStorage('msgTitle', getLangString('done_and_done'), true);
    saveStorage('msgText', mute_text.replaceAll('[NAME]', data.username), true);
    if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
    showHideDialog();
}
function parseBlockAction( data ) {
    var mute_text = (data.you_blocked) ? getLangString('block_start') : getLangString('block_finish');
    showHidePostsFromAccount(data.id, data.you_blocked);
    saveStorage('msgTitle', getLangString('done_and_done'), true);
    saveStorage('msgText', mute_text.replaceAll('[NAME]', data.username), true);
    if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
    showHideDialog();
}
function reportAccount( account_id ) {
    var params = { 'account_id': account_id,
                   'report_by': readStorage('user_id')
                  };
    doJSONQuery( '/user/report', true, 'GET', params, parseReport, '' );
}
function parseReport( data ) {
    if ( data ) {
        if ( data.id > 0 ) {
            showHidePostsFromAccount( data.id, false );
            saveStorage( data.id + '_rank', 0.1, true );
            saveStorage( data.id + '_human', 'N', true );
            saveStorage('msgTitle', getLangString('spammer_title'), true);
            saveStorage('msgText', getLangString('spammer_thank'), true);
        } else {
            saveStorage('msgTitle', getLangString('oops_title'), true);
            saveStorage('msgText', getLangString('spammer_error'), true);
        }
        if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
    }
    showHideDialog();
}
function showHidePostsFromAccount( account_id, hide ) {
    for ( idx in window.coredata['net.app.global'] ) {
        if ( window.coredata['net.app.global'][idx].user.id === account_id ) {
            var elems = document.getElementsByName(idx);
            for (e in elems) {
                var elementExists = document.getElementById(elems[e].id);
                if ( elementExists ) { document.getElementById(elems[e].id).style.display = ((hide === true) ? 'none' : 'block'); }
            }
        }
    }
}
function togglePostDrop() { toggleClassIfExists('post-drop', 'hide', 'show', true); }
function toggleProfileDrop() { toggleClassIfExists('profile-drop', 'hide', 'show', true); }
function setCSSPreferences() {
    jss.set('body', { 'background-color': '#' + readStorage('body_background') });
    jss.set('.header', { 'background-color': '#' + readStorage('header_background') });
    jss.set('.header', { 'color': '#' + readStorage('header_color') });
    jss.set('.post-name', { 'color': '#' + readStorage('post-name_color') });
    jss.set('.post-content', { 'color': '#' + readStorage('post-content_color') });
    jss.set('.post-mention', { 'color': '#' + readStorage('post-mention_color') });
    jss.set('.chat .post-item.post-grey', { 'background-color': '#' + readStorage('post-highlight_color') });
    jss.set('.chatbox', { 'background-color': '#' + readStorage('body_background') });
    jss.set('.chatbox', { 'border-color': '#' + readStorage('post-content_color') });
    jss.set('.chatbox .title', { 'background-color': '#' + readStorage('header_background') });
    jss.set('.chatbox .title', { 'color': '#' + readStorage('header_color') });
    jss.set('.chatbox .title_btn', { 'background-color': '#' + readStorage('header_background') });
    jss.set('.chatbox .title_btn', { 'color': '#' + readStorage('header_color') });
    jss.set('.chatbox div#mute_hash.title_btn', { 'background-color': '#' + readStorage('header_background') });
    jss.set('.chatbox div#mute_hash.title_btn', { 'color': '#' + readStorage('header_color') });
    jss.set('.chatbox .lbltxt', { 'color': '#' + readStorage('post-content_color') });
    jss.set('.chatbox div#pref-list.chat version', { 'color': '#' + readStorage('post-content_color') });
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

    jss.set('.post-list.tl-interact .pulse-item .pulse-content', { 'color': '#' + readStorage('post-content_color') });
    jss.set('.post-list.tl-interact .pulse-item .pulse-content item', { 'background-color': '#' + readStorage('post-highlight_color') });
    jss.set('.post-list.tl-interact .pulse-item .pulse-content item span', { 'color': '#' + readStorage('post-content_color') });
    jss.set('div#userlist.post-list.tl-userlist .post-item .pulse-content', { 'background-color': '#' + readStorage('post-highlight_color') });
    jss.set('div#userlist.post-list.tl-userlist .post-item .pulse-content', { 'color': '#' + readStorage('post-content_color') });
    jss.set('div#userlist.post-list.tl-userlist .post-item .numbers', { 'color': '#' + readStorage('post-content_color') });
    
    jss.set('.post-list .post-item .post-avatar, .chat-list .post-item .post-avatar', {
        'display': (( readStorage('hide_avatars') === 'Y' ) ? 'none' : 'inline-block')
    });
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
var availableFontFamilies = {
    'Helvetica': 'Helvetica',
    'Arial': 'Arial',
    'Comic Sans MS': 'Comic Sans MS',
    'Courier New': 'Courier New',
    'Geneva': 'Geneva',
    'Georgia': 'Georgia',
    'Monospace': 'Monospace',
    'Palatino Linotype': 'Palatino Linotype',
    'Sans Serif': 'sans-serif',
    'Serif': 'serif',
    'Tahoma': 'Tahoma',
    'Times New Roman': 'Times New Roman',
    'Verdana': 'Verdana',
    'Apple System Font': '-apple-system, Helvetica Neue, sans-serif'
};
function setFontFamily( familyName ) {
    var family = availableFontFamilies[familyName];
    document.body.style.fontFamily = family;
    saveStorage('font_family', familyName);
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
function setHeaderNav() {
    var named_columns = readStorage('named_columns');
    if ( named_columns === 'N' ) { document.getElementById('tl-names').innerHTML = ''; } else { setWindowConstraints(); }
    document.getElementById('site-name').innerHTML = ( named_columns === 'N' ) ? window.sitename : '';

    jss.set('.post-list.tl-pms', { 'background-image': ((named_columns === 'N') ? 'url("../img/pms.png")' : 'none') });
    jss.set('.post-list.tl-home', { 'background-image': ((named_columns === 'N') ? 'url("../img/home.png")' : 'none') });
    jss.set('.post-list.tl-global', { 'background-image': ((named_columns === 'N') ? 'url("../img/global.png")' : 'none') });
    jss.set('.post-list.tl-interact', { 'background-image': ((named_columns === 'N') ? 'url("../img/interact.png")' : 'none') });
    jss.set('.post-list.tl-mentions', { 'background-image': ((named_columns === 'N') ? 'url("../img/mentions.png")' : 'none') });
}
function setGlobalShow( type ) {
    var options = ['e', 'n'];
    var show_type = ( type === 'n' ) ? 'n' : 'e';
    saveStorage('global_show', show_type);
}
function setDelaySeconds() {
    var sec = parseInt( document.getElementById('show_hover_delay').value );
    if ( sec === undefined || isNaN(sec) ) {
        alert( getLangString('err_one_fifteen') );
        return false;
    }
    if ( sec < 1 || sec > 15 ) {
        alert( getLangString('err_one_fifteen') );
        return false;
    }
    saveStorage('show_hover_delay', (sec * 1000));
}
function setColumnWidthAdjustment() {
    var px = parseInt( document.getElementById('scroll_amt').value )
    if ( px === undefined || isNaN(px) || px === false ) { px = 0; }
    if ( px === 0 ) { px = '0'; }
    saveStorage('scrollbar_adjust', px);
    setWindowConstraints();
}
function showUserList( type, account_id ) {
    var access_token = readStorage('access_token');
    saveStorage('this_account_type', type, true);
    saveStorage('this_account_id', account_id, true);

    if ( access_token !== false ) {
        document.getElementById('user_posts').innerHTML = '<div id="usr-0" class="user-item">&nbsp;</div>';
        setSplashMessage('Getting Account List');
        var params = {
            include_annotations: 0,
            include_deleted: 0,
            include_machine: 0,
            access_token: access_token,
            include_html: 0,
            count: 200
        }; 
        doJSONQuery( '/users/' + account_id + '/' + type, false, 'GET', params, parseUserList, '' );
    }
}
function parseUserList( data ) {
    var type = readStorage('this_account_type', true),
        account_id = readStorage('this_account_id', true);
    if ( data ) {
        var _html = '',
            _id = 'usr-0';
        var my_id = parseInt(readStorage('user_id'));
        for ( var i = 0; i < data.length; i++ ) {
            _html = '<img src="' + data[i].avatar_image.url + '" alt="' + data[i].username + '" onclick="doShowUser(' + data[i].id + ');" />' +
                    '<strong onclick="doShowUser(' + data[i].id + ');">' +
                        data[i].username +
                        ( (data[i].name !== '') ? ' <em>(' + data[i].name  + ')</em>' : '' ) +
                    '</strong>' +
                    '<div class="buttons">' +
                        ( (data[i].follows_you === true) ? '<em>' + getLangString('follows_you') + '</em>' : '') +
                        '<button id="btn-follow-' + data[i].id + '" class="btn ' + ( (data[i].you_follow === true) ? 'btn-red' : 'btn-green') + '"' +
                               ' onclick="doFollow(' + data[i].id + ',' + data[i].you_follow + ');">' +
                            ( (data[i].you_follow === true) ? getLangString('unfollow') : getLangString('follow')) +
                        '</button>' +
                    '</div>' +
                    '<div id="more-' + data[i].id + '" class="user-detail">' +
                        '<p>' + data[i].timezone + '</p>' +
                        '<p>' + ((data[i].description === undefined) ? '&nbsp;' : data[i].description.text) + '</p>' +
                    '</div>';
            document.getElementById('user_posts').insertBefore( buildGenericNode( 'usr-' + data[i].id, data[i].id, 'user-item', _html ),
                                                                                  document.getElementById(_id) );
        }
        if ( account_id === my_id && type === 'following' ) {
            _html = '<center><button class="btn btn-green" onclick="showFullUserList();">' + getLangString('show_everyone') + '</button></center>';
            document.getElementById('user_posts').insertBefore( buildGenericNode( 'usr-btn', 'ubtn', 'user-item', _html ),
                                                                                  document.getElementById(_id) );
            _id = 'usr-btn';
        }
    }
    setSplashMessage('');
}
function showFullUserList() {
    var buffer = '<div id="0[TL]" class="post-item" style="border: 0; min-height: 75px;"></div>';
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) {
            if ( window.timelines[i] ) { showHideTL(i); }
        }
    }
    $('#tl-space').append( '<div id="userlist" class="post-list tl-userlist" style="overflow-x: hidden;">' +
                           buffer.replaceAll('[TL]', '-ul', '') +
                           '</div>' );
    setWindowConstraints();

    var access_token = readStorage('access_token');
    var my_id = parseInt(readStorage('user_id'));
    if ( access_token !== false ) {
        setSplashMessage('Getting Full Account List');
        var params = {
            access_token: access_token,
            account_id: my_id
        };
        doJSONQuery( '/user/followers', true, 'GET', params, parseFullUserList, '' );
    }
}
function parseFullUserList( data ) {
    if ( data ) {
        var _html = '',
            _id = '0-ul';
        var my_id = parseInt(readStorage('user_id'));
        var avatarClass = 'avatar-round',
            post_time = '',
            last_time = '';
        for ( var i = 0; i < data.length; i++ ) {
            var post_via = getLangString('posted_via'),
                post_on = getLangString('posted_on'),
                c_month = getLangString('count_month');
            post_time = getTimestamp( data[i].recent_message.created_at );
            last_time = getTimestamp( data[i].last_post_unix * 1000 );
            _html = '<div class="post-avatar">' +
                        '<img class="' + avatarClass + '"' +
                            ' onClick="doShowUser(' + data[i].id + ');"' +
                            ' src="' + data[i].avatar_image.url + '">' +
                    '</div>' +
                    '<div class="post-content">' +
                        '<h5 class="post-name"><span>' + data[i].username + '</span></h5>' +
                        '<div class="buttons">' +
                            ( (data[i].follows_you === true) ? '<em>' + getLangString('follows_you') + '</em>' : '') +
                            '<button id="btn-follow-' + data[i].id + '" class="btn ' + ( (data[i].you_follow === true) ? 'btn-red' : 'btn-green') + '"' +
                                   ' onclick="doFollow(' + data[i].id + ',' + data[i].you_follow + ');">' +
                                ( (data[i].you_follow === true) ? getLangString('unfollow') : getLangString('follow')) +
                            '</button>' +
                        '</div>' +
                        '<div class="user-detail">' +
                            '<p>&nbsp;&nbsp;' + getLangString('acct_timezone') + ': ' + data[i].timezone + '</p>' +
                            '<p>&nbsp;&nbsp;' + getLangString('acct_nicerank') + ': ' + data[i].nicerank + '</p>' +
                            '<p>' + c_month.replaceAll('[COUNT]', addCommas(data[i].recent_posts)) + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="numbers">' +
                        '<div class="detail" style="border-right: 1px solid #ccc;">' +
                            '<strong>' + getLangString('count_posts') + '</strong><p>' + addCommas(data[i].counts.posts) + '</p>' +
                        '</div>' +
                        '<div class="detail" style="border-right: 1px solid #ccc;">' +
                            '<strong>' + getLangString('count_follows') + '</strong><p>' + addCommas(data[i].counts.following) + '</p>' +
                        '</div>' +
                        '<div class="detail" style="border-right: 1px solid #ccc;">' +
                            '<strong>' + getLangString('count_followers') + '</strong><p>' + addCommas(data[i].counts.followers) + '</p>' +
                        '</div>' +
                        '<div class="detail"><strong>' + getLangString('count_stars') + '</strong><p>' + addCommas(data[i].counts.stars) + '</p></div>' +
                    '</div>' +
                    '<div class="pulse-content">' +
                        parseText( data[i].recent_message ) +
                        '<p class="post-time"><em>' + post_via.replaceAll('[NAME]', data[i].recent_message.source.name) + '</em></p>' +
                        '<p class="post-time"><em>' + post_on.replaceAll('[DATE]', post_time) + '</em></p>' +
                    '</div>';

            document.getElementById('userlist').insertBefore( buildGenericNode( data[i].id + '-ul', data[i].id, 'post-item', _html ),
                                                                                document.getElementById(_id) );
        }
    }
    setSplashMessage('');
}
function editProfile() {
    alert( "[Debug] Whoops! This is still in the works. Check back soon!" );
}
function findTopPost() {
    var elem_id = '0-h',
        elem_top = 100000000;

    for ( post_id in window.coredata['net.app.global'] ) {
        if ( window.coredata['net.app.global'][post_id] !== false ) {
            if ( checkElementExists(post_id + '-h') === true ) {
                var el = document.getElementById(post_id + '-h');
                var rect = el.getBoundingClientRect();
                if ( rect.top < elem_top && rect.top >= 0 ) {
                    elem_top = rect.top;
                    elem_id = el.id;
                }
                if ( rect.top < 0 ) {
                    var h = document.getElementById('home').getBoundingClientRect();
                    if ( h.top !== elem_top ) { el.scrollIntoView(); }
                    break;
                }
            }
        }
    }
}
function buildGenericNode( elID, elName, elClass, html ) {
    var elem = document.createElement("div");
    elem.setAttribute('id', elID);
    elem.setAttribute('name', elName);
    elem.setAttribute('class', elClass);
    elem.innerHTML = html;

    return elem;
}
function romanize (num) {
    if (!+num) { return ''; }
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--) {
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    }
    return Array(+digits.join("") + 1).join("M") + roman;
}