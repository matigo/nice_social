function canRefreshChannels() {
    var rrate = parseInt(readStorage('refresh_rate')),
        rlast = parseInt(readStorage('chan_refresh_last', true));
    var seconds = new Date().getTime() / 1000;
    if ( rlast === undefined || isNaN(rlast) ) { rlast = 0; }
    if ( (seconds-rlast) >= rrate ) {
        saveStorage('chan_refresh_last', seconds, true);
        return true;
    }
    return false;
}
function doConvReply() {
    addClassIfNotExists('rpy-box', 'pm');
    populateAccountNames();
    showHideResponse();
}
function populateAccountNames() {
    var post_id = document.getElementById( 'rpy-sendto' ).placeholder;
    var data = window.coredata['net.app.core.pm'][ post_id ];
    var my_id = readStorage('user_id');
    var user_list = (data.owner !== undefined) ? '@' + data.owner.username : '';

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
function getChannelMessages( chan_id ) {
    if ( parseInt(chan_id) <= 0 || isNaN(chan_id) ) { return false; }
    var access_token = readStorage('access_token');

    if ( access_token !== false ) {
        toggleClassIfExists('conversation','hide','show');
        showWaitState('chat_posts', 'Accessing App.Net');
        var params = {
            include_annotations: 1,
            include_deleted: 1,
            include_machine: 0,
            include_marker: 1,
            access_token: access_token,
            include_html: 1,
            include_read: 1,
            count: 200           
        };
        doJSONQuery( '/channels/' + chan_id + '/messages', false, 'GET', params, parseChannel, '' );
    }
}
function parseChannel( data ) {
    if ( data ) {
        var my_id = readStorage('user_id');
        var html = '',
            side = '';
        var marker_name = '',
            marker_id = '';
        showWaitState('chat_posts', 'Reading Posts');

        document.getElementById('chat_count').innerHTML = '(' + data.length + ' ' + getLangString('posts') + ')';
        document.getElementById('rpy-sendto').placeholder = String(data[0].channel_id);
        for ( var i = 0; i < data.length; i++ ) {
            showWaitState('chat_posts', getLangString('reading_posts') + ' (' + (i + 1) + '/' + data.length + ')');

            if ( marker_name === '' ) {
                marker_name = 'channel:' + data[i].channel_id;
                marker_id = (data[i].id || data[i].pagination_id);
            }

            if ( data[i].is_deleted === undefined ) {
                side = ( data[i].user.id === my_id ) ? 'right' : 'left';
                html += '<div id="conv-' + data[i].id + '" class="post-item ' + side + '">' +
                            '<div id="' + data[i].id + '-po" class="post-avatar">' +
                                '<img class="avatar-round"' +
                                    ' onClick="doShowUser(' + data[i].user.id + ');"' +
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
        }
        document.getElementById('chat_posts').innerHTML = html;
        toggleClassIfExists('conversation','hide','show');
        markChannelRead( marker_name, marker_id );
    }
}
function markChannelRead( marker_name, post_id ) {
    var access_token = readStorage('access_token');

    if ( access_token !== false ) {
        var params = {
            access_token: access_token,
            name: marker_name,
            id: post_id
        };
        doJSONQuery( '/posts/marker', false, 'POST', params, parseMarkUpdate, '' );
    }
}
function parseMarkUpdate( data ) {
    if ( data ) {
        if ( readStorage('debug_on', false) === 'Y' ) {
            console.log('Channel Marker [' + data.name + '] id: ' + data.id + ' last_read_id: ' + data.last_read_id);
        }
    }
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
            url: window.apiURL + '/channels/' + channel_id + '/messages?include_annotations=1',
            crossDomain: true,
            data: buildJSONChannelObject(text, destinations, in_reply_to),
            type: 'POST',
            success: function( data ) { parseChannelPost(data); },
            error: function (xhr, ajaxOptions, thrownError){
                saveStorage('msgTitle', getLangString('err_wcptitle'), true);
                if ( xhr.status > 0 ) {
                    saveStorage('msgText', getLangString('err_wcpline1'), true);
                } else {
                    saveStorage('msgText', getLangString('err_wcpline2'), true);
                }
                if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
            }
        });
    }
}
function parseChannelPost( data ) {
    if ( parseMeta(data.meta) ) {
        ds = data.data;
        ds.is_deleted = false;
        window.coredata['net.app.core.pm'][ ds.channel_id ].recent_message = ds;
        window.coredata['net.app.core.pm'][ ds.channel_id ].recent_message_id = ds.id;
        window.coredata['net.app.core.pm'][ ds.channel_id ].counts.messages++;
        markChannelRead( 'channel:' + ds.channel_id, ds.id );

        var el = document.getElementById(ds.channel_id + '-pms');
        el.parentNode.removeChild(el);
        toggleClassIfExists('conversation', 'show', 'hide');
        saveStorage( 'net.app.core.pm-ts', '*', true );
        window.store['location'] = false;
        showHideResponse();
    }
}
function getPMUnread() {
    if ( canRefreshChannels() === false ) { return false; }
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
            count: 200
        };
        doJSONQuery( '/channels', false, 'GET', params, parsePMData, '' );
    }
}
function getPMSummary( before_id ) {
    var access_token = readStorage('access_token');
    before_id = ( before_id === undefined || before_id === NaN ) ? 0 : before_id;
    if ( before_id === 0 ) { if ( canRefreshChannels() === false ) { return false; } }
    if ( access_token !== false ) {
        var api_url = ( readStorage('nice_proxy') === 'Y' ) ? window.niceURL + '/proxy' : window.apiURL;
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
            count: 200
        };
        doJSONQuery( '/channels', false, 'GET', params, parsePMData, '' );
    }
}
function parsePMResults( ds ) {
    if ( ds.meta ) {
        if ( ds.meta.code === 200 ) {
            parsePMData(ds.data);
            if ( ds.meta.more === true ) { getPMSummary(ds.meta.min_id); }
        } else {
            saveStorage('msgTitle', getLangString('err_pmrtitle'), true);
            if ( ds.meta.code === 400 || ds.meta.code === 401 || ds.meta.code === 403 ) {
                saveStorage('msgText', getLangString('err_pmrline1'), true);
            } else {
                saveStorage('msgText', getLangString('err_pmrline2'), true);
            }
            if ( constructDialog('okbox') ) { toggleClassIfExists('okbox','hide','show'); }
        }
    }
}
function parsePMData( data ) {
    if ( data ) {
        var my_id = parseInt(readStorage('user_id'));
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
                pObj['recent_message']['created_at'] = '';
            }

            if ( readStorage('nice_proxy') === 'Y' ) {
                for ( _id in pObj['accounts'] ) {
                    if ( window.users.hasOwnProperty(_id) === false ) {
                        window.users[ _id ] = { avatar_url: '',
                                                      name: pObj['accounts'][_id].username,
                                                  username: pObj['accounts'][_id].username,
                                                     score: 5
                                                };
                    }
                }
            } else {
                if ( pObj.hasOwnProperty('writers') ) {
                    for ( _id in pObj['writers']['user_ids'] ) {
                        var uid = parseInt(pObj['writers']['user_ids'][_id]);
                        if ( window.users.hasOwnProperty(uid) === false && uid !== my_id ) {
                            user_list.push(pObj['writers']['user_ids'][_id]);
                        }
                    }
                }
                if ( user_list.length > 100 ) {
                    getAccountNames( user_list );
                    user_list = [];
                }
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
    if ( readStorage('nice_proxy') === 'Y' ) {
        for ( user_id in data.accounts ) {
            if ( user_id !== my_id ) {
                if ( user_list !== '' ) { user_list += ', '; }
                user_list += data.accounts[user_id].username;
            }
        }
        if ( user_list !== '' ) { user_list += ' &amp; ' + getLangString('you'); }

    } else {
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
            if ( writer_list[i] !== my_id ) {
                if ( user_list !== '' ) { user_list += ', '; }
                if ( window.users.hasOwnProperty(writer_list[i]) ) {
                    user_name = window.users[writer_list[i]].username;
                } else {
                    user_name = writer_list[i];
                }
                user_list += user_name;
            }
        }
        user_list = user_list.ireplaceAll(', , ', ', ') + ' &amp; ' + getLangString('you');
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
    var html = post.recent_message.html.replaceAll('<a href=', '<a target="_blank" href=', '') + ' ',
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

    if ( post.recent_message.is_deleted === true ) { return '{' + getLangString('message_gone') + '}'; }

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