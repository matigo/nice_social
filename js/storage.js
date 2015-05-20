function saveStorage( key, value, useStore ) {
    if ( !key || !value ) { return false; }
    if ( value === null ) { return false; }
    
    if ( hasStorage()  && !useStore) { 
        localStorage.setItem( key, value ); 
    } else { 
        window.store[key] = value;
    }
}
function readStorage( key, useStore ) {
    if ( !key ) { return false; }
    
    if ( hasStorage() && !useStore ) { 
        return localStorage.getItem(key) || false;
    } else { 
        if ( window.store.hasOwnProperty(key) ) { 
            return window.store[key]; 
        } else { 
            return false;
        }
    }
}
function deleteStorage( key ) {
    if ( !key ) { return false; }
    
    if ( hasStorage() ) {
        localStorage.removeItem(key);
    } else {
        window.store[key] = false;
    }
}
function hasStorage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}