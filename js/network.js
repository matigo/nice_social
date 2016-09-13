window.network_log = {};
window.links = {};
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
function writeNetworkLog( e, n, t, g, s, msg ) {
    var idx = window.network_log.length;
    if ( idx === undefined ) { idx = 0; }
    window.network_log[idx] = { server: n,
                                endpoint: e,
                                rspTime: t,
                                good: g,
                                status: s,
                                message: msg
                               };
    window.network_log.length = idx + 1;
    /* console.log( n, e, t, g, s, msg ); */
}
function readNetworkLog(items) {
    if ( window.network_log.length > 0 && items > 0 ) {
        var data = {},
            idx = 0;
        var min_i = ( (window.network_log.length - 1) - items );
        if ( min_i < 0 ) { min_i = 0; }
        for ( var i = (window.network_log.length - 1); i >= min_i; i-- ) {
            data[idx] = window.network_log[i];
            idx++;
        }
        return data;
    }
    return false;
}
function doJSONQuery( endpoint, is_nice, type, parameters, onsuccess, onfail ) {
    var access_token = readStorage('access_token');
    var start = new Date().getTime();
    showHideActivity(true);

    var api_url = ((is_nice) ? window.niceURL : ((readStorage('nice_proxy') === 'Y') ? window.niceURL + '/proxy' : window.apiURL));
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if( xhr.readyState === 4 ) {
            var end = new Date().getTime();
            switch ( xhr.status ) {
                case 200:
                    var rsp = JSON.parse( xhr.responseText );
                    if ( rsp ) { onsuccess(rsp.data); }
                    break;
            }
            writeNetworkLog( endpoint, api_url, (end - start), ((xhr.status === 200) ? true : false), xhr.status, '' );
            showHideActivity(false);
        }
    };

    xhr.onerror = function() {
        var end = new Date().getTime();
        writeNetworkLog( endpoint, api_url, (end - start), false, xhr.status, 'Not Connected.' );
        console.log('Not Connected. Will Wait.');
        showHideActivity(false);
    }
    xhr.ontimeout = function () {
        var end = new Date().getTime();
        writeNetworkLog( endpoint, api_url, (end - start), false, xhr.status, 'Not Connected.' );
        console.log('Timeout Occurred Accessing [' + api_url + endpoint + ']. Will Wait.');
        if ( onfail !== '' ) { onfail(); }
        showHideActivity(false);
    }
    xhr.timeout = (endpoint.substr(1, 8) === 'channels') ? 60000 : 30000;
    var suffix = '';
    if ( type === 'GET' ) { suffix = jsonToQueryString(parameters); }

    xhr.open(type, api_url + endpoint + suffix, true);
    if ( is_nice === false ) {
        if ( access_token ) { xhr.setRequestHeader("Authorization", "Bearer " + access_token); }
        xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
    }
    xhr.send(JSON.stringify(parameters));
}
function jsonToQueryString(json) {
    return '?' +  Object.keys(json).map(function(key) { return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]); }).join('&');
}
function unshorten( link ) {
    if ( link === undefined || link === '' ) { return false; }
    if ( checkLink(link) ) { return false; }
    var params = { uri: link };
    var requrl = 'https://unroll.kbys.me/unroll' + jsonToQueryString(params);;

    var xhr = new XMLHttpRequest();
    xhr.open("GET",  requrl, true);
    xhr.onreadystatechange = function() {
        if( xhr.readyState == 4 && xhr.status == 200 ) {
            switch ( xhr.status ) {
                case 200:
                    var data = JSON.parse( xhr.responseText );
                    if ( data ) {
                        if ( data.error === false ) { writeLink( data.uri, data.unrolled_uri ); }
                    }
                    break;

                default:
                    return false;
            }
        }
    }
    xhr.send();
}
function checkLink( link ) { return window.links.hasOwnProperty(link.toLowerCase() ); }
function writeLink( orig, final ) { window.links[orig.toLowerCase()] = final.toLowerCase(); }
function readLink( link ) {
    if ( window.links.hasOwnProperty(link.toLowerCase()) ) { return window.links[link.toLowerCase()]; } else { return link.toLowerCase(); }
}