window.network_log = {};
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
    console.log( n, e, t, g, s, msg );
}
function doJSONQuery( endpoint, is_nice, type, parameters, onsuccess, onfail ) {
    var access_token = readStorage('access_token');
    if ( access_token === undefined || access_token === false || access_token === '' ) { return false; }
    var start = new Date().getTime();
    showHideActivity(true);

    var api_url = ( readStorage('nice_proxy') === 'Y' ) ? window.niceURL + '/proxy' : ((is_nice) ? window.niceURL : window.apiURL);
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
    xhr.timeout = 10000;

    xhr.open(type, api_url + endpoint, true);
    if ( access_token ) { xhr.setRequestHeader("Authorization", "Bearer " + access_token); }
    xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhr.send(parameters);
}