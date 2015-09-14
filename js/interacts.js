function canRefreshInteract() {
    var rrate = parseInt(readStorage('refresh_rate')),
        rlast = parseInt(readStorage('interact_refresh_last', true));
    var seconds = new Date().getTime() / 1000;
    if ( rlast === undefined || isNaN(rlast) ) { rlast = 0; }
    if ( (seconds-rlast) >= rrate ) {
        saveStorage('interact_refresh_last', seconds, true);
        return true;
    }
    return false;
}
function getInteractions() {
    var access_token = readStorage('access_token');
    if ( canRefreshInteract() === false ) { return false; }
    if ( access_token !== false ) {
        var api_url = ( readStorage('nice_proxy') === 'Y' ) ? window.niceURL + '/proxy' : window.apiURL;
        var params = {
            access_token: access_token,
            interaction_actions: 'follow,repost,star',
            include_annotations: 1,
            include_deleted: 0,
            include_machine: 0,
            include_html: 1,
            count: 200
        };
        $.ajax({
            url: api_url + '/users/me/interactions',
            crossDomain: true,
            data: params,
            type: 'GET',
            success: function( data ) { parseInteractions( data ); },
            error: function (xhr, ajaxOptions, thrownError){ console.log(xhr.status + ' | ' + thrownError); },
            dataType: "json"
        });
    }
}
function parseInteractions( resp ) {
    if ( resp.meta ) {
        if ( resp.meta.code === 200 ) {
            var data = resp.data;

            if ( data ) {
                for ( var i = 0; i < data.length; i++ ) {
                    if ( window.coredata.hasOwnProperty('net.app.interactions') === false ) {
                        window.coredata['net.app.interactions-ts'] = 0;
                        window.coredata['net.app.interactions'] = {};
                    }
                    window.coredata['net.app.interactions'][ data[i].pagination_id ] = data[i];
                    window.coredata['net.app.interactions-ts'] = Math.floor(Date.now() / 1000);
                }
            }
        }
    }
}
function buildInteractionItem( pagination_id ) {
    var data = window.coredata['net.app.interactions'][ pagination_id ];
    var html = '',
        icon = '',
        text = '',
        what = '',
        when = '<span id="' + pagination_id + '-time">' + getTimestamp( data.event_date ).toLowerCase() + '</span>';

    switch ( data.action ) {
        case 'follow':
            icon = 'fa-user-plus';
            what = ' is now following you. Yay!';
            break;

        case 'repost':
            icon = 'fa-retweet';
            text = '<item>' + parseText( data.objects[0] ) + '</item>';
            what = ' reposted <span onClick="doShowConv(' + data.objects[0].id + ');">your post ' + when + '.</span>';
            break;

        case 'star':
            icon = 'fa-star';
            text = '<item>' + parseText( data.objects[0] ) + '</item>';
            what = ' starred <span onClick="doShowConv(' + data.objects[0].id + ');">your post ' + when + '.</span>';
            break;
    }

    window.users[ data.users[0].id ] = { avatar_url: data.users[0].avatar_image.url,
                                               name: data.users[0].name,
                                           username: data.users[0].username,
                                              score: (( data.users[0].follows_you ) ? 2 : 0) + (( data.users[0].is_follower ) ? 2 : 0) + 1
                                    }

    html =  '<div class="pulse-content">' +
                '<i class="fa ' + icon + '"></i> ' + 
                '<span class="post-mention" style="font-weight: bold; cursor: pointer;"' +
                             ' onclick="doShowUser(' + data.users[0].id + ');">@' + data.users[0].username + '</span>' +
                what + text +
            '</div>';
    return html;
}