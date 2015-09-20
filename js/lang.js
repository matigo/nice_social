window.corelang = {};
function readLangFile( lang_cd ) {
    var version = getUniqueVersion();
    var xhr = new XMLHttpRequest();
    xhr.open("GET", '/js/lang/' + lang_cd + '.json?v=' + version, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if( xhr.readyState == 4 && xhr.status == 200 ) {
            switch ( xhr.status ) {
                case 200:
                    var data = JSON.parse( xhr.responseText );
                    if ( data ) {
                        for ( var item in data ) { window.corelang[item] = data[item]; }
                        return true;
                    }

                default:
                    if ( lang_cd !== 'en' ) { return readLangFile('en'); }
                    return false;
            }
        }
    }
    xhr.send();
}
function getLangString( key ) {
    if ( window.corelang.hasOwnProperty( key ) ) { return window.corelang[key] } else { return ''; }
}
function getUniqueVersion() {
    var date = new Date();
    return date.toString();
}