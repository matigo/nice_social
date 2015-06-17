String.prototype.replaceAll = function(str1, str2, ignore) {
   return this.replace(new RegExp(str1.replace(/([\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, function(c){return "\\" + c;}), "g"+(ignore?"i":"")), str2);
};
String.prototype.ireplaceAll = function(strReplace, strWith) {
    var reg = new RegExp(strReplace, 'ig');
    return this.replace(reg, strWith);
};
jQuery.fn.scrollTo = function(elem, speed) { 
    $(this).animate({
        scrollTop:  $(this).scrollTop() - $(this).offset().top + $(elem).offset().top 
    }, speed === undefined ? 1000 : speed); 
    return this; 
};
jQuery(function($) {
    window.store = new Object();
    window.chans = {};
    window.posts = {};
    window.users = {};
    window.files = {};
    window.activate = false;
    window.timelines = { home     : false,
                         mentions : false,
                         global   : true,
                         pms      : false
    }
    loadConfigFile();
    window.KEY_ENTER = 13;
    window.KEY_ESCAPE = 27;
    window.KEY_K = 75;
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
        if ( readStorage('shortkey_n') == 'Y' ) {
            if( $('#response').hasClass('hide') ) { if ( event.keyCode === KEY_N ) { showHideResponse(); } }
        }
        if ( event.keyCode === KEY_F2 ) { $('#autocomp').removeClass('show').addClass('hide'); }
    });
    $(document).keydown(function(e) {
        var cancelKeyPress = false;
        if ( readStorage('shortkey_cmdk') == 'Y' ) {
            if ( (e.metaKey || e.ctrlKey) && e.keyCode == KEY_K ) { clearTimelines(); cancelKeyPress = true; }
        }
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

    var fileObj = { 'kind': "photo",
                    'type': "social.nice.image",
                    'mime_type': file.type,
                    'name': file.name,
                    'public': true
                   };

    xhr.onreadystatechange = function(e) { if ( 4 == this.readyState ) { parseFileUpload( e.target.response, file ); } };
    xhr.open('post', url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + access_token);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(fileObj));
}, false);
function loadConfigFile() {
    if ( readConfigFile( 'config.json' ) ) { return true; }
}
function readConfigFile( filename ) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET",  filename, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if( xhr.readyState == 4 && xhr.status == 200 ) {
            switch ( xhr.status ) {
                case 200:
                    var data = JSON.parse( xhr.responseText );
                    if ( data ) {
                        for ( var item in data ) { window[item] = data[item]; }
                        continueLoadProcess();
                        setWindowConstraints();
                        return true;
                    }

                default:
                    if ( filename !== 'config.sample.json' ) { return readConfigFile( 'config.sample.json' ); }
                    return false;
            }
        }
    }
    xhr.send();
}
function continueLoadProcess() {
    if ( prepApp() ) {
        window.setInterval(function(){
            getGlobalItems();
            redrawList(); 
        }, 1000);
        window.setInterval(function(){ collectRankSummary(); }, 60*60*1000);
        window.setInterval(function(){ updateTimestamps(); }, 15000);
        
        /* Add the Moment.js Resources if Required */
        loadMomentIfRequired();

        getPMSummary();
        showTimelines();
        collectRankSummary();
        getGlobalRecents();
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
    if ( _id > 0 ) { saveStorage('in_reply_to', _id, true); }
    doPostOrAuth();
}
function testADNAccessToken() {
    var params = { access_token: readStorage('access_token') };
    setSplashMessage('Testing App.Net Token');

    $.ajax({
        url: window.apiURL + '/users/me',
        crossDomain: true,
        data: params,
        type: 'GET',
        success: function( data ) { parseMyToken( data.data ); },
        error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
        dataType: "json"
    });
}
function parseMyToken( data ) {
    if ( data ) {
        document.getElementById('mnu-avatar').style.backgroundImage = 'url("' + data.avatar_image.url + '")';
        document.getElementById('doAction').innerHTML = 'New Post';
        setSplashMessage('Parsing Token Information');
        saveStorage('long_length', 8000, true );
        saveStorage('chan_length', 2048, true);
        saveStorage('post_length', 256, true);
        saveStorage('_refresher', '0', true);
        saveStorage('isGood', 'Y', true);

        saveStorage('username', data.username);
        saveStorage('locale', data.locale);
        saveStorage('user_id', data.id);
        saveStorage('name', data.name);

        if ( readStorage('tl_home') === 'N' && readStorage('tl_mentions') === 'N' ) {
            window.timelines.mentions = true;
            saveStorage('tl_mentions', 'Y', true);
            window.timelines.home = true;
            saveStorage('tl_home', 'Y', true);
        }
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
        if ( token !== false ) { saveStorage( 'access_token', token ); }
    }
    return token;
}
function prepApp() {
    setSplashMessage('Getting Nice Ready ...');
    document.getElementById("site-name").innerHTML = window.sitename;
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

                  20: { 'key': 'refresh_last', 'value': seconds, 'useStore': true },
                  21: { 'key': 'post_length', 'value': 256, 'useStore': true },
                  22: { 'key': 'nicerank', 'value': 'Y', 'useStore': false },
                  23: { 'key': 'min_rank', 'value': 2.1, 'useStore': true },
                  24: { 'key': 'limit', 'value': 250, 'useStore': true },
                  25: { 'key': 'since', 'value': '0', 'useStore': true },

                  30: { 'key': 'absolute_times', 'value': 'N', 'useStore': false },
                  31: { 'key': 'keep_timezone', 'value': 'N', 'useStore': false },
                  32: { 'key': 'display_nrscore', 'value': 'N', 'useStore': false },
                  33: { 'key': 'display_details', 'value': 'N', 'useStore': false },
                  34: { 'key': 'display_usage', 'value': 'N', 'useStore': false },

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

                  70: { 'key': 'font_family', 'value': 'Helvetica', 'useStore': false },
                  71: { 'key': 'font_size', 'value': 14, 'useStore': false }

                 };
    for ( idx in items ) {
        if ( readStorage( items[idx].key, items[idx].useStore ) === false ) { saveStorage( items[idx].key, items[idx].value, items[idx].useStore ); }
    }
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
    if ( max_length === NaN || max_length === undefined ) { max_length = max_default; }
    var reply_to = parseInt(readStorage('in_reply_to', true));

    if ( rpy_length > 0 && rpy_length <= max_length ) {
        writePost( document.getElementById('rpy-text').value.trim(), reply_to );
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
    var access_token = readStorage('access_token');
    saveStorage('in_reply_to', '0', true);

    if ( access_token !== false ) {
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("Authorization", "Bearer " + access_token);
                xhr.setRequestHeader("Content-Type", "application/json");
                return true;
            }
        });
        $.ajax({
            url: window.apiURL + '/posts',
            crossDomain: true,
            data: buildJSONPost(text, in_reply_to),
            type: 'POST',
            success: function( data ) {
                if ( parseMeta(data.meta) ) {
                    showHideResponse();
                    getTimeline();
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
                oembed.push({ "type": "net.app.core.oembed",
                              "value": { "+net.app.core.file": { "file_id": window.files[idx].id,
                                                                 "file_token": window.files[idx].file_token,
                                                                 "format": "oembed" }
                                        }
                            });
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
        count: 20        
    };
    if ( access_token !== false ) { params.access_token = access_token; }
    toggleClassIfExists('dialog','hide','show');
    showWaitState('usr-info', 'Accessing App.Net');

    $.ajax({
        url: window.apiURL + '/users/' + user_id + '/posts',
        crossDomain: true,
        data: params,
        success: function( data ) { parseUserProfile( data.data ); },
        error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
        dataType: "json"
    });
}
function getUserProfileActions( data ) {
    if ( data.user.id === readStorage('user_id') ) { return ''; }
    var _html = '<ul>' +
                    '<li id="profile-drop" class="hide" onclick="toggleProfileDrop();">' +
                        '<i class="fa fa-cog"></i>' +
                        '<ul>' +
                            '<li onClick="blockAccount(' + data.user.you_blocked + ', ' + data.user.id + ');">' + 
                                ((data.user.you_blocked) ? 'Unblock' : 'Block') + 
                            '</li>' +
                            '<li onClick="muteAccount(' + data.user.you_muted + ', ' + data.user.id + ');">' + 
                                ((data.user.you_muted) ? 'Listen Again' : 'Mute') +
                            '</li>' +
                            '<li onClick="reportAccount(' + data.user.id + ');">Report Spammer</li>' +
                        '</ul>' +
                    '</li>' +
                '</ul>';
    return _html;
}
function getUserProfileNumbers( data ) {
    var _html = '<div class="detail" style="border-right: 1px solid #ccc;" onclick="doShowUser(' + data.id + ');">' +
                    '<strong>Posts</strong><p>' + addCommas( data.counts.posts ) + '</p>' +
                '</div>' +
                '<div class="detail" style="border-right: 1px solid #ccc;" onclick="showUserList(\'following\', ' + data.id + ');">' +
                    '<strong>Following</strong><p>' + addCommas( data.counts.following ) + '</p>' +
                '</div>' +
                '<div class="detail" onclick="showUserList(\'followers\', ' + data.id + ');">' +
                    '<strong>Followers</strong><p>' + addCommas( data.counts.followers ) + '</p>' +
                '</div>';
    
    return _html;
}
function parseUserProfile( data ) {
    if ( data ) {
        var html = '',
            action_html = '',
            post_source = '';
        var my_id = readStorage('user_id');
        var h4color = readStorage('post-content_color');

        // Set the Header Information
        document.getElementById( 'usr-banner' ).style.backgroundImage = 'url("' + data[0].user.cover_image.url + '")';
        document.getElementById( 'usr-avatar' ).innerHTML = '<img class="avatar-square" src="' + data[0].user.avatar_image.url + '">';
        document.getElementById( 'usr-names' ).innerHTML =  '<h3>' + data[0].user.username + '</h3>' +
                                                            '<h4 style="color:#' + h4color + '">' + data[0].user.name + '</h4>' +
                                                            '<h5>' + getUserProfileActions( data[0] ) + '</h5>';

        document.getElementById( 'usr-info' ).innerHTML = ( data[0].user.hasOwnProperty('description') ) ? data[0].user.description.html : '';
        document.getElementById( 'usr-numbers' ).innerHTML = getUserProfileNumbers( data[0].user );

        if ( data[0].user.follows_you ) { action_html += '<em>Follows You</em>'; }
        if ( data[0].user.you_follow ) {
            action_html += '<button onclick="doFollow(' + data[0].user.id + ', true)" class="btn-red">Unfollow</button>';
        } else {
            if ( data[0].user.id !== my_id ) {
                if ( data[0].user.you_can_follow ) {
                    action_html += '<button onclick="doFollow(' + data[0].user.id + ', false)" class="btn-green">Follow</button>';
                } else {
                    action_html = '&nbsp;';
                }
                
            } else {
                action_html += '<span>I think this is you.</span>';
            }
        }
        document.getElementById( 'usr-actions' ).innerHTML = action_html;

        // Write the Post History
        for ( var i = 0; i < data.length; i++ ) {
            post_source = ' via ' + data[i].source.name || 'unknown';
            html += '<div class="post-item">' +
                        '<div class="post-content">' +
                            parseText( data[i] ) +
                            '<p class="post-time">' +
                                '<em>' + getTimestamp( data[i].created_at, true ) + post_source + '</em>' +
                            '</p>' +
                        '</div>' +
                    '</div>';
        }
        document.getElementById( 'user_posts' ).innerHTML = html;
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
            access_token: access_token,
            include_html: 1,
            count: 200
        };
        $.ajax({
            url: window.apiURL + '/posts/stream',
            crossDomain: true,
            data: params,
            type: 'GET',
            success: function( data ) { parseItems( data.data ); saveStorage('home_done', 'Y',true); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
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
            access_token: access_token,
            include_html: 1,
            count: 50
        }; 
        $.ajax({
            url: window.apiURL + '/users/me/mentions',
            crossDomain: true,
            data: params,
            type: 'GET',
            success: function( data ) { parseItems( data.data ); saveStorage('ment_done', 'Y', true); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    }
}
function canRefreshGlobal() {
    var rrate = parseInt(readStorage('refresh_rate')),
        rlast = parseInt(readStorage('refresh_last', true));
    var seconds = new Date().getTime() / 1000;
    var rVal = false;
    if ( rlast === undefined || isNaN(rlast) ) { rlast = 0; }
    if ( (seconds-rlast) >= rrate ) { saveStorage('refresh_last', seconds, true); rVal = true; }
    return rVal;
}
function getGlobalRecents( since_id ) {
    if ( since_id === undefined || isNaN(since_id) ) { since_id = 0; }
    var recents = parseInt(readStorage('recents', true));
    if ( recents === undefined || isNaN(recents) ) { recents = 0; }
    saveStorage('recents', (recents + 1) , true);
    if ( recents >= 10 ) { return false; }

    var access_token = readStorage('access_token');
    var params = {
        include_annotations: 1,
        include_deleted: 0,
        include_machine: 0,
        include_html: 1,
        count: 200
    }

    if ( access_token !== false ) { params.access_token = access_token; }
    if ( since_id > 0 ) { params.before_id = since_id; }
    showHideActivity(true);

    $.ajax({
        url: window.apiURL + '/posts/stream/global',
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

    var access_token = readStorage('access_token');
    var params = {
        include_annotations: 1,
        include_deleted: 0,
        include_machine: 0,
        include_html: 1,
        since_id: readStorage( 'since', true),
        count: 200        
    };
    if ( access_token !== false ) { params.access_token = access_token; }
    saveStorage('adn_action', 'Y', true);
    showHideActivity(true);

    $.ajax({
        url: window.apiURL + '/posts/stream/global',
        crossDomain: true,
        data: params,
        success: function( data ) { parseItems( data.data ); },
        error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
        dataType: "json"
    });
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
        data = sortByKey(data, "id");
        saveStorage('adn_action', 'N', true);

        var html = '';
        var is_mention = false,
            followed = false;
        var account_rank = 0,
            show_time = readStorage('show_live_timestamps'),
            use_nice = readStorage('nicerank');
        var min_rank = (use_nice === 'N') ? 0 : parseInt( readStorage('min_rank', true) );
        var post_mentions = [],
            post_reposted = false,
            post_starred = false,
            post_source = '',
            post_client = '',
            post_time = '',
            post_by = '';
        var my_id = readStorage('user_id');
        var muted_hashes = readMutedHashtags();
        var write_post = true;
        var gTL = $('#global').length;

        for ( var i = 0; i < data.length; i++ ) {
            if ( gTL === 0 ) { setSplashMessage('Reading Posts (' + (i + 1) + '/' + data.length + ')'); }
            followed = data[i].user.you_follow || (data[i].user.id === my_id) || false;
            account_rank = parseInt( readStorage( data[i].user.id + '_rank', true) );
            if ( isNaN(account_rank) ) { account_rank = 0.1; }
            is_human = (use_nice === 'N') ? 'Y' : readStorage( data[i].user.id + '_human', true);
            if ( readStorage('feeds_hide') === 'N' && data[i].user.type === 'feed' ) {
                account_rank = 2.1;
                is_human = 'Y';
            }
            saveStorage( 'since', data[i].id, true);
            write_post = isValidClient(data[i]);

            if ( (account_rank >= min_rank && is_human == 'Y') || (data[i].user.id === my_id) || followed ) {
                if ( write_post === false && ((data[i].user.id === my_id) || followed) ) { write_post = true; }
                post_by = data[i].user.username;
                post_reposted = data[i].you_reposted || false;
                post_starred = data[i].you_starred || false;
                post_mentions = [];

                if ( write_post ) {
                    if ( data[i].entities.hasOwnProperty('mentions') ) {
                        if ( data[i].entities.mentions.length > 0 ) {
                            for ( var idx = 0; idx < data[i].entities.mentions.length; idx++ ) {
                                post_mentions.push( data[i].entities.mentions[idx].name );
                            }
                        }
                    }
                    if ( data[i].entities.hasOwnProperty('hashtags') ) {
                        if ( data[i].entities.hashtags.length > 0 ) {
                            for ( var idx = 0; idx < data[i].entities.hashtags.length; idx++ ) {
                                if ( muted_hashes.indexOf( data[i].entities.hashtags[idx].name ) >= 0 ) { write_post = false; }
                            }
                        }
                    }

                    parseAccountNames( data[i].user );
                    post_client = data[i].source.name || 'unknown';
                    is_mention = isMention( data[i] );
                    html = buildHTMLSection( data[i] );
                    addPostItem( data[i].id, data[i].created_at, html, is_mention, followed, post_by, data[i].user.id,
                                 post_mentions, post_reposted, post_starred, false, post_client );
                }
            }
        }
        saveStorage('_refresher', -1, true)
        showHideActivity(false);
        trimPosts();
    }
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

    // Is This a Repost?
    if ( post.hasOwnProperty('repost_of') ) {
        data = post.repost_of;
        repost_by = ' <i style="float: right;">(<i class="fa fa-retweet"></i> ' + post.user.username + ')</i>';
        is_repost = true;
    }

    /* Special Handling for /me Posts (See Issue #56) */
    if ( data.text.indexOf('/me') === 0 ) {
        var line_text = data.text.replace('/me', '<em onClick="doShowUser(' + data.user.id + ');">' + data.user.username + '</em>' );
        _html = '<div id="' + data.id + '-dtl" class="post-content" onClick="showHideActions(' + data.id + ', \'[TL]\');"' +
                    ' onMouseOver="doMouseOver(' + data.id + ', \'[TL]\');" onMouseOut="doMouseOut(' + data.id + ', \'[TL]\');"' +
                    ' style="width: 90%;">' +
                    parseText( data ) +
                '</div>' +
                buildRespondBar( data );
    } else {
        post_time = getTimestamp( data.created_at );
        account_age = Math.floor(( new Date() - Date.parse(data.user.created_at) ) / 86400000);
        if ( account_age <= 7 ) { avatarClass = 'avatar-round recent-acct'; }
        if ( account_age <= 1 ) { avatarClass = 'avatar-round new-acct'; }
        if ( isMention( data ) ) { avatarClass = 'avatar-round mention'; }
        _html = '<div id="' + data.id + '-po" class="post-avatar">' +
                    '<img class="' + avatarClass + '"' +
                        ' onClick="doShowUser(' + data.user.id + ');"' +
                        ' src="' + data.user.avatar_image.url + '">' +
                '</div>' +
                '<div id="' + data.id + '-dtl" class="post-content" onClick="showHideActions(' + data.id + ', \'[TL]\');"' +
                    ' onMouseOver="doMouseOver(' + data.id + ', \'[TL]\');" onMouseOut="doMouseOut(' + data.id + ', \'[TL]\');">' +
                    '<h5 class="post-name"><span>' + data.user.username + repost_by + '</span></h5>' +
                    parseText( data ) +
                    '<p class="post-time">' +
                        '<em id="' + post.id + '-time[TL]" name="' + post.id + '-time">' + post_time + '</em>' +
                    '</p>' +
                '</div>' +
                buildRespondBar( data ) +
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
function buildNode( post_id, tl_ref, html ) {
    var elem = document.createElement("div");
    elem.setAttribute('id', post_id + tl_ref);
    elem.setAttribute('name', post_id);
    elem.setAttribute('class', 'post-item');
    elem.innerHTML = html;

    return elem;
}
function addPostItem( post_id, created_at, html, is_mention, followed, post_by, acct_id, post_mentions, post_reposted, post_starred, is_convo, client_name ) {
    if ( !window.posts.hasOwnProperty( post_id ) ) {
        window.posts[post_id] = { type_cd: 'post',
                                  post_id: post_id,
                                  is_new: false,
                                  created_at: created_at,
                                  created_by: post_by,
                                  account_id: acct_id,
                                  html: html,
                                  is_mention: is_mention,
                                  followed: followed,
                                  mentions: post_mentions,
                                  reposted: post_reposted,
                                  starred: post_starred,
                                  is_conversation: is_convo,
                                  client: client_name,
                                  item_dts: new Date().getTime()
                                 }
    }
}
function parseText( post ) {
    var html = post.html.replaceAll('<a href=', '<a target="_blank" href=', '') + ' ',
        name = '',
        cStr = ' class="post-mention" style="font-weight: bold; cursor: pointer;"';
    var highlight = readStorage('post-highlight_color');

    if ( post.text.indexOf('/me') === 0 ) {
        html = '<i class="fa fa-dot-circle-o"></i> ' + html.replace('/me', '<em onClick="doShowUser(' + post.user.id + ');">' + post.user.username + '</em>' );
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
                        post_body = post_body.replace(/\[([^\[]+)\]\(([^\)]+)\)/g, '<a target="_blank" href="$2">$1</a>');
                        html = ((post.annotations[i].value.title !== '') ? '<h6>' + post.annotations[i].value.title + '</h6>' : '') +
                               '<span>' + post_body + '</span>';
                    }
                    break;

                default:
                    /* Do Nothing */
            }
        }
    }

    if ( post.entities.mentions.length > 0 ) {
        for ( var i = 0; i < post.entities.mentions.length; i++ ) {
            name = '>@' + post.entities.mentions[i].name + '<';
            html = html.ireplaceAll(name, cStr + ' onClick="doShowUser(' + post.entities.mentions[i].id + ');"' + name);
        }
    }
    if ( post.entities.hashtags.length > 0 ) {
        for ( var i = 0; i < post.entities.hashtags.length; i++ ) {
            name = '>#' + post.entities.hashtags[i].name + '<';
            html = html.ireplaceAll(name, cStr + ' onClick="doShowHash(\'' + post.entities.hashtags[i].name + '\');"' + name);
        }
    }

    /* Parse the Inline Markdown (Only Bold, Italics, Code) */
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
    html = html.replace(/`(.*?)`/g, '<code style="background-color:#' + highlight + ';padding:0 5px;">$1</code>');

    return html;
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
    var buffer = '<div id="0[TL]" class="post-item" style="border: 0; min-height: 75px;"></div>';
    document.getElementById('tl-space').innerHTML = '';
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) {
            if ( window.timelines[i] === true ) {
                $('#tl-space').append( '<div id="' + i + '" class="post-list tl-' + i + '" style="overflow-x: hidden;">' +
                                           buffer.replaceAll('[TL]', '-' + i.charAt(0), '') +
                                       '</div>' );
            }
        }
    }
    saveStorage('_refresher', '-1', true);
    setWindowConstraints();
    if ( Object.keys(window.chans).length > 0 ) {
        for ( chan_id in window.chans ) { window.chans[chan_id].is_new = true; }
    }
}
function showMutedPost( post_id, tl ) {
    var _html = '<div id="' + post_id + tl + '" name="' + post_id + '" class="post-item">' +
                    window.posts[post_id].html.replaceAll('[TL]', tl, '') +
                '</div>';
    $('#' + post_id + tl ).replaceWith( _html );
}
function redrawList() {
    var counter = parseInt( readStorage('_refresher', true) );
    if ( counter >= 0 && counter < 10 ) {
        saveStorage( '_refresher', (counter + 1), true);
        return false;
    } else { 
        saveStorage( '_refresher', '0', true);
    }

    var global_showall = ( readStorage('global_show') === 'e' ) ? true : false;
    if ( readStorage('global_hide') === 'Y' ) { global_showall = false; }
    if ( window.activate === false ) {
        var _home = readStorage('home_done', true),
            _ment = readStorage('ment_done', true);

        if ( _home === 'Y' && _ment === 'Y' ) { setSplashMessage(''); }
        window.activate = true;
    }
    
    if ( window.timelines.pms === true ) {
        var my_id = readStorage('user_id');
        var user_list = '',
            user_name = '';
        var sort_order = sortPMList();
        if ( document.getElementById('pms').innerHTML === '' ) { $( "#pms" ).prepend(buffer); }
        for ( var idx = 0; idx <= sort_order.length; idx++ ) {
            for ( chan_id in window.chans ) {
                if ( window.chans[chan_id] !== false ) {
                    if ( window.chans[chan_id].is_new === true && window.chans[chan_id].updated_at === sort_order[idx] ) {
                        user_list = '';
                        for ( var i = 0; i < window.chans[chan_id].user_ids.length; i++ ) {
                            if ( user_list !== '' ) {
                                user_list += ( i === (window.chans[chan_id].user_ids.length - 1) ) ? ' &amp; ' : ', ';
                            }
                            if ( window.chans[chan_id].user_ids[i] === my_id ) {
                                user_list += 'You';
                            } else {
                                if ( window.users.hasOwnProperty(window.chans[chan_id].user_ids[i]) ) {
                                    user_name = window.users[window.chans[chan_id].user_ids[i]].username;
                                } else {
                                    user_name = '???';
                                }
                                user_list += user_name;
                            }
                        }
                        $( "#pms" ).prepend( window.chans[chan_id].html.replaceAll('[TL]', '-p', '').replaceAll('[NAME_INFO]', user_list.trim(), '') );
                        window.chans[chan_id].is_new = false;
                    }
                }
            }
        }
    }

    /* Draw the Standard Timelines */
    var postText = '';
    var last_id = '';

    for ( post_id in window.posts ) {
        if ( window.posts[post_id] !== false ) {
            if ( isMutedClient(window.posts[post_id].client) ) {
                postText = '<span onClick="showMutedPost(' + post_id + ', \'[TL]\');">' +
                               '@' + window.posts[post_id].created_by + ' - ' + 'Muted Client (' + window.posts[post_id].client + ')' +
                           '</span>';
            } else {
                postText = window.posts[post_id].html;
            }

            if ( window.posts[post_id].is_conversation === false ) {
                if ( window.timelines.home ) {
                    if ( checkElementExists(post_id + '-h') === false ) {
                        if ( window.posts[post_id].is_mention || window.posts[post_id].followed ) {
                            last_id = getPreviousElement(post_id, 'home', '-h');
                            if ( last_id !== false ) {
                                document.getElementById('home').insertBefore( buildNode(post_id, '-h', postText.replaceAll('[TL]', '-h', '')),
                                                                              document.getElementById(last_id) );
                            }
                        }
                    }
                }

                if ( window.timelines.mentions ) {
                    if ( checkElementExists(post_id + '-m') === false ) {
                        if ( window.posts[post_id].is_mention ) {
                            last_id = getPreviousElement(post_id, 'mentions', '-m');
                            if ( last_id !== false ) {
                                document.getElementById('mentions').insertBefore( buildNode(post_id, '-m', postText.replaceAll('[TL]', '-m', '')),
                                                                                  document.getElementById(last_id) );
                            }
                        }
                    }
                }
    
                if ( window.timelines.global ) {
                    if ( checkElementExists(post_id + '-g') === false ) {
                        if ( global_showall || window.posts[post_id].followed === false ) {
                            last_id = getPreviousElement(post_id, 'global', '-g');
                            if ( last_id !== false ) {
                                document.getElementById('global').insertBefore( buildNode(post_id, '-g', postText.replaceAll('[TL]', '-g', '')),
                                                                                document.getElementById(last_id) );
                            }
                        }
                    }
                }
            }
        }
    }
    setWindowConstraints();
    updateTimestamps();
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
function checkElementExists( div_id ) {
    var element =  document.getElementById( div_id );
    if (typeof(element) !== 'undefined' && element !== null) { return true; } else { return false; }
}
function setWindowConstraints() {
    var sHeight = window.innerHeight || document.body.clientHeight;
    var sWidth = window.innerWidth || document.body.clientWidth;
    var cWidth = 0,
        vCols = 1,
        pAdj = 6;

    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) { if ( window.timelines[i] ) { vCols++; } }
    }
    
    while ( cWidth < 280 ) {
        vCols--;
        if ( vCols > 4 ) { vCols = 4; }
        if ( vCols <= 0 ) { vCols = 1; }
        if ( sWidth <= 1024 && vCols > 3 ) { vCols = 3; pAdj = 6; }
        if ( sWidth == 768 && vCols >= 2 ) { vCols = 2; pAdj = 10; }
        if ( sWidth <  768 && vCols >= 2 ) { vCols = 2; pAdj = 15; }
        if ( sWidth >= 500 && sWidth <= 568 && vCols >= 2 ) { vCols = 2; pAdj = 2; }
        if ( sWidth <= 500 && vCols >= 1 ) { vCols = 1; pAdj = 20; }
        if ( sWidth <= 384 && vCols >= 1 ) { vCols = 1; pAdj = 2; }
        cWidth = ( vCols > 1 ) ? Math.floor(sWidth / vCols): sWidth;
    }

    var sb_adjust = readStorage('scrollbar_adjust');
    if ( isNaN(sb_adjust) || sb_adjust === false ) { sb_adjust = 0; } else { sb_adjust = parseInt(sb_adjust); }

    sBar = scrollbarWidth( cWidth );
    if ( sBar > 0 && sBar <= 40 ) {
        sBar = Math.floor(sBar / vCols) + 1;
        cWidth = cWidth - sBar;
    }
    if ( sBar === 0 ) { cWidth = cWidth - vCols - pAdj - sb_adjust; }
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
    var vCols = 0,
        idx = 1;
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) { if ( window.timelines[i] ) { vCols++; } }
    }
    css_style += (cCount === 1) ? ' max-width: 480px;' : ' max-width: ' + parseFloat(100 / cCount).toFixed(3) + '%;';
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) {
            if ( window.timelines[i] ) { 
                if ( idx === vCols ) { css_style = 'border-right: 0; ' + css_style; }
                if ( document.getElementById( i ).getAttribute('style') !== css_style ) {
                    document.getElementById( i ).setAttribute('style',css_style);
                }
                idx++;
            }
        }
    }
}
function constructDialog( dialog_id ) {
    var _html = '';
    switch ( dialog_id ) {
        case 'autocomp':
            _html = '';
            break;

        case 'conversation':
            _html = '<div class="chatbox">' +
                        '<div class="title" onclick="doShowConv();">' +
                            'Conversation View <em id="chat_count">&nbsp;</em>' +
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
                        '<div class="title">Before You Go ...</div>' +
                        '<div id="msg" class="message">Would you like to save this message as a draft?</div>' +
                        '<div class="buttons">' +
                            '<button onclick="showSaveDraft();" class="btn-red">No, Thanks</button>' +
                            '<button onclick="saveDraft();" class="btn-green">Yes, Please</button>' +
                        '</div>' +
                    '</div>';
            break;

        case 'hashbox':
            _html = '<div class="chatbox">' +
                        '<div class="title" onclick="doShowHash();">' +
                            'Hashtag View <em id="hash_count">&nbsp;</em>' +
                            '<span><i class="fa fa-times-circle-o"></i></span>' +
                        '</div>' +
                        '<div id="mute_hash" class="title_btn"><button onclick="doMuteHash(\'hashtag\');">Mute Hashtag</button></div>' +
                        '<div id="hash_posts" class="chat"></div>' +
                    '</div>';
            break;

        case 'okbox':
            _html = '<div class="msgbox">' +
                        '<div class="title">' + readStorage('msgTitle', true) + '</div>' +
                        '<div id="msg" class="message">' + readStorage('msgText', true) + '</div>' +
                        '<div class="buttons">' +
                            '<button onclick="dismissOKbox();" class="btn-green">OK</button>' +
                        '</div>' +
                    '</div>';
            break;

        case 'prefs':
            _html = '<div class="chatbox">' +
                        '<div class="title" onclick="doShowPrefs();">' +
                            'Settings <em id="hash_count">&nbsp;</em>' +
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
                            '<button id="rpy-kill" class="btn-red">Cancel</button>' +
                            '<button id="rpy-send" class="btn-grey">Send</button>' +
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
        toggleClass('conversation','show','hide');        
    } else {
        toggleClassIfExists('conversation','hide','show');
        if ( constructDialog('conversation') ) {
            showWaitState('chat_posts', 'Collecting Private Conversation');
            getChannelMessages(chan_id);
        }
    }
}
function getChannelMessages( chan_id ) {
    if ( parseInt(chan_id) <= 0 || isNaN(chan_id) ) { return false; }
    var access_token = readStorage('access_token');

    if ( access_token !== false ) {
        showWaitState('chat_posts', 'Accessing App.Net');
        var params = {
            include_annotations: 1,
            include_deleted: 0,
            include_machine: 0,
            access_token: access_token,
            include_html: 1,
            include_read: 1,
            count: 200           
        };
        $.ajax({
            url: window.apiURL + '/channels/' + chan_id + '/messages',
            data: params,
            type: 'GET',
            success: function( data ) { parseChannel( data.data ); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    }
}
function parseChannel( data ) {
    if ( data ) {
        var my_id = readStorage('user_id');
        var html = '',
            side = '';
        showWaitState('chat_posts', 'Reading Posts');

        document.getElementById( 'chat_count' ).innerHTML = '(' + data.length + ' Posts)';
        for ( var i = 0; i < data.length; i++ ) {
            showWaitState('chat_posts', 'Reading Posts (' + (i + 1) + '/' + data.length + ')');

            side = ( data[i].user.id === my_id ) ? 'right' : 'left';
            html += '<div id="conv-' + data[i].id + '" class="post-item ' + side + '">' +
                        '<div id="' + data[i].id + '-po" class="post-avatar">' +
                            '<img class="avatar-round"' +
                                ' onClick="showAccountInfo(' + data[i].user.id + ');"' +
                                ' src="' + data[i].user.avatar_image.url + '">' +
                        '</div>' +
                        '<div id="' + data[i].id + '-dtl" class="post-content">' +
                            '<h5 class="post-name"><span>' + data[i].user.username + '</span></h5>' +
                            parseText( data[i] ) +
                            '<p class="post-time">' +
                                '<em onClick="showHideActions(' + data[i].id + ', \'-x\');">' + humanized_time_span(data[i].created_at) + '</em>' +
                            '</p>' +
                        '</div>' +
                    '</div>';
        }
        document.getElementById( 'chat_posts' ).innerHTML = html;
        toggleClassIfExists('conversation','hide','show');
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
        document.getElementById( 'autocomp' ).innerHTML = '<div class="autobox">' + _html + '</div>';
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
function setNotification( title, message, sound ) {
    if ( window.hasOwnProperty('fluid') === true ) {
        window.fluid.showGrowlNotification({
            title: title,
            description: message,
            priority: 1,
            sticky: false,
            identifier: 'nice_notify',
            icon: '/img/icon-hires.png'
        });
        if ( sound !== undefined ) { window.fluid.playSound(sound); }
    }
}
function buildRespondBar( post, is_convo ) {
    var my_id = readStorage('user_id');
    var css_r = ( post.you_reposted ) ? 'highlight' : 'plain';
    var css_s = ( post.you_starred ) ? 'highlight' : 'plain';
    var icn_s = ( post.you_starred ) ? 'fa-star' : 'fa-star-o';
    if ( is_convo !== true ) { is_convo = false; }

    var html =  '<div id="' + post.id + '-rsp[TL]" class="post-actions hide">' +
                    '<span onclick="doReply(' + post.id + ');"><i class="fa fa-reply-all"></i></span>';
    if ( post.user.id !== my_id ) {
        html += '<span id="' + post.id + '-repost[TL]" name="' + post.id + '-repost" onclick="doRepost(' + post.id + ');" class="' + css_r + '">' +
                    '<i class="fa fa-retweet"></i>' +
                '</span>';
    } else {
        html += '<span onclick="doDelete(' + post.id + ');"><i class="fa fa-trash"></i></span>';
    }
    html += '<span onclick="doShowConv(' + post.id + ');"><i class="fa fa-comments-o"></i></span>' +
            '<span id="' + post.id + '-star[TL]" name="' + post.id + '-star" onclick="doStar(' + post.id + ');" class="' + css_s + '">' +
                '<i class="fa ' + icn_s + '"></i>' +
            '</span>';
    if ( is_convo ) {
        var post_source = post.source.name || 'unknown';
        html += '<span onclick="muteClient(\'' + post_source + '\');"><i class="fa fa-microphone-slash"></i></span>';
    }
    html += '<span onclick="doMore(' + post.id + ');"><i class="fa fa-ellipsis-h"></i></span>' +
        '</div>';
    return html;
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
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("Authorization", "Bearer " + access_token);
                return true;
            }
        });
        $.ajax({
            url: window.apiURL + '/users',
            crossDomain: true,
            data: params,
            success: function( data ) { parseAccountNames( data.data ); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    }
}

function updateTimestamps() {
    if ( readStorage('absolute_times') === 'Y' ) { return false; }
    if ( readStorage('show_live_timestamps') === 'Y' ) {
        for ( chan_id in window.chans ) {
            var itms = document.getElementsByName( chan_id + "-time" );
            var tStr = humanized_time_span( window.chans[chan_id].created_at ),
                html = '';

            for ( var i = 0; i < itms.length; i++ ) {
                html = document.getElementById( itms[i].id ).innerHTML;
                if ( html != tStr ) { document.getElementById( itms[i].id ).innerHTML = tStr; } else { break; }
            }
        }

        for ( post_id in window.posts ) {
                var itms = document.getElementsByName( post_id + "-time" );
                var tStr = humanized_time_span( window.posts[post_id].created_at ),
                    html = '';
    
                for ( var i = 0; i < itms.length; i++ ) {
                    html = document.getElementById( itms[i].id ).innerHTML;
                    if ( html != tStr ) { document.getElementById( itms[i].id ).innerHTML = tStr; } else { break; }
                }
        }
    }
}
function collectRankSummary() {
    setSplashMessage('Collecting NiceRank Scores');
    var params = { nicerank: 0.1 };
    showHideActivity(true);

    $.ajax({
        url: window.niceURL + '/user/nicesummary',
        crossDomain: true,
        data: params,
        type: 'GET',
        success: function( data ) {
            if ( data.data ) {
                var ds = data.data;
                for ( var i = 0; i < ds.length; i++ ) {
                    setSplashMessage('Reading Scores (' + (i + 1) + '/' + ds.length + ')');
                    saveStorage( ds[i].user_id + '_rank', ds[i].rank, true );
                    saveStorage( ds[i].user_id + '_human', ds[i].is_human, true );
                }

                getTimeline();
                getMentions();
                getGlobalItems();
                showHideActivity(false);
                setSplashMessage('');
            }
        },
        error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
        dataType: "json"
    });
}
function doDelete( post_id ) {
    var access_token = readStorage('access_token');

    if ( access_token !== false ) {
        var params = { access_token: access_token };
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("Authorization", "Bearer " + access_token);
                return true;
            }
        });
        $.ajax({
            url: window.apiURL + '/posts/' + post_id,
            crossDomain: true,
            data: params,
            type: 'DELETE',
            success: function( data ) { if ( parseMeta(data.meta) ) { setDelete(post_id); } },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    }
}
function setDelete( post_id ) {
    var itms = document.getElementsByName( post_id );

    for ( var i = 0; i < itms.length; i++ ) {
        var elem = document.getElementById( itms[i].id );
        elem.parentNode.removeChild(elem);
    }
    window.posts[post_id] = false;
}
function doRepost( post_id ) {
    var access_token = readStorage('access_token');
    var action_type = ( window.posts[post_id].reposted ) ? 'DELETE' : 'POST';

    if ( access_token !== false ) {
        var params = { access_token: access_token };
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("Authorization", "Bearer " + access_token);
                return true;
            }
        });
        $.ajax({
            url: window.apiURL + '/posts/' + post_id + '/repost',
            crossDomain: true,
            data: params,
            type: action_type,
            success: function( data ) { if ( parseMeta(data.meta) ) { setRepost(post_id); } },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    } else {
        getAuthorisation();
    }
}
function setRepost( post_id ) {
    if ( post_id > 0 ) {
        var itms = document.getElementsByName( post_id + "-repost" );
        window.posts[post_id].reposted = !window.posts[post_id].reposted;

        for ( var i = 0; i < itms.length; i++ ) {
            if ( window.posts[post_id].reposted ) {
                toggleClassIfExists(itms[i].id,'plain','highlight');
            } else {
                toggleClassIfExists(itms[i].id,'highlight','plain');
            }
        }
    }
}
function doStar( post_id ) {
    var access_token = readStorage('access_token');
    var action_type = ( window.posts[post_id].starred ) ? 'DELETE' : 'POST';

    if ( access_token !== false ) {
        var params = { access_token: access_token };
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("Authorization", "Bearer " + access_token);
                return true;
            }
        });
        $.ajax({
            url: window.apiURL + '/posts/' + post_id + '/star',
            crossDomain: true,
            data: params,
            type: action_type,
            success: function( data ) { if ( parseMeta(data.meta) ) { setStar(post_id); } },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    } else {
        getAuthorisation();
    }
}
function setStar( post_id ) {
    if ( post_id > 0 ) {
        var itms = document.getElementsByName( post_id + "-star" );
        window.posts[post_id].starred = !window.posts[post_id].starred;

        for ( var i = 0; i < itms.length; i++ ) {
            if ( window.posts[post_id].starred ) {
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
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("Authorization", "Bearer " + access_token);
                return true;
            }
        });
        $.ajax({
            url: window.apiURL + '/users/' + user_id + '/follow',
            crossDomain: true,
            data: params,
            type: action_type,
            success: function( data ) { if ( parseMeta(data.meta) ) { setFollow(data.data); } },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
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
                html += '<button onclick="doFollow(' + data.id + ', true)" class="btn-red">Unfollow</button>';
            } else {
                if ( data.id !== my_id ) {
                    html += '<button onclick="doFollow(' + data.id + ', false)" class="btn-green">Follow</button>';
                } else {
                    html += '<span>I think this is you.</span>';
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
        var params = {
            access_token: access_token,
            include_annotations: 1,
            include_deleted: 0,
            include_muted: 1,
            include_html: 1,
            count: 200
        };
        $.ajax({
            url: window.apiURL + '/posts/' + post_id + '/replies',
            crossDomain: true,
            data: params,
            success: function( data ) { parseConversation( data.data, post_id ); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    } else {
        getAuthorisation();
    }
}
function parseConversation( data, post_id ) {
    if ( data ) {
        var respond = '',
            sname = '',
            html = '';
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

            if ( this_id === reply_to ) { sname = ' post-grey'; }
            html += '<div id="conv-' + data[i].id + '" class="post-item' + sname + '">' +
                        '<div id="' + data[i].id + '-po" class="post-avatar">' +
                            '<img class="avatar-round"' +
                                ' onClick="doShowUser(' + data[i].user.id + ');"' +
                                ' src="' + data[i].user.avatar_image.url + '">' +
                        '</div>' +
                        '<div id="' + data[i].id + '-dtl" class="post-content">' +
                            '<h5 class="post-name"><span>' + data[i].user.username + '</span></h5>' +
                            parseText( data[i] ) +
                            '<p class="post-time">' +
                                '<em onClick="showHideActions(' + data[i].id + ', \'-c\');">' + post_time + post_source + '</em>' +
                            '</p>' +
                        '</div>' +
                        respond.replaceAll('[TL]', '-c') +
                    '</div>';
            addPostItem( data[i].id, data[i].created_at, html, is_mention, followed, post_by, data[i].user.id,
                         post_mentions, post_reposted, post_starred, true, post_client );
        }
        document.getElementById( 'chat_posts' ).innerHTML = html;
        toggleClassIfExists('conversation','hide','show');
    }
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
        var tls = ['h', 'm', 'g', 'c', 'x'];
        var div = '';
        for ( var i = 0; i <= tls.length; i++ ) {
            div = '#' + post_id + '-rsp-' + tls[i];
            if ($(div).length) { toggleClassIfExists(post_id + '-rsp-' + tls[i],'show','hide'); }
        }
    } else {
        toggleClassIfExists(post_id + '-rsp' + tl,'hide','show',true);
    }
}
function showHideResponse() {
    if( $('#response').hasClass('hide') ) {
        toggleClass('response','hide','show');
        var reply_text = getReplyText(),
            draft_text = readStorage('draft');

        document.getElementById('rpy-draft').innerHTML = ( draft_text ) ? '<i class="fa fa-inbox"></i>' : '&nbsp;';
        document.getElementById('rpy-length').innerHTML = readStorage('post_length', true);
        document.getElementById('rpy-text').value = reply_text;
        document.getElementById('rpy-text').focus();
        if ( reply_text !== '' ) {
            var caret_pos = reply_text.indexOf("\n");
            if ( caret_pos < 1 ) { caret_pos = reply_text.length; }
            setCaretToPos(document.getElementById("rpy-text"), caret_pos);
        }
        calcReplyCharacters();

    } else {
        document.getElementById('rpy-title').value = '';
        toggleClassIfExists('autocomp','show','hide');
        removeClassIfExists('rpy-box', 'longpost');
        toggleClass('response','show','hide');        
        saveStorage('in_reply_to', '0', true);
    }
}
function getReplyText() {
    var _id = readStorage('in_reply_to', true);
    var txt = '';

    if ( _id > 0 ) {
        var my_name = readStorage('username');
        var suffix = '';
        if ( window.posts[_id].created_by != my_name ) { txt = '@' + window.posts[_id].created_by + ' '; }
        if ( window.posts[_id].mentions.length > 0 ) {
            for ( var i = 0; i < window.posts[_id].mentions.length; i++ ) {
                if ( window.posts[_id].mentions[i] !== my_name ) {
                    if ( suffix.indexOf('@' + window.posts[_id].mentions[i]) < 0 ) {
                        if ( suffix != '' ) { suffix += ' '; }
                        suffix += '@' + window.posts[_id].mentions[i];
                    }
                }
            }
        }
        if ( suffix !== '' ) { txt += "\n\n// " + suffix; }
    }

    return txt;
}
function switchLanguage( lang_cd ) { alert( '[Debug] Change Language To: ' + lang_cd ); }
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
    deleteStorage( 'access_token' );
    deleteStorage( 'username' );
    deleteStorage( 'user_id' );
    deleteStorage( 'name' );

    for ( i in window.timelines ) {
        window.timelines[i] = ( i === 'global' );
        saveStorage('tl_' + i, (( i === 'global' ) ? 'Y' : 'N'));
    }

    window.location = window.location.protocol + '//' + window.location.hostname;
}
function loadDraft() {
    var draft_text = readStorage('draft'),
        reply_to = parseInt(readStorage('draft_reply_to'));

    if ( draft_text ) {
        document.getElementById('rpy-draft').innerHTML = '&nbsp;';
        document.getElementById('rpy-text').value = draft_text;
        saveStorage('in_reply_to', reply_to, true);

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
                    if ( readStorage('hide_images') === 'N' ) {
                        if ( post.annotations[i].value.mime_type !== undefined && post.annotations[i].value.mime_type !== false ) {
                            switch ( post.annotations[i].value.mime_type ) {
                                case 'audio/mpeg':
                                case 'audio/mp4':
                                case 'audio/mp3':
                                    html += '<div id="' + post.id + '-audio-' + i + '" class="post-audio">' +
                                                '<audio controls>' +
                                                    '<source src="' + post.annotations[i].value.url + '"' +
                                                           ' type="' + post.annotations[i].value.mime_type + '">' +
                                                    'Your browser does not support the audio element.' +
                                                '</audio>' +
                                            '</div>';
                                    break;
                                
                                default:
                                    html += '<div id="' + post.id + '-img-' + i + '" class="post-image"' +
                                                ' style="background: url(\'' + post.annotations[i].value.url + '\');' +
                                                       ' background-size: cover; background-position: center center;"' +
                                                ' onclick="showImage(\'' + post.annotations[i].value.url + '\');">&nbsp;</div>';
                            }
                        } else {
                            html += '<div id="' + post.id + '-img-' + i + '" class="post-image"' +
                                        ' style="background: url(\'' + post.annotations[i].value.url + '\');' +
                                               ' background-size: cover; background-position: center center;"' +
                                        ' onclick="showImage(\'' + post.annotations[i].value.url + '\');">&nbsp;</div>';
                        }
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
                        var _vidid = post.annotations[i].value.link.replace('http://youtu.be/', '').replace('https://www.youtube.com/watch?v=', '').replace('https://m.youtube.com/watch?v=', '');
                        _vidid = _vidid.substring(0, _vidid.indexOf('&') != -1 ? _vidid.indexOf('&') : _vidid.length);
    
                        if ( post.annotations[i].value.track || false ) {
                            if ( _innerHTML != '' ) { _innerHTML += ' - '; }
                            _innerHTML += post.annotations[i].value.track;
                        }
                        html += '<div id="' + post.id + '-vid-' + i + '" class="post-video">' +
                                    '<a href="' + post.annotations[i].value.link + '" title="' + _innerHTML + '" target="_blank">' +
                                        '<img src="https://img.youtube.com/vi/' + _vidid + '/0.jpg" />' +
                                    '</a>' +
                                '</div>';
                    }
                    break;

                default:
                    /* Do Nothing (Other Types Not Yet Supported) */
            }
        }
    }
    return html;
}
function clearTimelines() {
    window.posts = {};
    window.chans = {};
    showTimelines();
}
function getPMSummary( before_id ) {
    var access_token = readStorage('access_token');
    before_id = ( before_id === undefined || before_id === NaN ) ? 0 : before_id;
    if ( access_token !== false ) {
        var params = {
            access_token: access_token,
            include_message_annotations: 1,
            include_recent_message: 1,
            include_annotations: 1,
            include_inactive: 1,
            include_marker: 1,
            include_read: 1,
            channel_types: 'net.app.core.pm',
            count: 100
        };
        if ( before_id > 0 ) { params.before_id = before_id; }
        $.ajax({
            url: window.apiURL + '/channels',
            crossDomain: true,
            data: params,
            success: function( data ) { parsePMResults( data.meta, data.data ); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    }
}
function parsePMResults( meta, data ) {
    if ( meta ) {
        if ( meta.code === 200 ) {
            parsePMData(data);
            if ( meta.more === true ) { getPMSummary(meta.min_id); }
        } else {
            alert("Uh Oh. We've Got a [" + meta.code + "] from App.Net");
        }
    }
}
function parsePMData( data ) {
    if ( data ) {
        var html = '';
        var show_time = readStorage('show_live_timestamps');
        var post_mentions = [],
            post_time = '',
            post_type = '',
            post_by = '';
        var participants = 0;
        var my_id = readStorage('user_id');
        var _ids = [];
        for ( var i = 0; i < data.length; i++ ) {
            post_type = data[i].type;
            post_mentions = [];
            participants = [];

            if ( data[i].recent_message.entities.hasOwnProperty('mentions') ) {
                if ( data[i].recent_message.entities.mentions.length > 0 ) {
                    for ( var idx = 0; idx < data[i].recent_message.entities.mentions.length; idx++ ) {
                        post_mentions.push( data[i].recent_message.entities.mentions[idx].name );
                    }
                }
            }
            if ( data[i].hasOwnProperty('owner') ) {
                participants.push( data[i].owner.id );
                if ( _ids.indexOf(data[i].owner.id) === -1 ) { _ids.push(data[i].owner.id); }
            }
            if ( data[i].hasOwnProperty('writers') ) {
                if ( data[i].writers.user_ids.length > 0 ) {
                    for ( var idx = 0; idx < data[i].writers.user_ids.length; idx++ ) {
                        participants.push( data[i].writers.user_ids[idx] );
                        if ( _ids.indexOf(data[i].writers.user_ids[idx]) === -1 ) { _ids.push(data[i].writers.user_ids[idx]); }
                    }
                }
            }

            if ( data[i].recent_message.hasOwnProperty('user') === true ) {
                post_time = humanized_time_span(data[i].recent_message.created_at);
                html =  '<div id="' + data[i].id + '[TL]" name="' + data[i].id + '" class="post-item">' +
                            '<div id="' + data[i].id + '-po" class="post-avatar">' +
                                '<img class="avatar-round"' +
                                    ' onClick="doShowUser(' + data[i].recent_message.user.id + ');"' +
                                    ' src="' + data[i].recent_message.user.avatar_image.url + '">' +
                            '</div>' +
                            '<div id="' + data[i].id + '-dtl" class="post-content">' +
                                '<h5 class="post-name" style="cursor: pointer;" onClick="doShowChan(' + data[i].id + ');">' +
                                    '<span id="' + data[i].id + '-ni">[NAME_INFO] (' + data[i].counts.messages + ' Messages)</span>' +
                                '</h5>' +
                                parseRecentText( data[i] ) +
                                '<p class="post-time">' +
                                    '<em id="' + data[i].id + '-time[TL]" name="' + data[i].id + '-time"' +
                                         ' onClick="doShowChan(' + data[i].id + ');">' + post_time + '</em>' +
                                '</p>' +
                            '</div>' +
                        '</div>';
                addChanItem( data[i].id, post_type, data[i].recent_message.created_at, html, participants );
            }
        }
        if ( _ids.length > 0 ) { getAccountNames( _ids ); }
    }
}
function addChanItem( chan_id, chan_type, created_at, html, participants ) {
    if ( !window.chans.hasOwnProperty( chan_id ) ) {
        window.chans[chan_id] = { chan_id: chan_id,
                                  chan_type: chan_type,
                                  created_at: created_at,
                                  updated_at: new Date(created_at),
                                  html: html,
                                  user_ids: participants,
                                  is_new: true
                                 }
    }
}
function sortPMList() {
    var sort_list = function (date1, date2) {
        if (date1 > date2) return 1;
        if (date1 < date2) return -1;
        return 0;
    };
    var rVal = [];
    for ( chan_id in window.chans ) {
        if ( window.chans[chan_id] !== false ) { if ( window.chans[chan_id].is_new === true ) { rVal.push(window.chans[chan_id].updated_at); } }
    }
    return rVal.sort(sort_list);
}
function parseRecentText( post ) {
    var html = post.recent_message.html + ' ',
        name = '',
        cStr = ' style="font-weight: bold; cursor: pointer;"';

    // Let's see if There Is Anything Here
    if ( post.recent_message.entities.mentions.length > 0 ) {
        for ( var i = 0; i < post.recent_message.entities.mentions.length; i++ ) {
            name = '>@' + post.recent_message.entities.mentions[i].name + '<';
            html = html.ireplaceAll(name, cStr + ' onClick="doShowUser(' + post.recent_message.entities.mentions[i].id + ');"' + name);
        }
    }

    if ( post.recent_message.entities.hashtags.length > 0 ) {
        for ( var i = 0; i < post.recent_message.entities.hashtags.length; i++ ) {
            name = '>#' + post.recent_message.entities.hashtags[i].name + '<';
            html = html.ireplaceAll(name, cStr + ' onClick="doShowHash(\'' + post.recent_message.entities.hashtags[i].name + '\');"' + name);
        }
    }

    return html;
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

    if ( access_token !== false ) {
        showWaitState('hash_posts', 'Accessing App.Net');
        var params = {
            access_token: access_token,
            include_annotations: 1,
            include_html: 1,
            hashtags: name,
            count: 200            
        };        
        $.ajax({
            url: window.apiURL + '/posts/search',
            crossDomain: true,
            data: params,
            success: function( data ) { parseHashDetails( data.data, name ); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    } else {
        getAuthorisation();
    }
}
function parseHashDetails( data, name ) {
    if ( data ) {
        var respond = '',
            html = '';
        var is_mention = false,
            followed = false;
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
        document.getElementById('mute_hash').innerHTML = '<button onclick="doMuteHash(\'' + name + '\');">Mute #' + name + '</button>';
        for ( var i = 0; i < data.length; i++ ) {
            showWaitState('hash_posts', 'Reading Posts (' + (i + 1) + '/' + data.length + ')');
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
            addPostItem( data[i].id, data[i].created_at, html, is_mention, followed, post_by, data[i].user.id,
                         post_mentions, post_reposted, post_starred, true, post_client );
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
    if ( max_length === NaN || max_length === undefined ) { max_length = max_default; }
    var rpy_length = (max_length - txt_length);
    document.getElementById('rpy-length').innerHTML = addCommas(rpy_length);

    if ( rpy_length >= 0 && rpy_length <= max_length ) {
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
        saveStorage( 'draft_reply_to', readStorage('in_reply_to', true) )
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
    [].forEach.call(document.getElementById("chat_posts").children, function(element) {
        removeClass(element.id, 'post-grey');
    });
    addClass('conv-' + first_id,'post-grey');
    addClass('conv-' + reply_id,'post-grey');
    $("#chat_posts").scrollTo('#conv-' + first_id, 2000);
}
function doHandyTextSwitch() {
    var el = document.getElementById('rpy-text');
    var caret_pos = getCaretPos(el);
    var orig_text = el.value;
    var new_text = orig_text.replaceAll('...', '…', '');

    if ( orig_text !== new_text ) {
        el.value = new_text;
        setCaretToPos(document.getElementById('rpy-text'), (caret_pos - 2));
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
            saveStorage('msgTitle', 'Geolocation Problem', true);
            switch ( error.code ) {
                case 1:
                    saveStorage('msgText', 'Uh oh. Nice Is Not Permitted to Access Your Location Data', true);
                    break;

                case 3:
                    saveStorage('msgText', 'Very sorry. Nice Cannot Add Your Location. The Geolocation API Timed Out.', true);
                    break;

                default:
                    saveStorage('msgText', 'Whoops! Nice Cannot Determine Your Location', true);
            }
            if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
            setSplashMessage('');
        },
        { maximumAge: 600000, timeout: 10000 });
    } else {
        saveStorage('msgTitle', 'Geolocation Problem', true);
        saveStorage('msgText', 'Very sorry. The Geolocation API Is Not Supported By Your Browser', true);
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
function parseFileUpload( response, file ) {
    var access_token = readStorage('access_token');
    if ( access_token === undefined || access_token === false || access_token === '' ) { return false; }

    var rslt = jQuery.parseJSON( response );
    var meta = rslt.meta;
    var showMsg = false;
    switch ( meta.code ) {
        case 400:
        case 507:
            saveStorage('msgText', 'App.Net Returned a ' + meta.code + ' Error:<br>' + meta.error_message, true);
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
                    if ( progress > 0 && progress <= 99.9 ) {
                        setSplashMessage('Uploading ... ' + progress + '% Complete');
                    } else {
                        setSplashMessage('');
                    }
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
                            saveStorage('msgText', 'App.Net Returned a ' + meta.code + ' Error:<br>' + meta.error_message, true);
                            showMsg = true;
                            break;

                        default:
                            /* Do Nothing */
                    }
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
            { ceiling: 60, text: "Less than a minute ago" },
            { ceiling: 3600, text: "$minutes minutes ago" },
            { ceiling: 86400, text: "$hours hours ago" },
            { ceiling: 2629744, text: "$days days ago" },
            { ceiling: 31556926, text: "$months months ago" },
            { ceiling: null, text: "$years years ago" }
        ],
        future: [
            { ceiling: 60, text: "Less than a minute ago" },
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
        for(var i in breakdown) {
            if (breakdown[i] == 1) {
                var regexp = new RegExp("\\b"+i+"\\b");
                time_ago_text = time_ago_text.replace(regexp, function() {
                    return arguments[0].replace(/s\b/g, '');
                });
            }
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

    saveStorage('msgTitle', 'Muted #' + name, true);
    saveStorage('msgText', 'Posts with a hashtag of "' + name + '" will now be muted.', true);
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
function isMutedClient( name ) {
    var clients = readMutedClients();
    if ( name === undefined || name === '' ) { return false; }
    var name = name.trim();

    for ( var idx = 0; idx <= clients.length; idx++ ) { if ( clients[idx] === name ) { return true; } }
    return false;    
}
function muteAccount( ismuted, account_id ) {
    var access_token = readStorage('access_token');
    var action_type = ( ismuted ) ? 'DELETE' : 'POST';

    if ( access_token !== false ) {
        var params = { access_token: access_token };
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("Authorization", "Bearer " + access_token);
                return true;
            }
        });
        $.ajax({
            url: window.apiURL + '/users/' + account_id + '/mute',
            crossDomain: true,
            data: params,
            type: action_type,
            success: function( data ) {
                if ( parseMeta(data.meta) ) {
                    var ds = data.data; 
                    showHidePostsFromAccount(ds.id, ds.you_muted);
                    saveStorage('msgTitle', 'Done and Done', true);
                    saveStorage('msgText', ((ds.you_muted) ? "You won't see any more posts from " + ds.username + "."
                                                           : "You'll start seeing posts from " + ds.username + " again."), true);
                    if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
                    showHideDialog();
                }
            },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    } else {
        getAuthorisation();
    }
}
function blockAccount( isblocked, account_id ) {
    var access_token = readStorage('access_token');
    var action_type = ( isblocked ) ? 'DELETE' : 'POST';

    if ( access_token !== false ) {
        var params = { access_token: access_token };
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("Authorization", "Bearer " + access_token);
                return true;
            }
        });
        $.ajax({
            url: window.apiURL + '/users/' + account_id + '/block',
            crossDomain: true,
            data: params,
            type: action_type,
            success: function( data ) {
                if ( parseMeta(data.meta) ) {
                    var ds = data.data; 
                    showHidePostsFromAccount(ds.id, ds.you_blocked);
                    saveStorage('msgTitle', 'Done and Done', true);
                    saveStorage('msgText', ((ds.you_blocked) ? "You won't see any more posts from " + ds.username + "."
                                                             : "You've successfully unblocked " + ds.username + "."), true);
                    if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
                    showHideDialog();
                }
            },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    } else {
        getAuthorisation();
    }
}
function reportAccount( account_id ) {
    var params = { 'account_id': account_id,
                   'report_by': readStorage('user_id')
                  };
    $.ajax({
        url: window.niceURL + '/user/report',
        crossDomain: true,
        data: params,
        type: 'GET',
        success: function( data ) { parseReport( data, account_id ); },
        error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
        dataType: "json"
    });
}
function parseReport( data, account_id ) {
    if ( data.data ) {
        var ds = data.data;
        if ( ds.id > 0 ) {
            showHidePostsFromAccount( account_id, false );
            saveStorage( account_id + '_rank', 0.1, true );
            saveStorage( account_id + '_human', 'N', true );
            saveStorage('msgTitle', 'Reported Account', true);
            saveStorage('msgText', 'Thank You For Making ADN A Little Bit Better!', true);
        } else {
            saveStorage('msgTitle', 'Whoops', true);
            saveStorage('msgText', 'There Was a Problem When Reporting This Account', true);
        }
        if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
    }
    showHideDialog();
}
function showHidePostsFromAccount( account_id, hide ) {
    for ( idx in window.posts ) {
        if ( window.posts[idx].account_id === account_id.toString() ) {
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
    jss.set('.chatbox div#mute_hash.title_btn', { 'background-color': '#' + readStorage('header_background') });
    jss.set('.chatbox div#mute_hash.title_btn', { 'color': '#' + readStorage('header_color') });
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
    if ( px === 0 ) { px = '0'; }
    saveStorage('scrollbar_adjust', px);
    setWindowConstraints();
}
function showUserList( type, account_id ) {
    var access_token = readStorage('access_token');

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
        $.ajax({
            url: window.apiURL + '/users/' + account_id + '/' + type,
            crossDomain: true,
            data: params,
            type: 'GET',
            success: function( data ) { parseUserList( data ); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    }
}
function parseUserList( resp ) {
    var data = resp.data;
    if ( data ) {
        var _html = '',
            _id = 'usr-0';
        for ( var i = 0; i < data.length; i++ ) {
            _html = '<img src="' + data[i].avatar_image.url + '" alt="' + data[i].username + '" onclick="doShowUser(' + data[i].id + ');" />' +
                    '<strong onclick="doShowUser(' + data[i].id + ');">' +
                        data[i].username +
                        ( (data[i].name !== '') ? ' <em>(' + data[i].name  + ')</em>' : '' ) +
                    '</strong>' +
                    '<div class="buttons">' +
                        ( (data[i].follows_you === true) ? '<em>Follows You</em>' : '') +
                        '<button id="btn-follow-' + data[i].id + '" class="btn ' + ( (data[i].you_follow === true) ? 'btn-red' : 'btn-green') + '"' +
                               ' onclick="doFollow(' + data[i].id + ',' + data[i].you_follow + ');">' +
                            ( (data[i].you_follow === true) ? 'Unfollow' : 'Follow') +
                        '</button>' +
                    '</div>' +
                    '<div id="more-' + data[i].id + '" class="user-detail">' +
                        '<p>' + data[i].timezone + '</p>' +
                        '<p>' + ((data[i].description === undefined) ? '&nbsp;' : data[i].description.text) + '</p>' +
                    '</div>';
            document.getElementById('user_posts').insertBefore( buildGenericNode( 'usr-' + data[i].id, data[i].id, 'user-item', _html ),
                                                                                  document.getElementById(_id) );
        }
    }
    setSplashMessage('');
}
function buildGenericNode( elID, elName, elClass, html ) {
    var elem = document.createElement("div");
    elem.setAttribute('id', elID);
    elem.setAttribute('name', elName);
    elem.setAttribute('class', elClass);
    elem.innerHTML = html;

    return elem;
}