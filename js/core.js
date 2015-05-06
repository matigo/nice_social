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
    var isGood = readData('isGood');
    if ( isGood === 'Y' ) { showHideResponse(); } else { getAuthorisation(); }
}
function doReply( post_id ) {
    var _id = parseInt(post_id);
    if ( _id > 0 ) { saveData('in_reply_to', _id); }
    doPostOrAuth();
}
function testADNAccessToken() {
    var params = new Object();
    params['access_token'] = readStorage('access_token');
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
        saveData('chan_length', 2048);
        saveData('post_length', 256);
        saveData('isGood', 'Y');

        saveStorage('username', data.username);
        saveStorage('locale', data.locale);
        saveStorage('user_id', data.id);
        saveStorage('name', data.name);

        if ( readStorage('tl_home') === 'N' && readStorage('tl_mentions') === 'N' ) {
            window.timelines.mentions = true;
            saveStorage('tl_mentions', 'Y');
            window.timelines.home = true;
            saveStorage('tl_home', 'Y');
        }
        showTimelines();
    }
}
function getAuthorisation() {
    var params = { client_id: window.apiToken,
                   response_type: 'token',
                   redirect_uri: window.redirect,
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
    if ( !readStorage('show_live_timestamps') ) { saveStorage( 'show_live_timestamps', 'Y' ); }
    if ( !readStorage('refresh_rate') ) { saveStorage('refresh_rate', 15); }
    if ( !readStorage('max_post_age') ) { saveStorage('max_post_age', 4); }
    if ( !readStorage('global_show') ) { saveStorage('global_show', 'e'); }
    if ( !readStorage('hide_images') ) { saveStorage('hide_images', 'N'); }
    if ( !readStorage('font_size') ) { saveStorage('font_size', 14); }
    if ( !readData('post_length') ) { saveData('post_length', 256); }
    if ( !readData('min_rank') ) { saveData('min_rank', 2.1); }
    if ( !readData('limit') ) { saveData('limit', 500); }
    if ( !readData('since') ) { saveData('since', 0); }

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
    var nav_text = document.getElementById("show_live").innerHTML,
        chk_icon = ' <i class="fa fa-check"></i>';
    nav_text = nav_text.replace(chk_icon, '');
    if ( readStorage('show_live_timestamps') === 'Y' ) { nav_text += chk_icon; }
    document.getElementById("show_live").innerHTML = nav_text;
    setRefreshInterval( readStorage('refresh_rate') );
    setHideImages( readStorage('hide_images') );
    setGlobalShow( readStorage('global_show') );
    setFontSize( readStorage('font_size') );

    var token = getADNAccessToken();
    if ( token !== false ) { testADNAccessToken(); } else { window.activate = true; }
    return true;
}
function sendPost() {
    var max_length = parseInt( readData('post_length') ),
        rpy_length = getReplyCharCount();
    var reply_to = parseInt(readData('in_reply_to'));

    if ( rpy_length > 0 && rpy_length <= max_length ) {
        writePost( document.getElementById('rpy-text').value.trim(), reply_to );
    } else {
        if ( rpy_length === 0 ) {
            saveData('msgTitle', 'Umm ...');
            saveData('msgText', 'There Doesn&apos;t Seem To Be a Message. Please Write at Least One Character.');
        } else {
            saveData('msgTitle', 'Post Too Long');
            saveData('msgText', 'This Post Is a Bit Too Long. Please Keep It Within 256 Characters.');
        }
        if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
    }
}
function writePost( text, in_reply_to ) {
    var access_token = readStorage('access_token');
    saveData('in_reply_to', '0');

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
                    var dArr = [data.data];
                    parseItems(dArr);
                    showHideResponse();
                    if ( parseInt(in_reply_to) > 0 ) { showHideActions( in_reply_to, '*' ); }
                }
            },
            error: function (xhr, ajaxOptions, thrownError){
                saveData('msgTitle', 'Post Error');
                if ( xhr.status > 0 ) {
                    saveData('msgText', 'App.Net Returned a ' + xhr.status + ' Error (' + thrownError + ').<br>' +
                                        'Please let @matigo know if this problem persists more than a few minutes.');
                } else {
                    saveData('msgText', 'There Was a Problem Sending Your Post to ADN.');
                }
                if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
            },
            dataType: "json"
        });
    }
}
function buildJSONPost( text, in_reply_to ) {
    var access_token = readStorage('access_token');
    var rVal = false;

    if ( access_token !== false ) {
        var params = new Object();
        params['access_token'] = access_token;
        params['include_post_annoations'] = 1;
        params['text'] = text;
        params['entities'] = new Object();
        params['entities']['parse_markdown_links'] = true;
        params['entities']['parse_links'] = true;
        if ( parseInt(in_reply_to) > 0 ) { params['reply_to'] = in_reply_to; }
        rVal = JSON.stringify(params);
    }
    return rVal;
}
function getUserProfile( user_id ) {
    if ( parseInt(user_id) <= 0 ) { return false; }
    var access_token = readStorage('access_token');
    var params = new Object();
    params['include_deleted'] = 0;
    params['include_machine'] = 0;
    params['include_muted'] = 1;
    params['include_html'] = 1;
    params['count'] = 20;
    if ( access_token !== false ) { params['access_token'] = access_token; }
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
function parseUserProfile( data ) {
    if ( data ) {
        var html = '',
            action_html = '',
            post_source = '';
        var my_id = readStorage('user_id');

        // Set the Header Information
        document.getElementById( 'usr-banner' ).style.backgroundImage = 'url("' + data[0].user.cover_image.url + '")';
        document.getElementById( 'usr-avatar' ).innerHTML = '<img class="avatar-square" src="' + data[0].user.avatar_image.url + '">';
        document.getElementById( 'usr-names' ).innerHTML = '<h3>' + data[0].user.username + '</h3>' +
                                                           '<h4>' + data[0].user.name + '</h4>';
        document.getElementById( 'usr-info' ).innerHTML = ( data[0].user.hasOwnProperty('description') ) ? data[0].user.description.html : '';
        document.getElementById( 'usr-followers' ).innerHTML = addCommas( data[0].user.counts.followers );
        document.getElementById( 'usr-following' ).innerHTML = addCommas( data[0].user.counts.following );
        document.getElementById( 'usr-posts' ).innerHTML = addCommas( data[0].user.counts.posts );

        if ( data[0].user.follows_you ) { action_html += '<em>Follows You</em>'; }
        if ( data[0].user.you_follow ) {
            action_html += '<button onclick="doFollow(' + data[0].user.id + ', true)" class="btn-red">Unfollow</button>';
        } else {
            if ( data[0].user.id !== my_id ) {
                action_html += '<button onclick="doFollow(' + data[0].user.id + ', false)" class="btn-green">Follow</button>';
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
                                '<em id="' + data[i].id + '-time[TL]" name="' + data[i].id + '-time"' +
                                     ' onClick="showConversation(' + data[i].id + ');">' +
                                    humanized_time_span(data[i].created_at) + post_source +
                                '</em>' +
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
        setSplashMessage('Getting Your Timeline');
        var params = new Object();
        params['include_directed_posts'] = 1;
        params['include_annotations'] = 1;
        params['include_deleted'] = 0;
        params['include_machine'] = 0;
        params['access_token'] = access_token;
        params['include_html'] = 1;
        params['count'] = 200;

        $.ajax({
            url: window.apiURL + '/posts/stream',
            crossDomain: true,
            data: params,
            type: 'GET',
            success: function( data ) { parseItems( data.data ); saveData('home_done', 'Y'); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    }
}
function getMentions() {
    var access_token = readStorage('access_token');
    
    if ( access_token !== false ) {
        setSplashMessage('Getting Your Mentions');
        var params = new Object();
        params['include_annotations'] = 1;
        params['include_deleted'] = 0;
        params['include_machine'] = 0;
        params['access_token'] = access_token;
        params['include_html'] = 1;
        params['count'] = 50;
    
        $.ajax({
            url: window.apiURL + '/users/me/mentions',
            crossDomain: true,
            data: params,
            type: 'GET',
            success: function( data ) { parseItems( data.data ); saveData('ment_done', 'Y'); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    }
}
function canRefreshGlobal() {
    var rrate = parseInt(readStorage('refresh_rate')),
        rsecs = parseInt(readData('refresh_secs'));
    var rVal = false;
    if ( rsecs === undefined || isNaN(rsecs) ) { rsecs = 0; }
    rsecs++;
    if ( rsecs >= rrate ) { rsecs = '0'; rVal = true; }
    saveData('refresh_secs', rsecs);
    return rVal;
}
function getGlobalRecents( since_id ) {
    if ( since_id === undefined || isNaN(since_id) ) { since_id = 0; }
    var recents = parseInt(readData('recents'));
    if ( recents === undefined || isNaN(recents) ) { recents = 0; }
    saveData('recents', (recents + 1) );
    if ( recents >= 15 ) { return false; }

    var access_token = readStorage('access_token');
    var params = new Object();
    params['include_annotations'] = 1;
    params['include_deleted'] = 0;
    params['include_machine'] = 0;
    params['include_html'] = 1;
    params['count'] = 200;

    if ( access_token !== false ) { params['access_token'] = access_token; }
    if ( since_id > 0 ) { params['before_id'] = since_id; }
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
    if ( readData('adn_action') === 'Y' ) { return false; }

    var access_token = readStorage('access_token');
    var params = new Object();
    params['include_annotations'] = 1;
    params['include_deleted'] = 0;
    params['include_machine'] = 0;
    params['include_html'] = 1;
    params['since_id'] = readData( 'since' );
    params['count'] = 200;
    if ( access_token !== false ) { params['access_token'] = access_token; }
    saveData('adn_action', 'Y');
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
        saveData('adn_action', 'N');

        var avatarClass = '',
            html = '';
        var is_mention = false,
            followed = false;
        var account_rank = 0,
            account_age = 999,
            show_time = readStorage('show_live_timestamps'),
            min_rank = parseInt( readData('min_rank') );
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
            account_rank = parseInt( readData( data[i].user.id + '_rank' ) );
            is_human = readData( data[i].user.id + '_human' );
            saveData( 'since', data[i].id );
            write_post = true;

            if ( (account_rank >= min_rank && is_human == 'Y') || (data[i].user.id === my_id) || followed ) {
                account_age = Math.floor(( new Date() - Date.parse(data[i].user.created_at) ) / 86400000);
                post_by = data[i].user.username;
                post_reposted = data[i].you_reposted || false;
                post_starred = data[i].you_starred || false;
                post_mentions = [];

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

                avatarClass = 'avatar-round';
                is_mention = isMention( data[i] );
                post_client = data[i].source.name || 'unknown';
                if ( account_age <= 7 ) { avatarClass = 'avatar-round recent-acct'; }
                if ( account_age <= 1 ) { avatarClass = 'avatar-round new-acct'; }
                if ( is_mention ) { avatarClass = 'avatar-round mention'; }
                post_time = ( show_time === 'Y' ) ? humanized_time_span(data[i].created_at) : '<em>more...</em>';
                html =  '<div id="' + data[i].id + '[TL]" name="' + data[i].id + '" class="post-item">' +
                            '<div id="' + data[i].id + '-po" class="post-avatar">' +
                                '<img class="' + avatarClass + '"' +
                                    ' onClick="doShowUser(' + data[i].user.id + ');"' +
                                    ' src="' + data[i].user.avatar_image.url + '">' +
                            '</div>' +
                            '<div id="' + data[i].id + '-dtl" class="post-content" onClick="showHideActions(' + data[i].id + ', \'[TL]\');">' +
                                '<h5 class="post-name"><span>' + data[i].user.username + '</span></h5>' +
                                parseText( data[i] ) +
                                '<p class="post-time">' +
                                    '<em id="' + data[i].id + '-time[TL]" name="' + data[i].id + '-time">' + post_time + '</em>' +
                                '</p>' +
                            '</div>' +
                            buildRespondBar( data[i] ) +
                            parseEmbedded( data[i] ) +
                        '</div>';
                if ( write_post ) {
                    addPostItem( data[i].id, data[i].created_at, html, is_mention, followed, post_by,
                                 post_mentions, post_reposted, post_starred, false, post_client );
                }
            }
        }
        showHideActivity(false);
        trimPosts();
    }
}
function addPostItem( post_id, created_at, html, is_mention, followed, post_by, post_mentions, post_reposted, post_starred, is_convo, client_name ) {
    if ( !window.posts.hasOwnProperty( post_id ) ) {
        window.posts[post_id] = { post_id: post_id,
                                  is_new: false,
                                  created_at: created_at,
                                  created_by: post_by,
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
        cStr = ' style="color: #333; font-weight: bold; cursor: pointer;"';
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
    document.getElementById('tl-space').innerHTML = '';
    setSplashMessage('Preparing Timelines');

    /* Set the Menu Checkboxes */
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) {
            var nav_text = document.getElementById("list-" + i).innerHTML,
                chk_icon = ' <i class="fa fa-check"></i>';
            nav_text = nav_text.replace(chk_icon, '');
            if ( window.timelines[i] ) { nav_text += chk_icon; }
            document.getElementById("list-" + i).innerHTML = nav_text;
        }
    }

    setSplashMessage('Reading Posts List');
    for (i in window.timelines) {
        if ( window.timelines.hasOwnProperty(i) ) {
            if ( window.timelines[i] === true ) {
                $('#tl-space').append( '<div id="' + i + '" class="post-list tl-' + i + '" style="overflow-x: hidden;"></div>' );
            }
        }
    }
    setWindowConstraints();
    if ( Object.keys(window.chans).length > 0 ) {
        for ( chan_id in window.chans ) { window.chans[chan_id].is_new = true; }
    }
}
function showMutedPost( post_id, tl ) {
    $('#' + post_id + tl ).replaceWith( window.posts[post_id].html.replaceAll('[TL]', tl, '') );
}
function redrawList() {
    var buffer = '<div class="post-item" style="border: 0; min-height: 75px;"></div>';
    var global_showall = ( readStorage('global_show') === 'e' ) ? true : false;
    if ( window.activate === false ) {
        var _home = readData('home_done'),
            _ment = readData('ment_done');

        if ( _home === 'Y' && _ment === 'Y' ) {
            window.activate = true;
            setSplashMessage('');
        }
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
    var last_ids = { home: 0,
                     mentions: 0,
                     global: 0
                    };
    var html_txt = { home: '',
                     mentions: '',
                     global: ''
                    };

    for ( post_id in window.posts ) {
        if ( window.posts[post_id] !== false ) {
            if ( isMutedClient(window.posts[post_id].client) ) {
                postText = '<div id="' + post_id + '[TL]" name="' + post_id + '" class="post-item"' +
                               ' onClick="showMutedPost(' + post_id + ', \'[TL]\');">' +
                               '@' + window.posts[post_id].created_by + ' - ' + 'Muted Client (' + window.posts[post_id].client + ')' +
                           '</div>';
            } else {
                postText = window.posts[post_id].html;
            }

            if ( window.posts[post_id].is_conversation === false ) {
                if ( window.timelines.home ) {
                    if ( $('#' + post_id + '-h').length === 0 ) {
                        if ( window.posts[post_id].is_mention || window.posts[post_id].followed ) {
                            if ( document.getElementById('home').innerHTML === '' ) {
                                if ( html_txt.home === '' ) { html_txt.home = buffer; }
                                html_txt.home = (postText.replaceAll('[TL]', '-h', '')) + html_txt.home;
                            } else {
                                if ( last_ids.home > 0 ) { $( postText.replaceAll('[TL]', '-h', '') ).insertBefore( '#' + last_ids.home + '-h' ); }
                            }
                            last_ids.home = post_id;
                        }
                    } else { last_ids.home = post_id; }
                }
    
                if ( window.timelines.mentions ) {
                    if ( $('#' + post_id + '-m').length === 0 ) {
                        if ( window.posts[post_id].is_mention ) {
                            if ( document.getElementById('mentions').innerHTML === '' ) {
                                if ( html_txt.mentions === '' ) { html_txt.mentions = buffer; }
                                html_txt.mentions = (postText.replaceAll('[TL]', '-m', '')) + html_txt.mentions;
                            } else {
                                if ( last_ids.mentions > 0 ) {
                                    $( postText.replaceAll('[TL]', '-m', '') ).insertBefore( '#' + last_ids.mentions + '-m' );
                                }
                            }
                            last_ids.mentions = post_id;
                        }
                    } else { last_ids.mentions = post_id;}
                }
    
                if ( window.timelines.global ) {
                    if ( $('#' + post_id + '-g').length === 0 ) {
                        if ( global_showall || window.posts[post_id].followed === false ) {
                            if ( document.getElementById('global').innerHTML === '' ) {
                                if ( html_txt.global === '' ) { html_txt.global = buffer; }
                                html_txt.global = (postText.replaceAll('[TL]', '-g', '')) + html_txt.global;
                            } else {
                                if ( last_ids.global > 0 ) { $( postText.replaceAll('[TL]', '-g', '') ).insertBefore( '#' + last_ids.global + '-g' ); }
                            }
                            last_ids.global = post_id;
                        }
                    } else { last_ids.global = post_id; }
                }
            }
        }
    }

    // Write the HTML If Necessary
    for ( tline in html_txt ) { if ( html_txt[tline] !== '' ) { document.getElementById(tline).innerHTML = html_txt[tline]; } }
    setWindowConstraints();
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
    sBar = scrollbarWidth( cWidth );
    if ( sBar > 0 && sBar <= 40 ) {
        sBar = Math.floor(sBar / vCols) + 1;
        cWidth = cWidth - sBar;
    }
    if ( sBar === 0 ) { cWidth = cWidth - vCols - pAdj; }
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
    css_style += (cCount === 1) ? ' max-width: 480px;' : ' max-width: ' + (100 / cCount) + '%;';
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

function setGlobalShow( type ) {
    var options = ['e', 'n'];
    var show_type = ( type === 'n' ) ? 'n' : 'e';
    saveStorage('global_show', show_type);

    /* Set the Menu Checkboxes */
    for ( var i = 0; i < options.length; i++ ) {
        var nav_text = document.getElementById("gshow-" + options[i]).innerHTML,
            chk_icon = ' <i class="fa fa-check"></i>';
        nav_text = nav_text.replace(chk_icon, '');
        if ( options[i] === show_type ) { nav_text += chk_icon; }
        document.getElementById("gshow-" + options[i]).innerHTML = nav_text;
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
                            '<div id="usr-names" class="names"><h3>&nbsp;</h3><h4>&nbsp;</h4></div>' +
                        '</div>' +
                        '<div id="usr-info" class="info">&nbsp;</div>' +
                        '<div id="usr-actions" class="actions"><button>Follow</button></div>' +
                        '<div class="numbers">' +
                            '<div class="detail" style="border-right: 1px solid #ccc;"><strong>Posts</strong><p id="usr-posts">&nbsp;</p></div>' +
                            '<div class="detail" style="border-right: 1px solid #ccc;"><strong>Following</strong><p id="usr-following">&nbsp;</p></div>' +
                            '<div class="detail"><strong>Followers</strong><p id="usr-followers">&nbsp;</p></div>' +
                        '</div>' +
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
                        '<div class="title">' +
                            'Hashtag View <em id="hash_count">&nbsp;</em>' +
                            '<span onclick="doShowHash();"><i class="fa fa-times-circle-o"></i></span>' +
                        '</div>' +
                        '<div id="mute_hash" class="title_btn"><button onclick="doMuteHash(\'hashtag\');">Mute Hashtag</button></div>' +
                        '<div id="hash_posts" class="chat"></div>' +
                    '</div>';
            break;

        case 'okbox':
            _html = '<div class="msgbox">' +
                        '<div class="title">' + readData('msgTitle') + '</div>' +
                        '<div id="msg" class="message">' + readData('msgText') + '</div>' +
                        '<div class="buttons">' +
                            '<button onclick="dismissOKbox();" class="btn-green">OK</button>' +
                        '</div>' +
                    '</div>';
            break;

        case 'response':
            _html = '<div class="reply">' +
                        '<div class="entry"><textarea id="rpy-text" class="mention"></textarea></div>' +
                        '<div class="actions">' +
                            '<span id="rpy-length">256</span>' +
                            '<span id="rpy-draft" style="padding-left: 15px; font-size: 150%;" onclick="loadDraft();"></span>' +
                            '<button id="rpy-kill" class="btn-red">Cancel</button>' +
                            '<button id="rpy-send" class="btn-grey">Send</button>' +
                        '</div>' +
                    '</div>';

        default:
            /* Do Nothing */
    }
    document.getElementById(dialog_id).innerHTML = _html;
    return true;
}
function dismissOKbox() {
    document.getElementById('okbox').innerHTML = '';
    $('#okbox').removeClass('show').addClass('hide');
}
function doShowChan( chan_id ) {
    if ( chan_id === '' || chan_id === undefined ) {
        $('#conversation').removeClass('show').addClass('hide');
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
        var params = new Object();
        params['include_annotations'] = 1;
        params['include_deleted'] = 0;
        params['include_machine'] = 0;
        params['access_token'] = access_token;
        params['include_html'] = 1;
        params['include_read'] = 1;
        params['count'] = 200;

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
        var u_score = 0;
        for ( var i = 0; i < data.length; i++ ) {
            u_score = (( data[i].follows_you ) ? 2 : 0) + (( data[i].is_follower ) ? 2 : 0) + 1;
            window.users[data[i].id] = { avatar_url: data[i].avatar_image.url,
                                         name: data[i].name,
                                         username: data[i].username,
                                         score: u_score
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
                    '<i class="fa fa-recycle"></i>' +
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

        var params = new Object();
        params['access_token'] = access_token;
        params['ids'] = id_list;
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
    var params = new Object();
    params['nicerank'] = 0.1;
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
                    saveData( ds[i].user_id + '_rank', ds[i].rank );
                    saveData( ds[i].user_id + '_human', ds[i].is_human );
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
        var params = new Object();
        params['access_token'] = access_token;
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
        var params = new Object();
        params['access_token'] = access_token;
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
        var params = new Object();
        params['access_token'] = access_token;
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
                    $('#' + itms[i].id).removeClass('plain').addClass('highlight');
                    document.getElementById( itms[i].id ).innerHTML = '<i class="fa fa-star"></i>';
                }
            } else {
                if( $('#' + itms[i].id).hasClass('highlight') ) {
                    $('#' + itms[i].id).removeClass('highlight').addClass('plain');
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
        var params = new Object();
        params['access_token'] = access_token;
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

function doShowConv( post_id ) {
    if ( post_id === '' || post_id === undefined ) {
        $('#conversation').removeClass('show').addClass('hide');
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
        var params = new Object();
        params['access_token'] = access_token;
        params['include_annotations'] = 1;
        params['include_deleted'] = 0;
        params['include_muted'] = 1;
        params['include_html'] = 1;
        params['count'] = 200;

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
        showWaitState('chat_posts', 'Reading Posts');

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
            addPostItem( data[i].id, data[i].created_at, html, is_mention, followed, post_by,
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
            $('#hd-activity').removeClass( "hide" ).addClass( "show" );
            $('#hd-spacer').removeClass( "show" ).addClass( "hide" );
        }
    } else {
        if( $('#hd-activity').hasClass('show') ) {
            $('#hd-activity').removeClass( "show" ).addClass( "hide" );
            $('#hd-spacer').removeClass( "hide" ).addClass( "show" );
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
            if ($(div).length) {
                toggleClassIfExists(div,'show','hide');
            }
        }
    } else {
        toggleClassIfExists(post_id + '-rsp' + tl,'hide','show',true);
    }
}
function showHideResponse() {
    if( $('#response').hasClass('hide') ) {
        $('#response').removeClass('hide').addClass('show');
        var reply_text = getReplyText(),
            draft_text = readStorage('draft');

        document.getElementById('rpy-draft').innerHTML = ( draft_text ) ? '<i class="fa fa-inbox"></i>' : '&nbsp;';
        document.getElementById('rpy-length').innerHTML = readData('post_length');
        document.getElementById('rpy-text').value = reply_text;
        document.getElementById('rpy-text').focus();
        if ( reply_text !== '' ) {
            var caret_pos = reply_text.indexOf("\n");
            if ( caret_pos < 1 ) { caret_pos = reply_text.length; }
            setCaretToPos(document.getElementById("rpy-text"), caret_pos);
        }
        calcReplyCharacters();

    } else {
        toggleClassIfExists('autocomp','show','hide');        
        $('#response').removeClass('show').addClass('hide');
        saveData('in_reply_to', '0');
    }
}
function getNewPostCount() {
    var i = 0;
    for ( post_id in window.posts ) {
        if ( window.posts[post_id] !== false ) {
            if ( window.posts[post_id].is_new === false && window.posts[post_id].is_conversation === false ) { i++; }
        }
    }
    return i;
}
function getReplyText() {
    var _id = readData('in_reply_to');
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
        $('#gallery').removeClass( "hide" ).addClass( "show" );
    }
}
function doLogout() {
    deleteStorage( 'access_token' );
    deleteStorage( 'username' );
    deleteStorage( 'user_id' );
    deleteStorage( 'name' );

    window.location = window.redirect;
}
function loadDraft() {
    var draft_text = readStorage('draft'),
        reply_to = parseInt(readStorage('draft_reply_to'));

    if ( draft_text ) {
        document.getElementById('rpy-draft').innerHTML = '&nbsp;';
        document.getElementById('rpy-text').value = draft_text;
        saveData('in_reply_to', reply_to);

        deleteStorage('draft_reply_to');
        deleteStorage('draft');
    }
}
function killPost() {
    if( $('#response').hasClass('show') ) {
        if ( document.getElementById( 'rpy-text' ).value.trim().length > 0 ) { showSaveDraft(); } else { showHideResponse(); }
    }
}
function setLiveTimestamps() {
    var value = ( readStorage('show_live_timestamps') === 'N' ) ? 'Y' : 'N';
    saveStorage( 'show_live_timestamps', value );

    var nav_text = document.getElementById("show_live").innerHTML,
        chk_icon = ' <i class="fa fa-check"></i>';
    nav_text = nav_text.replace(chk_icon, '');
    if ( value === 'Y' ) { nav_text += chk_icon; }
    document.getElementById("show_live").innerHTML = nav_text;

    /* Kill or Show the TimeStamps */
    for ( post_id in window.posts ) {
        var itms = document.getElementsByName( post_id + "-time" );
        var tStr = ( value === 'Y' ) ? humanized_time_span( window.posts[post_id].created_at ) : '<em>more...</em>',
            html = '';

        for ( var i = 0; i < itms.length; i++ ) {
            html = document.getElementById( itms[i].id ).innerHTML;
            if ( html != tStr ) { document.getElementById( itms[i].id ).innerHTML = tStr; } else { break; }
        }
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

    var nav_text = document.getElementById("show_hideimg").innerHTML,
        chk_icon = ' <i class="fa fa-check"></i>';
    nav_text = nav_text.replace(chk_icon, '');
    if ( readStorage('hide_images') === 'Y' ) { nav_text += chk_icon; }
    document.getElementById("show_hideimg").innerHTML = nav_text;
}
function parseEmbedded( post ) {
    var html = '';
    if ( readStorage('hide_images') === 'Y' ) { return html; }
    if ( post.hasOwnProperty('annotations') ) {
        for ( var i = 0; i < post.annotations.length; i++ ) {
            switch ( post.annotations[i].value.type || post.annotations[i].type ) {
                case 'net.app.core.oembed':
                case 'photo':
                    html += '<div id="' + post.id + '-img-' + i + '" class="post-image">' +
                                '<img src="' + post.annotations[i].value.url + '" onclick="showImage(\'' + post.annotations[i].value.url + '\');">' +
                            '</div>';
                    break;

                case 'net.vidcast-app.track-request':
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
    showTimelines();
}
function getPMSummary( before_id ) {
    var access_token = readStorage('access_token');
    before_id = ( before_id === undefined || before_id === NaN ) ? 0 : before_id;
    if ( access_token !== false ) {
        var params = new Object();
        params['access_token'] = access_token;
        params['include_message_annotations'] = 1;
        params['include_recent_message'] = 1;
        params['include_annotations'] = 1;
        params['include_inactive'] = 1;
        params['include_marker'] = 1;
        params['include_read'] = 1;
        params['channel_types'] = 'net.app.core.pm';
        if ( before_id > 0 ) { params['before_id'] = before_id; }
        params['count'] = 100;

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
                                '<h5 class="post-name" style="color: #333; cursor: pointer;" onClick="doShowChan(' + data[i].id + ');">' +
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
        cStr = ' style="color: #333; font-weight: bold; cursor: pointer;"';

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
        $('#dialog').removeClass('show').addClass('hide');
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
        $('#hashbox').removeClass('show').addClass('hide');
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
        var params = new Object();
        params['access_token'] = access_token;
        params['include_annotations'] = 1;
        params['include_html'] = 1;
        params['hashtags'] = name;
        params['count'] = 200;

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
            addPostItem( data[i].id, data[i].created_at, html, is_mention, followed, post_by,
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
    var max_length = parseInt( readData('post_length') ),
        txt_length = getReplyCharCount();
    if ( max_length === NaN || max_length === undefined ) { max_length = 256; }
    var rpy_length = (max_length - txt_length);
    $("#rpy-length").text(rpy_length);

    if ( rpy_length >= 0 && rpy_length <= max_length ) {
        if( $('#rpy-length').hasClass('red') ) { $('#rpy-length').removeClass('red'); }
        if ( rpy_length <= max_length ) { toggleClassIfExists('rpy-send','btn-grey','btn-green'); }
        if ( rpy_length == max_length ) { toggleClassIfExists('rpy-send','btn-green','btn-grey'); }
    } else {
        if( $('#rpy-length').hasClass('red') === false ) { $('#rpy-length').addClass('red'); }
        toggleClassIfExists('rpy-send','btn-green','btn-grey');        
    }
}
function doMuteHash( name ) { muteHashtag(name); }
function showSaveDraft() {
    if( $('#draftbox').hasClass('hide') ) {
        $('#draftbox').removeClass("hide").addClass("show");
    } else {
        $('#draftbox').removeClass("show").addClass("hide");
        document.getElementById('rpy-text').value = '';
        showHideResponse();
    }
}
function saveDraft() {
    var post_text = document.getElementById('rpy-text').value.trim();
    if ( post_text !== '' ) {
        saveStorage( 'draft_reply_to', readData('in_reply_to') )
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
    var elems = document.getElementById("chat_posts").children;
    for( var i = 0; i < elems.length; i++ ) {
        if( $('#' + elems[i].id).hasClass('post-grey') ) { $('#' + elems[i].id).removeClass('post-grey'); }
    }
    if( $('#conv-' + first_id).hasClass('post-grey') === false ) { $('#conv-' + first_id).addClass('post-grey'); }
    if( $('#conv-' + reply_id).hasClass('post-grey') === false ) { $('#conv-' + reply_id).addClass('post-grey'); }
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
    var post_hours = parseInt( readStorage('max_post_age') );
    var post_limit = post_hours * 3600000,
        current_ts = new Date().getTime();

    for ( post_id in window.posts ) {
        if ( window.posts[post_id] !== false ) {
            if ( (current_ts - window.posts[post_id].item_dts) >= post_limit ) {
                var itms = document.getElementsByName( post_id );
                while ( itms.length > 0 ) {
                    var elem = document.getElementById( itms[0].id );
                    elem.parentNode.removeChild(elem);
                }
                delete window.posts[post_id];
            }
        }
    }
}
function setRefreshInterval( interval ) {
    var options = [5, 15, 60, 10000];
    var rrate = parseInt(interval);
    if ( rrate === undefined || isNaN(interval) ) { rrate = 15; }
    saveStorage('refresh_rate', rrate);

    /* Set the Menu Checkboxes */
    for ( var i = 0; i < options.length; i++ ) {
        var nav_text = document.getElementById("ref-" + options[i]).innerHTML,
            chk_icon = ' <i class="fa fa-check"></i>';
        nav_text = nav_text.replace(chk_icon, '');
        if ( options[i] === rrate ) { nav_text += chk_icon; }
        document.getElementById("ref-" + options[i]).innerHTML = nav_text;
    }
}
function setFontSize( size_px ) {
    var options = [12, 14, 16, 20];
    size_px = parseInt(size_px);
    if ( size_px === undefined || isNaN(size_px) ) { size_px = 14; }
    document.body.style.fontSize = size_px + "px";
    saveStorage('font_size', size_px);

    /* Set the Menu Checkboxes */
    for ( var i = 0; i < options.length; i++ ) {
        var nav_text = document.getElementById("fs-" + options[i]).innerHTML,
            chk_icon = ' <i class="fa fa-check"></i>';
        nav_text = nav_text.replace(chk_icon, '');
        if ( options[i] === size_px ) { nav_text += chk_icon; }
        document.getElementById("fs-" + options[i]).innerHTML = nav_text;
    }
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
            $('#' + div_id).removeClass('hide').addClass('show');
            document.getElementById(div_id).innerHTML = _html;
        } else {
            document.getElementById('wait-msg').innerHTML = msg;
        }
    }
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
    return rVal;
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
            { ceiling: 60, text: "in $seconds seconds" },
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

    saveData('msgTitle', 'Muted #' + name);
    saveData('msgText', 'Posts with a hashtag of "' + name + '" will now be muted.');
    if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
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

    saveData('msgTitle', 'Muted ' + name);
    saveData('msgText', 'Posts from "' + name + '" will now be muted.');
    if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
    return true;
}
function isMutedClient( name ) {
    var clients = readMutedClients();
    var name = name.trim();
    if ( name === undefined || name === '' ) { return false; }

    for ( var idx = 0; idx <= clients.length; idx++ ) { if ( clients[idx] === name ) { return true; } }
    return false;    
}
function saveStorage( key, value ) {
    if ( !key || !value ) { return false; }
    if ( value === null ) { return false; }
    if ( hasStorage() ) { localStorage.setItem( key, value ); } else { window.store[key] = value; }
}
function readStorage( key ) {
    if ( !key ) { return false; }
    if ( hasStorage() ) { return localStorage.getItem(key) || false; }
        else { if ( window.store.hasOwnProperty(key) ) { return window.store[key]; } else { return false; }
    }
}
function deleteStorage( key ) {
    if ( !key ) { return false; }
    if ( hasStorage() ) { localStorage.removeItem(key); } else { window.store[key] = false; }
}
function hasStorage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}
function saveData( key, value ) {
    if ( !key || !value ) { return false; }
    if (value === null) { return false; }
    window.store[key] = value;
}
function readData( key ) {
    if ( !key ) { return false; }
    if ( window.store.hasOwnProperty(key) ) { return window.store[key]; } else { return false; }
}