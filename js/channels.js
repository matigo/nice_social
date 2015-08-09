function doConvReply() {
    addClassIfNotExists('rpy-box', 'pm');
    populateAccountNames();
    showHideResponse();
}
function populateAccountNames() {
    var post_id = document.getElementById( 'rpy-sendto' ).placeholder;
    var data = window.coredata['net.app.core.pm'][ post_id ];
    var my_id = readStorage('user_id');
    var user_list = '@' + data.owner.username;

    /* Construct the User List */
    for ( var i = 0; i < data.writers.user_ids.length; i++ ) {
        if ( user_list !== '' ) { user_list += ( i === (data.writers.user_ids.length - 1) ) ? ' & ' : ', '; }
        if ( window.users.hasOwnProperty(data.writers.user_ids[i]) ) {
            user_name = '@' + window.users[data.writers.user_ids[i]].username;
        } else {
            user_name = data.writers.user_ids[i];
        }
        user_list += user_name;
    }

    /* Populate the Textbox */
    document.getElementById( 'rpy-sendto' ).value = user_list;
}
function buildJSONChannelObject( text, destinations, in_reply_to ) {
    var access_token = readStorage('access_token');
    var oembed = false;
    var dests = false;
    var rVal = false;

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

        /* Who Is Going to Receive This Message */
        var accounts = destinations.replaceAll('&', ',').split(',');
        for ( i = 0; i < accounts.length; i++ ) {
            if ( dests === false ) { dests = []; }
            dests.push( accounts[i] );
        }

        /* Do We Have Location Data? */
        if ( window.store['location'] !== undefined && window.store['location'] !== false ) {
            if ( oembed === false ) { oembed = []; }
            oembed.push(window.store['location']);
        }

        var params = {
            access_token: access_token,
            destinations: dests,
            text: text,
            entities: {
                parse_markdown_links: true,
                parse_links: true             
            }
        };
        if ( oembed !== false ) { params['annotations'] = oembed; }
        if ( parseInt(in_reply_to) > 0 ) { params['reply_to'] = in_reply_to; }
        rVal = JSON.stringify(params);
    }
    return rVal;
}
function writeChannelPost( text, channel_id, destinations, in_reply_to ) {
    if ( checkIfRepeat(text) === false ) { return false; }
    var access_token = readStorage('access_token');
    saveStorage('last_posttext', text, true);
    saveStorage('in_reply_to', '0');

    if ( access_token !== false ) {
        if ( channel_id <= 0 ) { channel_id = 'pm'; }
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("Authorization", "Bearer " + access_token);
                xhr.setRequestHeader("Content-Type", "application/json");
                return true;
            }
        });
        $.ajax({
            url: window.apiURL + '/channels/' + channel_id + '/messages',
            crossDomain: true,
            data: buildJSONChannelObject(text, destinations, in_reply_to),
            type: 'POST',
            success: function( data ) { parseChannelPost(data); },
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
function parseChannelPost( data ) {
    if ( parseMeta(data.meta) ) {
        ds = data.data;
        window.coredata['net.app.core.pm'][ ds.channel_id ].recent_message = ds;
        window.coredata['net.app.core.pm'][ ds.channel_id ].recent_message_id = ds.id;
        window.coredata['net.app.core.pm'][ ds.channel_id ].counts.messages++;

        var el = document.getElementById(ds.channel_id + '-pms');
        el.parentNode.removeChild(el);
        $( "#pms" ).prepend( buildPMItem('net.app.core.pm', ds.channel_id) );
        window.store['location'] = false;
        toggleClassIfExists('conversation', 'show', 'hide');
        showHideResponse();
    }
}
function getPMUnread() {
    var access_token = readStorage('access_token');
    if ( access_token !== false ) {
        var params = {
            access_token: access_token,
            include_message_annotations: 1,
            include_recent_message: 1,
            include_annotations: 1,
            include_inactive: 1,
            include_deleted: 1,
            include_marker: 1,
            include_read: 0,
            channel_types: 'net.app.core.pm',
            count: 100
        };
        $.ajax({
            url: window.apiURL + '/channels',
            crossDomain: true,
            data: params,
            success: function( data ) { parsePMResults( data ); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    }
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
            include_deleted: 1,
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
            success: function( data ) { parsePMResults( data ); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    }
}
function parsePMResults( ds ) {
    if ( ds.meta ) {
        if ( ds.meta.code === 200 ) {
            parsePMData(ds.data);
            if ( ds.meta.more === true ) { getPMSummary(ds.meta.min_id); }
        } else {
            alert("Uh Oh. We've Got a [" + ds.meta.code + "] from App.Net");
        }
    }
}
function parsePMData( data ) {
    if ( data ) {
        var user_list = [];
        for ( var i = 0; i < data.length; i++ ) {
            if ( window.coredata.hasOwnProperty( data[i].type ) === false ) {
                window.coredata[ data[i].type + '-ts' ] = 0;
                window.coredata[ data[i].type ] = {};
            }
            var pObj = data[i];
            if ( pObj.hasOwnProperty('recent_message') ) {
                if ( pObj.recent_message.hasOwnProperty('is_deleted') === false ) { pObj.recent_message['is_deleted'] = false; }
            } else {
                pObj['recent_message'] = {};
                pObj['recent_message']['is_deleted'] = true;
            }
            if ( pObj.hasOwnProperty('writers') ) {
                for ( _id in pObj['writers']['user_ids'] ) {
                    if ( user_list.indexOf(pObj['writers']['user_ids'][_id]) < 0 ) { user_list.push(pObj['writers']['user_ids'][_id]); }
                }
            }
            if ( user_list.length > 100 ) {
                getAccountNames( user_list );
                user_list = [];
            }
            window.coredata[ data[i].type ][ data[i].id ] = pObj;
            window.coredata[ data[i].type + '-ts' ] = Math.floor(Date.now() / 1000);
        }
        if ( user_list.length > 0 ) { getAccountNames( user_list ); }
    }
}
function sortPMList() {
    var sort_list = function (date1, date2) {
        if (date1 > date2) return 1;
        if (date1 < date2) return -1;
        return 0;
    };
    var data = [];
    for ( post_id in window.coredata['net.app.core.pm'] ) {
        if ( window.coredata['net.app.core.pm'][post_id].hasOwnProperty('recent_message') ) {
            if ( window.coredata['net.app.core.pm'][post_id].recent_message.is_deleted !== true ) {
                data.push(window.coredata['net.app.core.pm'][post_id].recent_message.created_at);
            }
        }
    }
    return data.sort(sort_list);
}
function buildPMItem( post_type, post_id ) {
    var data = window.coredata[ post_type ][ post_id ];
    var msgs = ' (' + addCommas(data.counts.messages) + ' Message' + ((data.counts.messages > 1 ) ? 's' : '') + ')';
    var post_time = ( data.recent_message.is_deleted === false ) ? getTimestamp( data.recent_message.created_at ) : '';
    var my_id = readStorage('user_id');
    var user_list = '';
    var html = '';

    /* Do Nothing If It's An Empty PM */
    var writers = ( data.writers.you ) ? 1 : 0;
        writers += data.writers.user_ids.length;
    if ( writers <= 1 ) { return false; }

    /* Construct the User List */
    var writer_list = [];
    for ( var i = 0; i < data.writers.user_ids.length; i++ ) {
        if ( writer_list.indexOf(data.writers.user_ids[i]) === -1 ) { writer_list.push(data.writers.user_ids[i]); }
    }
    if ( data.hasOwnProperty('owner') ) {
        if ( writer_list.indexOf(data.owner.id) === -1 ) { writer_list.push(data.owner.id); }
    }
    if ( data.hasOwnProperty('recent_message') ) {
        if ( data.recent_message.is_deleted !== true ) {
            if ( writer_list.indexOf(data.recent_message.user.id) === -1 ) { writer_list.push(data.recent_message.user.id); }
        }
    }

    for ( var i = 0; i < writer_list.length; i++ ) {
        if ( user_list !== '' ) { user_list += ( i === (writer_list.length - 1) ) ? ' &amp; ' : ', '; }
        if ( writer_list[i] === my_id ) {
            user_list += 'You';
        } else {
            if ( window.users.hasOwnProperty(writer_list[i]) ) {
                user_name = window.users[writer_list[i]].username;
            } else {
                user_name = writer_list[i];
            }
            user_list += user_name;
        }
    }

    /* Determine the Post Type and Build Accordingly */
    switch ( post_type ) {
        case 'net.app.core.pm':
            var avatar = ' src="' + window.location.href  + 'img/deleted-user-icon.png"';
            if ( data.recent_message.is_deleted === false ) {
                var avatar = ' onClick="doShowUser(' + ( data.recent_message.user.id || data.user.id ) + ');"' +
                             ' src="' + ( data.recent_message.user.avatar_image.url || data.user.avatar_image.url ) + '"';
            }

            html =  '<div id="' + data.id + '-po" class="post-avatar">' +
                        '<img class="avatar-round"' + avatar + '>' +
                    '</div>' +
                    '<div id="' + data.id + '-dtl" class="post-content">' +
                        '<h5 class="post-name" style="cursor: pointer;" onClick="doShowChan(' + data.id + ');">' +
                            '<span id="' + data.id + '-ni">' + user_list + msgs + '</span>' +
                        '</h5>' +
                        parseRecentText( data ) +
                        '<p class="post-time">' +
                            '<em id="' + data.id + '-time-pms" name="' + data.id + '-time"' +
                                 ' onClick="doShowChan(' + data.id + ');">' + post_time + '</em>' +
                        '</p>' +
                    '</div>';
            break;
    }

    return html;
}
function parseRecentText( post ) {
    var html = post.recent_message.html + ' ',
        name = '',
        cStr = ' style="font-weight: bold; cursor: pointer;"';
    var replaceHtmlEntites = (function() {
        var translate_re = /&(#128406|#127996);/g,
            translate = {
                '#128406': '<i class="fa fa-hand-spock-o"></i>',
                '#127996': ''
            },
            translator = function($0, $1) { return translate[$1]; };

        return function(s) { return s.replace(translate_re, translator); };
    })();

    if ( post.recent_message.is_deleted === true ) { return '{Message Deleted}'; }

    var words = post.recent_message.text.split(" ");
    switch ( words[0] ) {
        case '/me':
            html = '<i class="fa fa-dot-circle-o"></i> ' +
                   html.replace(words[0], '<em onClick="doShowUser(' + post.user.id + ');">' + post.recent_message.user.username + '</em>' );
            break;

        case '/slap':
        case '/slaps':
        case '/bitchslap':
        case '/bitchslaps':
            html = '<i class="fa fa-hand-paper-o"></i> ' +
                   '<em onClick="doShowUser(' + post.recent_message.user.id + ');">' + post.recent_message.user.username + '</em> slaps ';
            var ptxt = post.recent_message.text.ireplaceAll(words[0], ''),
                tool = 'a large trout';
            if ( post.recent_message.entities.mentions.length > 0 ) {
                for ( var i = 0; i < post.recent_message.entities.mentions.length; i++ ) {
                    if ( i > 0 && i < (post.recent_message.entities.mentions.length - 1) ) { html += ', '; }
                    if ( i > 0 && i == (post.recent_message.entities.mentions.length - 1) ) { html += ' and '; }
                    html += '<span class="post-mention" style="font-weight: bold; cursor: pointer;"' +
                                 ' onclick="doShowUser(' + post.recent_message.entities.mentions[i].id + ');">' +
                                 '@' + post.recent_message.entities.mentions[i].name + '</span>';
                    ptxt = ptxt.ireplaceAll('@' + post.recent_message.entities.mentions[i].name, '');
                }
            }
            if ( ptxt.trim() !== '' ) { tool = ptxt.trim(); }
            html += ' around a bit with ' + tool;
            break;

        default:
            /* Do Nothing */
    }

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

    /* Parse the HTML for Characters Like the Vulcan Salute */
    html = replaceHtmlEntites(html);
    html = parseMarkdown( html );

    /* Return the Properly Formatted HTML */
    return html;
}